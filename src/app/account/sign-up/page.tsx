import type { Metadata } from "next";
import Link from "next/link";
import { safeCustomerReturnTo } from "@/lib/shopify/customer-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create your Sneaker Vault GH customer account before verifying your email.",
};

type SignUpPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
    status?: string | string[];
  }>;
};

const statusMessages = {
  cancelled:
    "The previous account setup was cleared. Enter the new details below.",
  invalid: "Please check your details and try again.",
  unavailable:
    "Account registration is temporarily unavailable. Please try again shortly.",
} as const;

type SignUpStatus = keyof typeof statusMessages;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isSignUpStatus(value: string | undefined): value is SignUpStatus {
  return Boolean(value && value in statusMessages);
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const returnTo = safeCustomerReturnTo(
    firstValue(params.returnTo) ?? null,
    "/",
  );
  const status = firstValue(params.status);
  const message = isSignUpStatus(status) ? statusMessages[status] : undefined;

  return (
    <main className="bg-canvas text-ink">
      <section className="mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-[90rem] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] lg:items-center lg:px-12 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Join the vault
          </p>
          <h1 className="mt-4 display-type text-balance">
            Start with your details.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Tell us who you are, then verify your email through Shopify&apos;s
            secure passwordless sign-in. Your cart will be waiting when you
            return.
          </p>

          <ol className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Enter your details"],
              ["02", "Verify your email"],
              ["03", "Access orders and checkout"],
            ].map(([number, label]) => (
              <li
                className="rounded-none border border-line bg-white/60 p-4"
                key={number}
              >
                <span className="text-xs font-semibold text-brand">
                  {number}
                </span>
                <span className="mt-5 block text-sm font-medium">{label}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
            <Link
              className="font-semibold text-brand underline decoration-brand decoration-2 underline-offset-4"
              href="/shop"
            >
              Continue shopping
            </Link>
            <span className="text-muted-soft" aria-hidden="true">
              /
            </span>
            <Link className="text-muted hover:text-ink" href="/contact">
              Need help?
            </Link>
          </div>
        </div>

        <div className="rounded-none border border-line bg-white p-6 shadow-[0_18px_50px_rgba(12,18,48,0.08)] sm:p-8">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
            Create account
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
            Enter your customer details
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            They are held securely until your passwordless email verification
            is complete.
          </p>

          {message ? (
            <p
              className="mt-5 rounded-none border border-line-strong bg-surface-2 p-4 text-sm leading-6 text-ink-soft"
              role="alert"
            >
              {message}
            </p>
          ) : null}

          <form action="/account/auth/register" className="mt-6" method="post">
            <input name="returnTo" type="hidden" value={returnTo} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold" htmlFor="firstName">
                  First name
                </label>
                <input
                  autoComplete="given-name"
                  className="mt-2 w-full rounded-none border border-line-strong bg-white px-4 py-3 text-base text-ink transition placeholder:text-muted-soft hover:border-muted-soft focus:border-brand focus:outline-none"
                  id="firstName"
                  maxLength={64}
                  name="firstName"
                  placeholder="First name"
                  required
                  type="text"
                />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="lastName">
                  Last name
                </label>
                <input
                  autoComplete="family-name"
                  className="mt-2 w-full rounded-none border border-line-strong bg-white px-4 py-3 text-base text-ink transition placeholder:text-muted-soft hover:border-muted-soft focus:border-brand focus:outline-none"
                  id="lastName"
                  maxLength={64}
                  name="lastName"
                  placeholder="Last name"
                  required
                  type="text"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold" htmlFor="email">
                Email address
              </label>
              <input
                autoCapitalize="none"
                autoComplete="email"
                className="mt-2 w-full rounded-none border border-line-strong bg-white px-4 py-3 text-base text-ink transition placeholder:text-muted-soft hover:border-muted-soft focus:border-brand focus:outline-none"
                id="email"
                inputMode="email"
                maxLength={254}
                name="email"
                placeholder="you@example.com"
                required
                spellCheck={false}
                type="email"
              />
            </div>

            <button
              className="mt-6 w-full rounded-none bg-ink px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              type="submit"
            >
              Continue to sign in
            </button>
          </form>

          <p className="mt-5 text-sm leading-6 text-muted">
            Prefer passwordless sign-in?{" "}
            <Link
              className="font-semibold text-brand underline decoration-brand decoration-2 underline-offset-4"
              href={{ pathname: "/account/sign-in", query: { returnTo } }}
            >
              Sign in
            </Link>
          </p>
          <p className="mt-4 text-xs leading-5 text-muted">
            By continuing, you agree to the store&apos;s privacy policy and
            terms.
          </p>
        </div>
      </section>
    </main>
  );
}
