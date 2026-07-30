import Link from "next/link";

type AccountAccessProps = {
  configured: boolean;
  signedIn: boolean;
  customerName?: string;
  customerEmail?: string;
  authError?: boolean;
};

export function AccountAccess({
  configured,
  signedIn,
  customerName,
  customerEmail,
  authError = false,
}: AccountAccessProps) {
  return (
    <div className="rounded-[1.5rem] border border-[#D8D8D0] bg-white p-6 shadow-[0_18px_50px_rgba(21,23,19,0.08)] sm:p-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#0E4E3E] uppercase">
        Account access
      </p>

      {signedIn ? (
        <>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#151713]">
            Welcome{customerName ? `, ${customerName}` : " back"}.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#686B64]">
            You are signed in with Shopify Customer Accounts
            {customerEmail ? ` as ${customerEmail}` : ""}. Your account will
            stay connected when you continue to secure checkout.
          </p>
          <Link
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#0E4E3E] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35]"
            href="/shop"
          >
            Continue shopping
          </Link>
          <form action="/account/auth/logout" className="mt-3" method="post">
            <button
              className="w-full rounded-xl border border-[#BFC1B9] px-5 py-3 text-sm font-semibold text-[#151713] transition hover:border-[#151713]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#151713]">
            Sign in without a password
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#686B64]">
            Shopify will securely ask for your email and send a six-digit
            one-time code. First-time customers get an account automatically.
          </p>

          {authError ? (
            <p
              className="mt-5 rounded-xl border border-[#E0B33D]/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]"
              role="alert"
            >
              Sign-in could not be completed. Please try again.
            </p>
          ) : null}

          {configured ? (
            <Link
              className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#0E4E3E] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
              href="/account/auth/login?returnTo=/account"
            >
              Continue with email
            </Link>
          ) : (
            <div className="mt-7 rounded-xl border border-[#E0B33D]/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]">
              Customer sign-in is waiting for the final Shopify domain,
              Storefront token, callback URL, and session secret.
            </div>
          )}
        </>
      )}

      <p className="mt-5 text-xs leading-5 text-[#686B64]">
        By continuing, customers agree to the store&apos;s privacy policy and
        terms.
      </p>
    </div>
  );
}
