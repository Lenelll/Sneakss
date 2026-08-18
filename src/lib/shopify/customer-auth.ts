import "server-only";

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const AUTH_SCOPE = "openid email customer-account-api:full";
const CALLBACK_PATH = "/account/auth/callback";
const OAUTH_COOKIE = "svgh_customer_oauth";
const REGISTRATION_COOKIE = "svgh_customer_registration";
const SESSION_COOKIE = "svgh_customer_session";
const SESSION_CHUNK_SIZE = 2_800;
const MAX_SESSION_CHUNKS = 8;
const OAUTH_MAX_AGE_SECONDS = 20 * 60;
const REGISTRATION_MAX_AGE_SECONDS = 30 * 60;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60_000;
const CLOCK_SKEW_SECONDS = 60;
const DISCOVERY_CACHE_MS = 5 * 60_000;
const FETCH_TIMEOUT_MS = 10_000;
// Cloudflare Workers rejects `redirect: "error"`. Each request below checks
// response.ok, so manual mode still rejects every redirect without following it.
const SHOPIFY_REDIRECT_MODE = "manual" as const;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

interface CustomerAuthConfig {
  readonly shopDomain: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly callbackUrl: URL;
  readonly siteOrigin: string;
  readonly secureCookies: boolean;
}

interface OpenIdDiscovery {
  readonly authorization_endpoint: string;
  readonly token_endpoint: string;
  readonly end_session_endpoint: string;
  readonly issuer: string;
}

interface CustomerApiDiscovery {
  readonly graphql_api: string;
}

interface OAuthTransaction {
  readonly state: string;
  readonly nonce: string;
  readonly expectedEmail: string;
  readonly registration?: PendingCustomerRegistration;
  readonly returnTo: string;
  readonly issuedAt: number;
}

export interface PendingCustomerRegistration {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly returnTo: string;
  readonly issuedAt: number;
}

interface StoredCustomerSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly idToken: string;
  readonly accessTokenExpiresAt: number;
  readonly absoluteExpiresAt: number;
  readonly createdAt: number;
  readonly subject: string;
}

interface TokenResponse {
  readonly access_token: string;
  readonly refresh_token?: string;
  readonly id_token?: string;
  readonly expires_in: number;
}

interface CookieReader {
  get(name: string): { value: string } | undefined;
}

interface CookieWriter {
  set(
    name: string,
    value: string,
    options: {
      readonly httpOnly: boolean;
      readonly secure: boolean;
      readonly sameSite: "lax";
      readonly path: string;
      readonly maxAge: number;
    },
  ): unknown;
}

export interface CustomerSession {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: number;
  readonly subject: string;
}

export type CustomerSessionState =
  | { readonly status: "none" }
  | { readonly status: "refresh-required" }
  | { readonly status: "valid"; readonly session: CustomerSession };

export interface ResolvedCustomerSession extends CustomerSession {
  /**
   * Call this on the response returned by the route handler. It persists a
   * rotated refresh token when the access token was refreshed.
   */
  commit(response: NextResponse): Promise<void>;
}

export class CustomerAuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerAuthConfigurationError";
  }
}

export const CUSTOMER_AUTH_FAILURE_CODES = [
  "transaction-invalid",
  "provider-error",
  "code-missing",
  "state-missing",
  "state-mismatch",
  "discovery-failed",
  "token-invalid-client",
  "token-invalid-grant",
  "token-invalid-token",
  "token-forbidden",
  "token-exchange-failed",
  "token-response-invalid",
  "token-credentials-missing",
  "id-token-invalid",
  "id-token-nonce-invalid",
  "authenticated-email-unavailable",
  "authenticated-email-mismatch",
  "profile-update-failed",
  "session-storage-failed",
  "unexpected",
] as const;

export type CustomerAuthFailureCode =
  (typeof CUSTOMER_AUTH_FAILURE_CODES)[number];

class CustomerAuthFlowError extends Error {
  readonly code: CustomerAuthFailureCode;
  readonly returnTo?: string;

  constructor(
    code: CustomerAuthFailureCode,
    message: string,
    returnTo?: string,
  ) {
    super(message);
    this.name = "CustomerAuthFlowError";
    this.code = code;
    this.returnTo = returnTo;
  }
}

export function getCustomerAuthFailureCode(
  error: unknown,
): CustomerAuthFailureCode {
  return error instanceof CustomerAuthFlowError ? error.code : "unexpected";
}

export function getCustomerAuthReturnTo(error: unknown): string | null {
  return error instanceof CustomerAuthFlowError
    ? safeCustomerReturnTo(error.returnTo ?? null)
    : null;
}

export function isCustomerAuthFailureCode(
  value: string | undefined,
): value is CustomerAuthFailureCode {
  return CUSTOMER_AUTH_FAILURE_CODES.some((code) => code === value);
}

let openIdCache:
  | {
      readonly domain: string;
      readonly expiresAt: number;
      readonly value: OpenIdDiscovery;
    }
  | undefined;

let customerApiCache:
  | {
      readonly domain: string;
      readonly expiresAt: number;
      readonly value: CustomerApiDiscovery;
    }
  | undefined;

const refreshesInFlight = new Map<
  string,
  Promise<StoredCustomerSession | null>
>();

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new CustomerAuthConfigurationError(`${name} is required.`);
  }

  return value;
}

function parseShopDomain(value: string): string {
  const domain = value.trim().toLowerCase();

  if (
    !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain) ||
    domain.includes("://") ||
    domain.includes("/")
  ) {
    throw new CustomerAuthConfigurationError(
      "SHOPIFY_STORE_DOMAIN must be the permanent *.myshopify.com hostname without a scheme or path.",
    );
  }

  return domain;
}

function parseCallbackUrl(value: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new CustomerAuthConfigurationError(
      "SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL must be an absolute URL.",
    );
  }

  const isLocalDevelopment =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (url.protocol !== "https:" && !isLocalDevelopment) {
    throw new CustomerAuthConfigurationError(
      "SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL must use HTTPS outside local development.",
    );
  }

  if (
    url.pathname !== CALLBACK_PATH ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new CustomerAuthConfigurationError(
      `SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL must end exactly in ${CALLBACK_PATH}.`,
    );
  }

  return url;
}

function getConfig(): CustomerAuthConfig {
  const shopDomain = parseShopDomain(
    requiredEnvironmentValue("SHOPIFY_STORE_DOMAIN"),
  );
  const clientId = requiredEnvironmentValue(
    "SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID",
  );
  const clientSecret = requiredEnvironmentValue(
    "SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET",
  );
  const callbackUrl = parseCallbackUrl(
    requiredEnvironmentValue("SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL"),
  );
  const sessionSecret = requiredEnvironmentValue("SESSION_SECRET");

  if (textEncoder.encode(sessionSecret).byteLength < 32) {
    throw new CustomerAuthConfigurationError(
      "SESSION_SECRET must contain at least 32 bytes.",
    );
  }

  return {
    shopDomain,
    clientId,
    clientSecret,
    callbackUrl,
    siteOrigin: callbackUrl.origin,
    secureCookies: callbackUrl.protocol === "https:",
  };
}

export function getCustomerAuthSetupIssues(): readonly string[] {
  const issues: string[] = [];

  for (const name of [
    "SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID",
    "SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET",
    "SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL",
    "SESSION_SECRET",
  ] as const) {
    if (!process.env[name]?.trim()) {
      issues.push(`${name} is missing.`);
    }
  }

  if (issues.length > 0) {
    return issues;
  }

  try {
    getConfig();
  } catch (error) {
    issues.push(
      error instanceof CustomerAuthConfigurationError
        ? error.message
        : "Customer account authentication is not configured correctly.",
    );
  }

  return issues;
}

export function isCustomerAuthConfigured(): boolean {
  return getCustomerAuthSetupIssues().length === 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertHttpsUrl(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} is missing from Shopify discovery.`);
  }

  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error(`${label} from Shopify discovery must use HTTPS.`);
  }

  return url.toString();
}

function assertDiscoveredEndpoint(value: unknown, label: string): string {
  const url = new URL(assertHttpsUrl(value, label));

  // Shopify can return the shop's configured customer-account domain,
  // including a custom vanity domain. It need not match the OIDC issuer.
  // Trust the endpoint from the TLS-protected discovery document while still
  // rejecting credentials, fragments, and unexpected ports.
  if (
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== "443")
  ) {
    throw new Error(`${label} from Shopify discovery is invalid.`);
  }

  return url.toString();
}

function assertShopifyIssuer(value: unknown): string {
  const issuer = new URL(assertHttpsUrl(value, "issuer"));

  if (
    (issuer.hostname !== "shopify.com" &&
      !issuer.hostname.endsWith(".shopify.com")) ||
    issuer.username ||
    issuer.password
  ) {
    throw new Error("issuer from Shopify discovery has an invalid host.");
  }

  return issuer.toString().replace(/\/$/, "");
}

async function fetchWithTimeout(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getOpenIdDiscovery(
  config: CustomerAuthConfig,
): Promise<OpenIdDiscovery> {
  if (
    openIdCache?.domain === config.shopDomain &&
    openIdCache.expiresAt > Date.now()
  ) {
    return openIdCache.value;
  }

  const response = await fetchWithTimeout(
    `https://${config.shopDomain}/.well-known/openid-configuration`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "SneakerVaultGH/1.0",
      },
      cache: "no-store",
      redirect: SHOPIFY_REDIRECT_MODE,
    },
  );

  if (!response.ok) {
    throw new Error("Shopify OpenID discovery failed.");
  }

  const body: unknown = await response.json();

  if (!isObject(body)) {
    throw new Error("Shopify OpenID discovery returned an invalid response.");
  }

  const issuer = assertShopifyIssuer(body.issuer);
  const value: OpenIdDiscovery = {
    authorization_endpoint: assertDiscoveredEndpoint(
      body.authorization_endpoint,
      "authorization_endpoint",
    ),
    token_endpoint: assertDiscoveredEndpoint(
      body.token_endpoint,
      "token_endpoint",
    ),
    end_session_endpoint: assertDiscoveredEndpoint(
      body.end_session_endpoint,
      "end_session_endpoint",
    ),
    issuer,
  };

  openIdCache = {
    domain: config.shopDomain,
    expiresAt: Date.now() + DISCOVERY_CACHE_MS,
    value,
  };

  return value;
}

async function getCustomerApiDiscovery(
  config: CustomerAuthConfig,
): Promise<CustomerApiDiscovery> {
  if (
    customerApiCache?.domain === config.shopDomain &&
    customerApiCache.expiresAt > Date.now()
  ) {
    return customerApiCache.value;
  }

  const response = await fetchWithTimeout(
    `https://${config.shopDomain}/.well-known/customer-account-api`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "SneakerVaultGH/1.0",
      },
      cache: "no-store",
      redirect: SHOPIFY_REDIRECT_MODE,
    },
  );

  if (!response.ok) {
    throw new Error("Shopify Customer Account API discovery failed.");
  }

  const body: unknown = await response.json();

  if (!isObject(body)) {
    throw new Error(
      "Shopify Customer Account API discovery returned an invalid response.",
    );
  }

  const value: CustomerApiDiscovery = {
    graphql_api: assertDiscoveredEndpoint(body.graphql_api, "graphql_api"),
  };

  customerApiCache = {
    domain: config.shopDomain,
    expiresAt: Date.now() + DISCOVERY_CACHE_MS,
    value,
  };

  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid base64url value.");
  }

  const standard = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (standard.length % 4)) % 4);
  return base64ToBytes(standard + padding);
}

function randomBase64Url(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function base64BasicCredentials(clientId: string, clientSecret: string): string {
  return bytesToBase64(textEncoder.encode(`${clientId}:${clientSecret}`));
}

type EncryptedCookiePurpose = "oauth" | "registration" | "session";

async function encryptionKey(
  purpose: EncryptedCookiePurpose,
): Promise<CryptoKey> {
  const secret = requiredEnvironmentValue("SESSION_SECRET");
  const material = textEncoder.encode(
    `sneaker-vault-gh/customer-auth/${purpose}/v1\u0000${secret}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", material);

  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function sealJson(
  value: unknown,
  purpose: EncryptedCookiePurpose,
): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const plaintext = textEncoder.encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: textEncoder.encode(`svgh:${purpose}:v1`),
      tagLength: 128,
    },
    await encryptionKey(purpose),
    plaintext,
  );

  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(
    new Uint8Array(ciphertext),
  )}`;
}

async function openJson(
  value: string,
  purpose: EncryptedCookiePurpose,
): Promise<unknown> {
  const parts = value.split(".");

  if (parts.length !== 3 || parts[0] !== "v1") {
    throw new Error("Unsupported encrypted cookie.");
  }

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64UrlToBytes(parts[1]),
      additionalData: textEncoder.encode(`svgh:${purpose}:v1`),
      tagLength: 128,
    },
    await encryptionKey(purpose),
    base64UrlToBytes(parts[2]),
  );

  return JSON.parse(textDecoder.decode(plaintext)) as unknown;
}

export function safeCustomerReturnTo(
  value: string | null,
  fallback = "/",
): string {
  if (
    !value ||
    value.length > 1_024 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const base = new URL("https://return-to.invalid");
    const parsed = new URL(value, base);

    if (parsed.origin !== base.origin) {
      return fallback;
    }

    if (
      parsed.pathname === "/api" ||
      parsed.pathname.startsWith("/api/") ||
      parsed.pathname === "/account/auth" ||
      parsed.pathname.startsWith("/account/auth/") ||
      parsed.pathname === "/account/sign-in" ||
      parsed.pathname === "/account/sign-up"
    ) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function normalizeCustomerEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.normalize("NFC");

  if (/[\u0000-\u001f\u007f-\u009f]/.test(normalized)) {
    return null;
  }

  const email = normalized.trim().toLowerCase();

  if (
    email.length < 3 ||
    email.length > 254 ||
    /\s/.test(email)
  ) {
    return null;
  }

  const atIndex = email.indexOf("@");

  if (
    atIndex < 1 ||
    atIndex !== email.lastIndexOf("@") ||
    atIndex > 64 ||
    atIndex === email.length - 1
  ) {
    return null;
  }

  const domain = email.slice(atIndex + 1);
  const labels = domain.split(".");

  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length < 1 ||
        label.length > 63 ||
        label.startsWith("-") ||
        label.endsWith("-") ||
        !/^[a-z0-9-]+$/.test(label),
    )
  ) {
    return null;
  }

  return email;
}

export function normalizeCustomerName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.normalize("NFC");

  if (/[\u0000-\u001f\u007f-\u009f]/.test(normalized)) {
    return null;
  }

  const name = normalized.trim().replace(/\s+/g, " ");

  if (
    name.length < 1 ||
    name.length > 64
  ) {
    return null;
  }

  return name;
}

export function isTrustedCustomerAuthPost(request: NextRequest): boolean {
  const originValue = request.headers.get("origin");

  if (!originValue) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    const origin = new URL(originValue).origin;
    return origin === getConfig().siteOrigin;
  } catch {
    return false;
  }
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);

  for (let index = 0; index < length; index += 1) {
    difference |=
      (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

export function customerEmailsMatch(left: unknown, right: unknown): boolean {
  const normalizedLeft = normalizeCustomerEmail(left);
  const normalizedRight = normalizeCustomerEmail(right);

  return Boolean(
    normalizedLeft &&
      normalizedRight &&
      constantTimeEqual(normalizedLeft, normalizedRight),
  );
}

function pendingRegistrationsMatch(
  left: PendingCustomerRegistration,
  right: PendingCustomerRegistration,
): boolean {
  return (
    customerEmailsMatch(left.email, right.email) &&
    left.firstName === right.firstName &&
    left.lastName === right.lastName &&
    left.returnTo === right.returnTo &&
    left.issuedAt === right.issuedAt
  );
}

function standardCookieOptions(
  config: CustomerAuthConfig,
  maxAge: number,
  path: string,
) {
  return {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax" as const,
    path,
    maxAge,
  };
}

function clearCookie(
  writer: CookieWriter,
  config: CustomerAuthConfig,
  name: string,
  path: string,
): void {
  writer.set(name, "", standardCookieOptions(config, 0, path));
}

async function setOAuthTransaction(
  writer: CookieWriter,
  config: CustomerAuthConfig,
  transaction: OAuthTransaction,
): Promise<void> {
  writer.set(
    OAUTH_COOKIE,
    await sealJson(transaction, "oauth"),
    standardCookieOptions(config, OAUTH_MAX_AGE_SECONDS, "/account/auth"),
  );
}

function clearOAuthTransaction(
  writer: CookieWriter,
  config: CustomerAuthConfig,
): void {
  clearCookie(writer, config, OAUTH_COOKIE, "/account/auth");
}

async function setPendingCustomerRegistration(
  writer: CookieWriter,
  config: CustomerAuthConfig,
  registration: PendingCustomerRegistration,
): Promise<void> {
  writer.set(
    REGISTRATION_COOKIE,
    await sealJson(registration, "registration"),
    standardCookieOptions(
      config,
      REGISTRATION_MAX_AGE_SECONDS,
      "/account",
    ),
  );
}

function clearPendingRegistrationCookie(
  writer: CookieWriter,
  config: CustomerAuthConfig,
): void {
  clearCookie(writer, config, REGISTRATION_COOKIE, "/account");
}

function parsePendingCustomerRegistration(
  value: unknown,
): PendingCustomerRegistration | null {
  if (!isObject(value)) {
    return null;
  }

  const firstName = normalizeCustomerName(value.firstName);
  const lastName = normalizeCustomerName(value.lastName);
  const email = normalizeCustomerEmail(value.email);

  if (
    !firstName ||
    !lastName ||
    !email ||
    typeof value.returnTo !== "string" ||
    typeof value.issuedAt !== "number" ||
    !Number.isFinite(value.issuedAt)
  ) {
    return null;
  }

  const age = Date.now() - value.issuedAt;

  if (
    age < -CLOCK_SKEW_SECONDS * 1_000 ||
    age > REGISTRATION_MAX_AGE_SECONDS * 1_000
  ) {
    return null;
  }

  return {
    firstName,
    lastName,
    email,
    returnTo: safeCustomerReturnTo(value.returnTo),
    issuedAt: value.issuedAt,
  };
}

export async function createPendingCustomerRegistration(
  response: NextResponse,
  input: {
    readonly firstName: unknown;
    readonly lastName: unknown;
    readonly email: unknown;
    readonly returnTo: string | null;
  },
): Promise<PendingCustomerRegistration | null> {
  const firstName = normalizeCustomerName(input.firstName);
  const lastName = normalizeCustomerName(input.lastName);
  const email = normalizeCustomerEmail(input.email);

  if (!firstName || !lastName || !email) {
    return null;
  }

  const config = getConfig();
  const registration: PendingCustomerRegistration = {
    firstName,
    lastName,
    email,
    returnTo: safeCustomerReturnTo(input.returnTo),
    issuedAt: Date.now(),
  };
  await setPendingCustomerRegistration(
    response.cookies,
    config,
    registration,
  );
  clearOAuthTransaction(response.cookies, config);
  return registration;
}

export async function readPendingCustomerRegistration(
  request: NextRequest,
): Promise<PendingCustomerRegistration | null> {
  const cookie = request.cookies.get(REGISTRATION_COOKIE)?.value;

  if (!cookie) {
    return null;
  }

  try {
    return parsePendingCustomerRegistration(
      await openJson(cookie, "registration"),
    );
  } catch {
    return null;
  }
}

export function clearPendingCustomerRegistration(
  response: NextResponse,
): void {
  try {
    clearPendingRegistrationCookie(response.cookies, getConfig());
  } catch {
    // No correctly scoped cookie can be cleared without valid configuration.
  }
}

export function clearCustomerAuthTransaction(response: NextResponse): void {
  try {
    clearOAuthTransaction(response.cookies, getConfig());
  } catch {
    // No correctly scoped cookie can be cleared without valid configuration.
  }
}

async function readOAuthTransaction(
  reader: CookieReader,
): Promise<OAuthTransaction | null> {
  const cookie = reader.get(OAUTH_COOKIE)?.value;

  if (!cookie) {
    return null;
  }

  try {
    const value = await openJson(cookie, "oauth");

    if (
      !isObject(value) ||
      typeof value.state !== "string" ||
      typeof value.nonce !== "string" ||
      typeof value.expectedEmail !== "string" ||
      typeof value.returnTo !== "string" ||
      typeof value.issuedAt !== "number"
    ) {
      return null;
    }

    const age = Date.now() - value.issuedAt;

    if (age < -CLOCK_SKEW_SECONDS * 1_000 || age > OAUTH_MAX_AGE_SECONDS * 1_000) {
      return null;
    }

    const expectedEmail = normalizeCustomerEmail(value.expectedEmail);
    const registration =
      value.registration === undefined
        ? undefined
        : parsePendingCustomerRegistration(value.registration);

    if (!expectedEmail || (value.registration !== undefined && !registration)) {
      return null;
    }

    return {
      state: value.state,
      nonce: value.nonce,
      expectedEmail,
      registration: registration ?? undefined,
      returnTo: safeCustomerReturnTo(value.returnTo),
      issuedAt: value.issuedAt,
    };
  } catch {
    return null;
  }
}

function sessionChunkName(index: number): string {
  return `${SESSION_COOKIE}.${index}`;
}

async function setStoredSession(
  writer: CookieWriter,
  config: CustomerAuthConfig,
  session: StoredCustomerSession,
): Promise<void> {
  const sealed = await sealJson(session, "session");
  const chunks: string[] = [];

  for (let index = 0; index < sealed.length; index += SESSION_CHUNK_SIZE) {
    chunks.push(sealed.slice(index, index + SESSION_CHUNK_SIZE));
  }

  if (chunks.length === 0 || chunks.length > MAX_SESSION_CHUNKS) {
    throw new Error("The encrypted customer session is too large.");
  }

  const maxAge = Math.max(
    0,
    Math.min(
      SESSION_MAX_AGE_SECONDS,
      Math.floor((session.absoluteExpiresAt - Date.now()) / 1_000),
    ),
  );
  const options = standardCookieOptions(config, maxAge, "/");

  chunks.forEach((chunk, index) => {
    writer.set(sessionChunkName(index), chunk, options);
  });
  writer.set(`${SESSION_COOKIE}.count`, String(chunks.length), options);

  for (let index = chunks.length; index < MAX_SESSION_CHUNKS; index += 1) {
    clearCookie(writer, config, sessionChunkName(index), "/");
  }
}

function clearStoredSession(
  writer: CookieWriter,
  config: CustomerAuthConfig,
): void {
  clearCookie(writer, config, `${SESSION_COOKIE}.count`, "/");

  for (let index = 0; index < MAX_SESSION_CHUNKS; index += 1) {
    clearCookie(writer, config, sessionChunkName(index), "/");
  }
}

function isStoredCustomerSession(
  value: unknown,
): value is StoredCustomerSession {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === "string" &&
    value.refreshToken.length > 0 &&
    typeof value.idToken === "string" &&
    value.idToken.length > 0 &&
    typeof value.accessTokenExpiresAt === "number" &&
    Number.isFinite(value.accessTokenExpiresAt) &&
    typeof value.absoluteExpiresAt === "number" &&
    Number.isFinite(value.absoluteExpiresAt) &&
    typeof value.createdAt === "number" &&
    Number.isFinite(value.createdAt) &&
    typeof value.subject === "string" &&
    value.subject.length > 0
  );
}

async function readStoredSession(
  reader: CookieReader,
): Promise<StoredCustomerSession | null> {
  const countValue = reader.get(`${SESSION_COOKIE}.count`)?.value;
  const count = Number.parseInt(countValue ?? "", 10);

  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > MAX_SESSION_CHUNKS
  ) {
    return null;
  }

  let sealed = "";

  for (let index = 0; index < count; index += 1) {
    const chunk = reader.get(sessionChunkName(index))?.value;

    if (!chunk) {
      return null;
    }

    sealed += chunk;
  }

  try {
    const session = await openJson(sealed, "session");

    if (!isStoredCustomerSession(session)) {
      return null;
    }

    if (
      session.createdAt > Date.now() + CLOCK_SKEW_SECONDS * 1_000 ||
      session.absoluteExpiresAt <= Date.now() ||
      session.absoluteExpiresAt - session.createdAt >
        (SESSION_MAX_AGE_SECONDS + CLOCK_SKEW_SECONDS) * 1_000
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function parseJwtPart(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(
    textDecoder.decode(base64UrlToBytes(value)),
  );

  if (!isObject(parsed)) {
    throw new Error("Invalid JWT payload.");
  }

  return parsed;
}

// Shopify returns this token directly from its authenticated token endpoint.
// Its Customer Account flow uses the payload to bind the response to the
// original authorization request through the nonce.
function assertIdTokenNonce(idToken: string, expectedNonce: string): void {
  const parts = idToken.split(".");

  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new Error("Shopify returned an invalid ID token.");
  }

  parseJwtPart(parts[0]);
  const claimsValue = parseJwtPart(parts[1]);

  if (
    typeof claimsValue.nonce !== "string" ||
    claimsValue.nonce.length === 0 ||
    !constantTimeEqual(claimsValue.nonce, expectedNonce)
  ) {
    throw new CustomerAuthFlowError(
      "id-token-nonce-invalid",
      "Shopify ID token nonce validation failed.",
    );
  }
}

function isTokenResponse(value: unknown): value is TokenResponse {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.access_token === "string" &&
    value.access_token.length > 0 &&
    typeof value.expires_in === "number" &&
    Number.isFinite(value.expires_in) &&
    value.expires_in > 0 &&
    (value.refresh_token === undefined ||
      (typeof value.refresh_token === "string" &&
        value.refresh_token.length > 0)) &&
    (value.id_token === undefined ||
      (typeof value.id_token === "string" && value.id_token.length > 0))
  );
}

async function requestTokens(
  config: CustomerAuthConfig,
  discovery: OpenIdDiscovery,
  body: URLSearchParams,
): Promise<TokenResponse> {
  let response: Response;

  try {
    response = await fetchWithTimeout(discovery.token_endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${base64BasicCredentials(
          config.clientId,
          config.clientSecret,
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "SneakerVaultGH/1.0",
      },
      body,
      cache: "no-store",
      redirect: SHOPIFY_REDIRECT_MODE,
    });
  } catch {
    throw new CustomerAuthFlowError(
      "token-exchange-failed",
      "The Shopify customer token endpoint could not be reached.",
    );
  }

  if (!response.ok) {
    let providerError = "";

    try {
      const errorBody: unknown = await response.clone().json();

      if (isObject(errorBody) && typeof errorBody.error === "string") {
        providerError = errorBody.error;
      }
    } catch {
      // The status code still provides a safe diagnostic if Shopify returns
      // a non-JSON error page.
    }

    if (response.status === 401 && providerError === "invalid_client") {
      throw new CustomerAuthFlowError(
        "token-invalid-client",
        "Shopify rejected the customer-account client credentials.",
      );
    }

    if (response.status === 400 && providerError === "invalid_grant") {
      throw new CustomerAuthFlowError(
        "token-invalid-grant",
        "Shopify rejected the authorization grant.",
      );
    }

    if (response.status === 401 && providerError === "invalid_token") {
      throw new CustomerAuthFlowError(
        "token-invalid-token",
        "Shopify rejected the token request.",
      );
    }

    if (response.status === 403) {
      throw new CustomerAuthFlowError(
        "token-forbidden",
        "Shopify denied the customer token exchange.",
      );
    }

    throw new CustomerAuthFlowError(
      "token-exchange-failed",
      "Shopify customer token exchange failed.",
    );
  }

  let value: unknown;

  try {
    value = await response.json();
  } catch {
    throw new CustomerAuthFlowError(
      "token-response-invalid",
      "Shopify returned an unreadable customer token response.",
    );
  }

  if (!isTokenResponse(value)) {
    throw new CustomerAuthFlowError(
      "token-response-invalid",
      "Shopify returned an invalid customer token response.",
    );
  }

  return value;
}

async function exchangeAuthorizationCode(
  code: string,
  nonce: string,
  config: CustomerAuthConfig,
  discovery: OpenIdDiscovery,
): Promise<Omit<StoredCustomerSession, "subject">> {
  const token = await requestTokens(
    config,
    discovery,
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      redirect_uri: config.callbackUrl.toString(),
      code,
    }),
  );

  if (!token.refresh_token || !token.id_token) {
    throw new CustomerAuthFlowError(
      "token-credentials-missing",
      "Shopify token response omitted required credentials.",
    );
  }

  try {
    assertIdTokenNonce(token.id_token, nonce);
  } catch (error) {
    if (error instanceof CustomerAuthFlowError) {
      throw error;
    }

    throw new CustomerAuthFlowError(
      "id-token-invalid",
      "Shopify ID token validation failed.",
    );
  }
  const now = Date.now();

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    idToken: token.id_token,
    accessTokenExpiresAt: now + token.expires_in * 1_000,
    absoluteExpiresAt: now + SESSION_MAX_AGE_SECONDS * 1_000,
    createdAt: now,
  };
}

async function refreshStoredSession(
  current: StoredCustomerSession,
  config: CustomerAuthConfig,
): Promise<StoredCustomerSession | null> {
  const refreshKeyBytes = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      textEncoder.encode(current.refreshToken),
    ),
  );
  const refreshKey = bytesToBase64Url(refreshKeyBytes);
  const pending = refreshesInFlight.get(refreshKey);

  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      const discovery = await getOpenIdDiscovery(config);
      const token = await requestTokens(
        config,
        discovery,
        new URLSearchParams({
          grant_type: "refresh_token",
          client_id: config.clientId,
          refresh_token: current.refreshToken,
        }),
      );

      // Shopify keeps the original authorization ID token as the logout hint.
      return {
        ...current,
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? current.refreshToken,
        accessTokenExpiresAt: Date.now() + token.expires_in * 1_000,
      };
    } catch {
      return null;
    }
  })();

  refreshesInFlight.set(refreshKey, promise);

  try {
    return await promise;
  } finally {
    refreshesInFlight.delete(refreshKey);
  }
}

function toPublicSession(session: StoredCustomerSession): CustomerSession {
  return {
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt,
    subject: session.subject,
  };
}

/**
 * Reads a valid, non-expired customer access token in server components.
 *
 * Refreshing requires a route response on which to rotate the encrypted
 * cookie. Route handlers should use resolveCustomerSession() instead.
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const state = await getCustomerSessionState();
  return state.status === "valid" ? state.session : null;
}

export async function getCustomerSessionState(): Promise<CustomerSessionState> {
  try {
    const cookieStore = await cookies();
    const session = await readStoredSession(cookieStore);

    if (!session) {
      return { status: "none" };
    }

    if (
      session.accessTokenExpiresAt <=
      Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS
    ) {
      return { status: "refresh-required" };
    }

    return { status: "valid", session: toPublicSession(session) };
  } catch {
    return { status: "none" };
  }
}

export async function getCustomerAccessToken(): Promise<string | null> {
  return (await getCustomerSession())?.accessToken ?? null;
}

/**
 * Resolves and, when needed, refreshes a customer session for a route handler.
 * Always call result.commit(response) before returning the response.
 */
export async function resolveCustomerSession(
  request: NextRequest,
): Promise<ResolvedCustomerSession | null> {
  let config: CustomerAuthConfig;

  try {
    config = getConfig();
  } catch {
    return null;
  }

  const current = await readStoredSession(request.cookies);

  if (!current) {
    return null;
  }

  if (
    current.accessTokenExpiresAt >
    Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS
  ) {
    return {
      ...toPublicSession(current),
      async commit() {
        // No cookie rotation is necessary.
      },
    };
  }

  const refreshed = await refreshStoredSession(current, config);

  if (!refreshed) {
    return null;
  }

  return {
    ...toPublicSession(refreshed),
    async commit(response) {
      await setStoredSession(response.cookies, config, refreshed);
    },
  };
}

export async function getCustomerAccessTokenFromRequest(
  request: NextRequest,
): Promise<ResolvedCustomerSession | null> {
  return resolveCustomerSession(request);
}

export async function customerAccountFetch<TData>(
  accessToken: string,
  query: string,
  variables: Readonly<Record<string, unknown>> = {},
): Promise<TData> {
  const config = getConfig();
  const discovery = await getCustomerApiDiscovery(config);
  const response = await fetchWithTimeout(discovery.graphql_api, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: accessToken,
      "Content-Type": "application/json",
      "User-Agent": "SneakerVaultGH/1.0",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    redirect: SHOPIFY_REDIRECT_MODE,
  });

  if (!response.ok) {
    throw new Error("Shopify Customer Account API request failed.");
  }

  const body: unknown = await response.json();

  if (!isObject(body)) {
    throw new Error("Shopify Customer Account API returned an invalid response.");
  }

  if (Array.isArray(body.errors) && body.errors.length > 0) {
    throw new Error("Shopify Customer Account API returned GraphQL errors.");
  }

  if (!("data" in body)) {
    throw new Error("Shopify Customer Account API response omitted data.");
  }

  return body.data as TData;
}

interface AuthenticatedCustomerIdentity {
  readonly id: string;
  readonly email: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
}

type AuthenticatedCustomerIdentityResponse = {
  readonly customer: {
    readonly id: string;
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly emailAddress: {
      readonly emailAddress: string | null;
    } | null;
  } | null;
};

async function getAuthenticatedCustomerIdentity(
  accessToken: string,
): Promise<AuthenticatedCustomerIdentity> {
  let data: AuthenticatedCustomerIdentityResponse;

  try {
    data = await customerAccountFetch<AuthenticatedCustomerIdentityResponse>(
      accessToken,
      `query AuthenticatedCustomerIdentity {
        customer {
          id
          firstName
          lastName
          emailAddress {
            emailAddress
          }
        }
      }`,
    );
  } catch {
    throw new CustomerAuthFlowError(
      "authenticated-email-unavailable",
      "The authenticated Shopify customer email could not be read.",
    );
  }

  const customer = data?.customer;

  if (
    !customer ||
    typeof customer.id !== "string" ||
    customer.id.length === 0
  ) {
    throw new CustomerAuthFlowError(
      "authenticated-email-unavailable",
      "The authenticated Shopify customer identity could not be read.",
    );
  }

  return {
    id: customer.id,
    email: normalizeCustomerEmail(customer.emailAddress?.emailAddress),
    firstName:
      typeof customer.firstName === "string" ? customer.firstName : null,
    lastName:
      typeof customer.lastName === "string" ? customer.lastName : null,
  };
}

type CustomerProfileUpdateResponse = {
  readonly customerUpdate: {
    readonly customer: {
      readonly firstName: string | null;
      readonly lastName: string | null;
    } | null;
    readonly userErrors: readonly {
      readonly field: readonly string[] | null;
      readonly message: string;
    }[];
  } | null;
};

async function completePendingCustomerProfile(
  accessToken: string,
  registration: PendingCustomerRegistration,
  identity: AuthenticatedCustomerIdentity,
): Promise<void> {
  const input: { firstName?: string; lastName?: string } = {};

  // A verified existing customer keeps any name already stored in Shopify.
  // Signup only fills missing profile fields; it never silently overwrites them.
  if (!identity.firstName?.trim()) {
    input.firstName = registration.firstName;
  }

  if (!identity.lastName?.trim()) {
    input.lastName = registration.lastName;
  }

  if (Object.keys(input).length === 0) {
    return;
  }

  let data: CustomerProfileUpdateResponse;

  try {
    data = await customerAccountFetch<CustomerProfileUpdateResponse>(
      accessToken,
      `mutation CompleteCustomerRegistration($input: CustomerUpdateInput!) {
        customerUpdate(input: $input) {
          customer {
            firstName
            lastName
          }
          userErrors {
            field
            message
          }
        }
      }`,
      { input },
    );
  } catch {
    throw new CustomerAuthFlowError(
      "profile-update-failed",
      "The verified Shopify customer profile could not be completed.",
    );
  }

  if (
    !data?.customerUpdate?.customer ||
    !Array.isArray(data.customerUpdate.userErrors) ||
    data.customerUpdate.userErrors.length > 0
  ) {
    throw new CustomerAuthFlowError(
      "profile-update-failed",
      "Shopify rejected the verified customer profile update.",
    );
  }
}

export async function beginCustomerAuthorization(
  response: NextResponse,
  input: {
    readonly email: string;
    readonly returnTo: string | null;
    readonly registration?: PendingCustomerRegistration;
  },
): Promise<URL> {
  const config = getConfig();
  const discovery = await getOpenIdDiscovery(config);
  const expectedEmail = normalizeCustomerEmail(input.email);

  if (!expectedEmail) {
    throw new CustomerAuthFlowError(
      "authenticated-email-unavailable",
      "A valid customer email is required to begin authorization.",
    );
  }

  if (
    input.registration &&
    !customerEmailsMatch(input.registration.email, expectedEmail)
  ) {
    throw new CustomerAuthFlowError(
      "authenticated-email-mismatch",
      "The registration and sign-in emails do not match.",
    );
  }

  const issuedAt = Date.now();
  const returnTo = input.registration
    ? safeCustomerReturnTo(input.registration.returnTo)
    : safeCustomerReturnTo(input.returnTo);
  const registration = input.registration
    ? {
        ...input.registration,
        returnTo,
        issuedAt,
      }
    : undefined;
  const transaction: OAuthTransaction = {
    state: randomBase64Url(),
    nonce: randomBase64Url(),
    expectedEmail,
    registration,
    returnTo,
    issuedAt,
  };
  await setOAuthTransaction(response.cookies, config, transaction);

  if (registration) {
    // Refresh the short-lived pending record for the provider round-trip. It
    // remains separately sealed so an abandoned or invalid OAuth callback can
    // be retried without losing the customer's submitted names.
    await setPendingCustomerRegistration(
      response.cookies,
      config,
      registration,
    );
  }

  const authorizationUrl = new URL(discovery.authorization_endpoint);
  authorizationUrl.searchParams.set("scope", AUTH_SCOPE);
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set(
    "redirect_uri",
    config.callbackUrl.toString(),
  );
  authorizationUrl.searchParams.set("state", transaction.state);
  authorizationUrl.searchParams.set("nonce", transaction.nonce);
  authorizationUrl.searchParams.set("login_hint", transaction.expectedEmail);
  authorizationUrl.searchParams.set("locale", "en-GH");
  authorizationUrl.searchParams.set("region_country", "GH");

  return authorizationUrl;
}

export async function finishCustomerAuthorization(
  request: NextRequest,
  response: NextResponse,
): Promise<URL> {
  const config = getConfig();
  const transaction = await readOAuthTransaction(request.cookies);

  if (!transaction) {
    clearOAuthTransaction(response.cookies, config);
    throw new CustomerAuthFlowError(
      "transaction-invalid",
      "The customer authorization transaction is missing or expired.",
    );
  }

  try {
    const state = request.nextUrl.searchParams.get("state");

    if (!state) {
      throw new CustomerAuthFlowError(
        "state-missing",
        "The Shopify authorization state is missing.",
      );
    }

    if (!constantTimeEqual(state, transaction.state)) {
      throw new CustomerAuthFlowError(
        "state-mismatch",
        "The Shopify authorization state does not match.",
      );
    }

    // Only the callback that owns this transaction may consume its cookie.
    // A stale callback from another tab must not invalidate a newer flow.
    clearOAuthTransaction(response.cookies, config);

    if (request.nextUrl.searchParams.has("error")) {
      throw new CustomerAuthFlowError(
        "provider-error",
        "Shopify returned an authorization error.",
      );
    }

    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      throw new CustomerAuthFlowError(
        "code-missing",
        "The Shopify authorization code is missing.",
      );
    }

    let discovery: OpenIdDiscovery;

    try {
      discovery = await getOpenIdDiscovery(config);
    } catch {
      throw new CustomerAuthFlowError(
        "discovery-failed",
        "Shopify OpenID discovery failed during the callback.",
      );
    }

    const exchangedSession = await exchangeAuthorizationCode(
      code,
      transaction.nonce,
      config,
      discovery,
    );
    const identity = await getAuthenticatedCustomerIdentity(
      exchangedSession.accessToken,
    );

    if (
      !identity.email ||
      !customerEmailsMatch(identity.email, transaction.expectedEmail)
    ) {
      throw new CustomerAuthFlowError(
        identity.email
          ? "authenticated-email-mismatch"
          : "authenticated-email-unavailable",
        "The authenticated Shopify email did not match this sign-in request.",
      );
    }

    if (transaction.registration) {
      await completePendingCustomerProfile(
        exchangedSession.accessToken,
        transaction.registration,
        identity,
      );
    }

    const session: StoredCustomerSession = {
      ...exchangedSession,
      subject: identity.id,
    };

    try {
      await setStoredSession(response.cookies, config, session);
    } catch {
      throw new CustomerAuthFlowError(
        "session-storage-failed",
        "The customer session could not be stored.",
      );
    }

    if (transaction.registration) {
      const pendingRegistration = await readPendingCustomerRegistration(
        request,
      );

      if (
        pendingRegistration &&
        pendingRegistrationsMatch(
          pendingRegistration,
          transaction.registration,
        )
      ) {
        clearPendingRegistrationCookie(response.cookies, config);
      }
    }
  } catch (error) {
    if (error instanceof CustomerAuthFlowError) {
      throw new CustomerAuthFlowError(
        error.code,
        error.message,
        transaction.returnTo,
      );
    }

    throw new CustomerAuthFlowError(
      "unexpected",
      "The customer authorization callback failed unexpectedly.",
      transaction.returnTo,
    );
  }

  return new URL(transaction.returnTo, config.siteOrigin);
}

export async function beginCustomerLogout(
  request: NextRequest,
  response: NextResponse,
): Promise<URL> {
  const config = getConfig();
  const session = await readStoredSession(request.cookies);
  clearOAuthTransaction(response.cookies, config);
  clearPendingRegistrationCookie(response.cookies, config);
  clearStoredSession(response.cookies, config);

  const postLogoutUrl = new URL("/account", config.siteOrigin);

  if (!session) {
    return postLogoutUrl;
  }

  const discovery = await getOpenIdDiscovery(config);
  const logoutUrl = new URL(discovery.end_session_endpoint);
  logoutUrl.searchParams.set("id_token_hint", session.idToken);
  logoutUrl.searchParams.set(
    "post_logout_redirect_uri",
    postLogoutUrl.toString(),
  );

  return logoutUrl;
}

export function customerAuthErrorUrl(
  request: NextRequest,
  reason: "configuration" | "provider" | "session",
  stage?: CustomerAuthFailureCode,
): URL {
  let origin: string;

  try {
    origin = getConfig().siteOrigin;
  } catch {
    origin = request.nextUrl.origin;
  }

  const url = new URL("/account", origin);
  url.searchParams.set("auth", "error");
  url.searchParams.set("reason", reason);

  if (stage) {
    url.searchParams.set("stage", stage);
  }

  return url;
}

export function customerSignInErrorUrl(
  request: NextRequest,
  stage: CustomerAuthFailureCode,
  returnTo?: string | null,
): URL {
  let origin: string;

  try {
    origin = getConfig().siteOrigin;
  } catch {
    origin = request.nextUrl.origin;
  }

  const url = new URL("/account/sign-in", origin);
  url.searchParams.set(
    "status",
    stage === "authenticated-email-mismatch"
      ? "email-mismatch"
      : "unavailable",
  );
  url.searchParams.set("stage", stage);
  url.searchParams.set("returnTo", safeCustomerReturnTo(returnTo ?? null));
  return url;
}

export function clearCustomerAuthCookies(
  response: NextResponse,
): void {
  try {
    const config = getConfig();
    clearOAuthTransaction(response.cookies, config);
    clearStoredSession(response.cookies, config);
  } catch {
    // No correctly scoped cookie can be cleared without valid configuration.
  }
}

export function clearCustomerSessionCookies(response: NextResponse): void {
  try {
    clearStoredSession(response.cookies, getConfig());
  } catch {
    // No correctly scoped cookie can be cleared without valid configuration.
  }
}
