"use client";

import { FormEvent, useState } from "react";

export function AccountAccess() {
  const [email, setEmail] = useState("");
  const [previewedEmail, setPreviewedEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreviewedEmail(email.trim());
  }

  return (
    <div className="rounded-[1.5rem] border border-[#D8D8D0] bg-white p-6 shadow-[0_18px_50px_rgba(21,23,19,0.08)] sm:p-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#0E4E3E] uppercase">
        Account access
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#151713]">
        Sign in without a password
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#686B64]">
        At launch, Shopify will email you a short one-time code. Entering that
        code will securely open your customer account.
      </p>

      <form className="mt-7" onSubmit={handleSubmit}>
        <label
          className="text-sm font-medium text-[#151713]"
          htmlFor="account-email"
        >
          Email address
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-[#BFC1B9] bg-[#FDFCF9] px-4 py-3 text-[#151713] outline-none transition focus:border-[#0E4E3E] focus:ring-2 focus:ring-[#0E4E3E]/15"
          id="account-email"
          inputMode="email"
          onChange={(event) => {
            setEmail(event.target.value);
            setPreviewedEmail("");
          }}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <button
          className="mt-4 w-full rounded-xl bg-[#0E4E3E] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123F35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E4E3E]"
          type="submit"
        >
          Preview email-code sign-in
        </button>
      </form>

      {previewedEmail ? (
        <div
          aria-live="polite"
          className="mt-4 rounded-xl border border-[#E0B33D]/50 bg-[#FFF9E8] p-4 text-sm leading-6 text-[#584814]"
        >
          <strong className="block text-[#151713]">Preview only</strong>
          No email was sent to {previewedEmail}. Shopify Customer Accounts must
          be connected before this sign-in can go live.
        </div>
      ) : null}

      <p className="mt-5 text-xs leading-5 text-[#686B64]">
        By continuing at launch, customers will agree to the store&apos;s
        privacy policy and terms.
      </p>
    </div>
  );
}
