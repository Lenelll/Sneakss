import Link from "next/link";

type AccountAccessProps = {
  configured: boolean;
  signedIn: boolean;
  customerName?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  authError?: boolean;
  authStage?: string;
  prefsStatus?: string;
};

export function AccountAccess({
  configured,
  signedIn,
  customerName,
  customerFirstName,
  customerLastName,
  customerEmail,
  authError = false,
  authStage,
  prefsStatus,
}: AccountAccessProps) {
  const preferencesSaved = prefsStatus === "updated";
  const preferencesError =
    prefsStatus === "invalid" || prefsStatus === "unavailable";
  const noChanges =
    prefsStatus === "unchanged" || prefsStatus === "empty";

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

          {(preferencesSaved || preferencesError || noChanges) && (
            <p
              className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
                preferencesSaved
                  ? "border-[#0E4E3E]/25 bg-[#EEF7F3] text-[#0E4E3E]"
                  : preferencesError
                    ? "border-[#E0B33D]/50 bg-[#FFF9E8] text-[#584814]"
                    : "border-[#D8D8D0] bg-[#F5F2EA] text-[#4F514D]"
              }`}
              role={preferencesError ? "alert" : "status"}
            >
              {preferencesSaved
                ? "Account preferences were updated."
                : preferencesError
                  ? "Could not update your account preferences. Please try again."
                  : noChanges
                    ? "No preference changes were submitted."
                    : ""}
            </p>
          )}

          <section className="mt-7 rounded-xl border border-[#D8D8D0] bg-[#F5F2EA] p-4">
            <p className="text-sm font-semibold text-[#151713]">
              Account preferences
            </p>
            <p className="mt-2 text-sm leading-6 text-[#686B64]">
              Update your saved first and last name used for account and checkout
              displays.
            </p>

            <form
              action="/account/auth/preferences"
              className="mt-5 grid gap-4"
              method="post"
            >
              <input name="returnTo" type="hidden" value="/account" />

              <div>
                <label
                  className="text-sm font-semibold text-[#151713]"
                  htmlFor="firstName"
                >
                  First name
                </label>
                <input
                  autoComplete="given-name"
                  className="mt-2 w-full rounded-xl border border-[#BFC1B9] bg-white px-4 py-3 text-base text-[#151713] transition placeholder:text-[#92958D] hover:border-[#878A82] focus:border-[#0E4E3E] focus:outline-none"
                  defaultValue={customerFirstName ?? ""}
                  id="firstName"
                  maxLength={64}
                  name="firstName"
                  placeholder="First name"
                  type="text"
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold text-[#151713]"
                  htmlFor="lastName"
                >
                  Last name
                </label>
                <input
                  autoComplete="family-name"
                  className="mt-2 w-full rounded-xl border border-[#BFC1B9] bg-white px-4 py-3 text-base text-[#151713] transition placeholder:text-[#92958D] hover:border-[#878A82] focus:border-[#0E4E3E] focus:outline-none"
                  defaultValue={customerLastName ?? ""}
                  id="lastName"
                  maxLength={64}
                  name="lastName"
                  placeholder="Last name"
                  type="text"
                />
              </div>

              <button
                className="rounded-xl bg-[#0E4E3E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123F35]"
                type="submit"
              >
                Save account preferences
              </button>
            </form>
          </section>

          <Link
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#0E4E3E] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35]"
            href="/shop"
          >
            Continue shopping
          </Link>
          <form action="/account/auth/logout" className="mt-5" method="post">
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
                href="/account/sign-up?returnTo=/"
              >
                Create account
              </Link>
              <Link
                className="flex w-full items-center justify-center rounded-xl border border-[#BFC1B9] px-5 py-3 text-sm font-semibold text-[#151713] transition hover:border-[#151713]"
                href="/account/sign-in?returnTo=/"
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
