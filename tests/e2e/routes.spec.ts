import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: null },
  { path: "/shop", heading: null },
  { path: "/about", heading: null },
  { path: "/contact", heading: null },
  { path: "/cart", heading: null },
  { path: "/checkout", heading: null },
  { path: "/account", heading: null },
  { path: "/account/sign-in", heading: "Sign in without a password." },
  { path: "/account/sign-up", heading: null },
  { path: "/policies/shipping", heading: null },
  { path: "/policies/returns", heading: null },
  { path: "/policies/privacy", heading: null },
  { path: "/policies/terms", heading: null },
] as const;

for (const route of routes) {
  test(`${route.path} renders with site chrome`, async ({ page }) => {
    const response = await page.goto(route.path);

    expect(response, `${route.path} should respond`).not.toBeNull();
    expect(
      response!.status(),
      `${route.path} should not error`,
    ).toBeLessThan(400);

    // Global chrome is present on every page.
    await expect(
      page.getByRole("link", { name: "Sneaker Vault GH home" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeAttached();

    // The page produced a heading (no blank render).
    await expect(page.locator("h1").first()).toBeVisible();
    if (route.heading) {
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible();
    }
  });
}

test("unknown routes show the not-found page", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-real-page");
  expect(response!.status()).toBe(404);
});
