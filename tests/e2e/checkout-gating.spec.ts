import { expect, test } from "@playwright/test";

import { addFirstAvailableProductToBag } from "./helpers";

test.describe("checkout gating", () => {
  test("empty bag cannot reach checkout", async ({ page }) => {
    await page.goto("/checkout");
    await expect(
      page.getByRole("heading", { name: "Your bag is empty." }),
    ).toBeVisible();
  });

  test("signed-out visitor with items is asked to sign in, not sent to Shopify", async ({
    page,
  }) => {
    await addFirstAvailableProductToBag(page);

    await page.goto("/checkout");

    // The checkout summary renders locally…
    await expect(page).toHaveURL(/\/checkout/);
    expect(new URL(page.url()).hostname).toBe("localhost");

    // …and requires sign-in before any Shopify handoff.
    await expect(
      page
        .getByText(/Sign in is required|Sign in with email/)
        .first(),
    ).toBeVisible();
  });

  test("sign-in page offers the passwordless email flow", async ({ page }) => {
    await page.goto("/account/sign-in");

    const form = page.locator('form[action="/account/auth/login"]');
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(
      form.getByRole("button", { name: "Send verification code" }),
    ).toBeVisible();

    // Native validation blocks an empty submit — we stay on the page.
    await form.getByRole("button", { name: "Send verification code" }).click();
    await expect(page).toHaveURL(/\/account\/sign-in/);
  });
});
