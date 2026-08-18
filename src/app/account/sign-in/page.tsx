import type { Metadata } from "next";
import Link from "next/link";
import {
  isCustomerAuthFailureCode,
  safeCustomerReturnTo,
} from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Sneaker Vault GH customer account with a secure email code.",
};

type SignInPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    stage?: string | string[];
    status?: string | string[];
  }>;
};

const statusMessages = {
  ready:
    "Your details are held securely. Sign in with the same email to finish creating your account.",
  invalid: "We could not start sign-in. Please check your email and try again.",
  "email-mismatch":
    "That email did not match the pending account setup. Use the same email or start over.",
  "session-expired":
    "Your Sneaker Vault session expired. Verify your email to sign in again.",
  unavailable: "Customer sign-in is temporarily unavailable. Please try again.",
  configuration:
    "Customer sign-in is temporarily unavailable. Please try again later.",
} as const;

type SignInStatus = keyof typeof statusMessages;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isSignInStatus(value: string | undefined): value is SignInStatus {
  return Boolean(value && value in statusMessages);
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = safeCustomerReturnTo(
    firstValue(params.returnTo) ?? null,
    "/",
  );
  const status = firstValue(params.status);
  const stageValue = firstValue(params.stage);
  const diagnosticStage = isCustomerAuthFailureCode(stageValue)
    ? stageValue
    : undefined;
  const message = isSignInStatus(status) ? statusMessages[status] : undefined;
  const isSuccess = status === "ready";

  return (
    <main className="bg-[#F5F2EA] text-[#151713]">
      <section className="mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-[90rem] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] lg:items-center lg:px-12 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#0E4E3E] uppercase">
            Welcome back
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
            Sign in without a password.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#686B64] sm:text-lg">
            Enter your email to continue to Shopify&apos;s secure verification.
            A one-time code confirms it is really you.
          </p>

          <ol className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Enter your email"],
              ["02", "Receive a one-time code"],
              ["03", "Return to your order"],
            ].map(([number, label]) => (
              <li
                className="rounded-2xl border border-[#D8D8D0] bg-white/60 p-4"
                key={number}
              >
                <span className="text-xs font-semibold text-[#0E4E3E]">
                  {number}
                </span>
                <span className="mt-5 block text-sm font-medium">{label}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
            <Link
              className="font-semibold text-[#0E4E3E] underline decoration-[#E0B33D] decoration-2 underline-offset-4"
              href="/shop"
            >
              Continue shopping
            </Link>
            <span className="text-[#A2A49D]" aria-hidden="true">
              /
            </span>
            <Link className="text-[#686B64] hover:text-[#151713]" href="/contact">
              Need help?
            </Link>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[#D8D8D0] bg-white p-6 shadow-[0_18px_50px_rgba(21,23,19,0.08)] sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#0E4E3E] uppercase">
            Account access
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
            Continue with email
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#686B64]">
            Shopify will send a six-digit code to verify your email securely.
          </p>

          {message ? (
            <p
              className={
                isSuccess
                  ? "mt-5 rounded-xl border border-[#0E4E3E]/25 bg-[#EEF7F3] p-4 text-sm leading-6 text-[#0E4E3E]"
                  : "mt-5 rounded-xl border border-[#E0B33D]/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]"
              }
              role={isSuccess ? "status" : "alert"}
            >
              {message}
              {diagnosticStage ? (
                <span className="mt-2 block text-xs font-semibold tracking-[0.08em] uppercase">
                  Diagnostic reference: {diagnosticStage}
                </span>
              ) : null}
            </p>
          ) : null}

          <form action="/account/auth/login" className="mt-6" method="post">
            <input name="returnTo" type="hidden" value={returnTo} />

            <label className="text-sm font-semibold" htmlFor="email">
              Email address
            </label>
            <input
              autoCapitalize="none"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-[#BFC1B9] bg-white px-4 py-3 text-base text-[#151713] transition placeholder:text-[#92958D] hover:border-[#878A82] focus:border-[#0E4E3E] focus:outline-none"
              id="email"
              inputMode="email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              spellCheck={false}
              type="email"
            />

            <button
              className="mt-6 w-full rounded-xl bg-[#0E4E3E] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
              type="submit"
            >
              Send verification code
            </button>
          </form>

          {status === "ready" || status === "email-mismatch" ? (
            <form
              action="/account/auth/register/cancel"
              className="mt-3"
              method="post"
            >
              <input name="returnTo" type="hidden" value={returnTo} />
              <button
                className="w-full rounded-xl border border-[#BFC1B9] px-5 py-3 text-sm font-semibold text-[#151713] transition hover:border-[#151713]"
                type="submit"
              >
                Start over with another email
              </button>
            </form>
          ) : null}

          <p className="mt-5 text-sm leading-6 text-[#686B64]">
            New to Sneaker Vault?{" "}
            <Link
              className="font-semibold text-[#0E4E3E] underline decoration-[#E0B33D] decoration-2 underline-offset-4"
              href={{ pathname: "/account/sign-up", query: { returnTo } }}
            >
              Create an account
            </Link>
          </p>
          <p className="mt-4 text-xs leading-5 text-[#686B64]">
            By continuing, you agree to the store&apos;s privacy policy and
            terms.
          </p>
        </div>
      </section>
    </main>
  );
}
