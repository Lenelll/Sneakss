/**
 * Server-side readiness helpers for the future Shopify Headless connection.
 *
 * Never import secret values into client components. The storefront currently
 * uses the local demo catalog and cart until every required Shopify setting is
 * present.
 */
const storefrontRequirements = [
  "SHOPIFY_STORE_DOMAIN",
  "SHOPIFY_STOREFRONT_PRIVATE_TOKEN",
] as const;

const customerAccountRequirements = [
  "SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID",
  "SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET",
  "SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL",
] as const;

function hasEnvironmentValues(keys: readonly string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export interface CommerceReadiness {
  readonly storefrontConnected: boolean;
  readonly customerAccountsConnected: boolean;
  readonly webhookVerificationConfigured: boolean;
}

export function getCommerceReadiness(): CommerceReadiness {
  return {
    storefrontConnected: hasEnvironmentValues(storefrontRequirements),
    customerAccountsConnected: hasEnvironmentValues(
      customerAccountRequirements,
    ),
    webhookVerificationConfigured: Boolean(
      process.env.SHOPIFY_WEBHOOK_SECRET?.trim(),
    ),
  };
}
