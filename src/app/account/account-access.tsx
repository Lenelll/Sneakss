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
    <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_18px_50px_rgba(12,18,48,0.08)] sm:p-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
        Account access
      </p>

      {signedIn ? (
        <>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink">
            Welcome{customerName ? `, ${customerName}` : " back"}.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            You are signed in with Shopify Customer Accounts
            {customerEmail ? ` as ${customerEmail}` : ""}. Your account will
            stay connected when you continue to secure checkout.
          </p>

          {(preferencesSaved || preferencesError || noChanges) && (
            <p
              className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
                preferencesSaved
                  ? "border-brand/25 bg-brand-tint text-brand"
                  : preferencesError
                    ? "border-accent/50 bg-[#FFF9E8] text-[#584814]"
                    : "border-line bg-canvas text-muted"
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

          <section className="mt-7 rounded-xl border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-ink">
              Account preferences
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
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
                  className="text-sm font-semibold text-ink"
                  htmlFor="firstName"
                >
                  First name
                </label>
                <input
                  autoComplete="given-name"
                  className="mt-2 w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-base text-ink transition placeholder:text-muted-soft hover:border-muted-soft focus:border-brand focus:outline-none"
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
                  className="text-sm font-semibold text-ink"
                  htmlFor="lastName"
                >
                  Last name
                </label>
                <input
                  autoComplete="family-name"
                  className="mt-2 w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-base text-ink transition placeholder:text-muted-soft hover:border-muted-soft focus:border-brand focus:outline-none"
                  defaultValue={customerLastName ?? ""}
                  id="lastName"
                  maxLength={64}
                  name="lastName"
                  placeholder="Last name"
                  type="text"
                />
              </div>

              <button
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                type="submit"
              >
                Save account preferences
              </button>
            </form>
          </section>

          <Link
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            href="/shop"
          >
            Continue shopping
          </Link>
          <form action="/account/auth/logout" className="mt-5" method="post">
            <button
              className="w-full rounded-xl border border-line-strong px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink">
            Create or access your account
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            New customers start with their name and email. Returning customers
            sign in with a secure six-digit email code—no password required.
          </p>

          {authError ? (
            <p
              className="mt-5 rounded-xl border border-accent/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]"
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
                className="flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href="/account/sign-up?returnTo=/"
              >
                Create account
              </Link>
              <Link
                className="flex w-full items-center justify-center rounded-xl border border-line-strong px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink"
                href="/account/sign-in?returnTo=/"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-accent/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]">
              Customer sign-in is waiting for the Shopify Customer Account
              client, callback URL, and session secret.
            </div>
          )}
        </>
      )}

      <p className="mt-5 text-xs leading-5 text-muted">
        By continuing, customers agree to the store&apos;s privacy policy and
        terms.
      </p>
    </div>
  );
}
