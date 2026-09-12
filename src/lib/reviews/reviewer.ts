import "server-only";

import {
  customerAccountFetch,
  getCustomerSessionState,
  type CustomerSession,
} from "../shopify/customer-auth";

export interface ReviewerIdentity {
  /** Stable Shopify customer subject used to keep one review per product. */
  readonly id: string;
  /** Public display name, e.g. "Kofi A." */
  readonly displayName: string;
}

type CustomerNameData = {
  customer: {
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
  } | null;
};

const FALLBACK_NAME = "Verified customer";

function toDisplayName(data: CustomerNameData): string {
  const first = data.customer?.firstName?.trim() ?? "";
  const last = data.customer?.lastName?.trim() ?? "";

  if (first && last) {
    return `${first} ${last[0].toUpperCase()}.`;
  }

  if (first) {
    return first;
  }

  const display = data.customer?.displayName?.trim() ?? "";

  // Shopify falls back to the email address when no name is set; do not
  // expose that publicly.
  if (display && !display.includes("@")) {
    return display;
  }

  return FALLBACK_NAME;
}

export async function getReviewerIdentity(
  session: CustomerSession,
): Promise<ReviewerIdentity> {
  try {
    const data = await customerAccountFetch<CustomerNameData>(
      session.accessToken,
      `query ReviewerName {
        customer {
          firstName
          lastName
          displayName
        }
      }`,
    );

    return { id: session.subject, displayName: toDisplayName(data) };
  } catch {
    return { id: session.subject, displayName: FALLBACK_NAME };
  }
}

/**
 * Resolves the current visitor's reviewer identity from the session cookie.
 * Returns null when signed out or when the session needs a refresh.
 */
export async function getCurrentReviewer(): Promise<ReviewerIdentity | null> {
  const state = await getCustomerSessionState();

  if (state.status !== "valid") {
    return null;
  }

  return getReviewerIdentity(state.session);
}
