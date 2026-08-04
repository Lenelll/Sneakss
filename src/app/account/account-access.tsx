import Link from "next/link";

type AccountAccessProps = {
  configured: boolean;
  signedIn: boolean;
  customerName?: string;
  customerEmail?: string;
  authError?: boolean;
  authStage?: string;
};

export function AccountAccess({
  configured,
  signedIn,
  customerName,
  customerEmail,
  authError = false,
  authStage,
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
            Create or access your account
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#686B64]">
            New customers start with their name and email. Returning customers
            sign in with a secure six-digit email code—no password required.
          </p>

          {authError ? (
            <p
              className="mt-5 rounded-xl border border-[#E0B33D]/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]"
              role="alert"
            >
              Sign-in could not be completed. Please try again.
              {authStage ? (
                <span className="mt-2 block text-xs font-semibold tracking-[0.08em] uppercase">
                  Diagnostic reference: {authStage}
                </span>
              ) : null}
            </p>
          ) : null}

          {configured ? (
            <div className="mt-7 grid gap-3">
              <Link
                className="flex w-full items-center justify-center rounded-xl bg-[#0E4E3E] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
                href="/account/sign-up?returnTo=/account"
              >
                Create account
              </Link>
              <Link
                className="flex w-full items-center justify-center rounded-xl border border-[#BFC1B9] px-5 py-3 text-sm font-semibold text-[#151713] transition hover:border-[#151713]"
                href="/account/sign-in?returnTo=/account"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-[#E0B33D]/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]">
              Customer sign-in is waiting for the Shopify Customer Account
              client, callback URL, and session secret.
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
