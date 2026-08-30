import { expect, test } from "@playwright/test";

import { addFirstAvailableProductToBag, bagButton } from "./helpers";

test.describe("cart", () => {
  test("adding a size updates the bag and cart page", async ({ page }) => {
    const title = await addFirstAvailableProductToBag(page);

    await expect(bagButton(page)).toContainText("(1)");

    await page.goto("/cart");
    // Scope to main: the closed cart drawer in the header holds a hidden
    // copy of the same product title.
    await expect(page.locator("main").getByText(title).first()).toBeVisible();
  });

  test("cart drawer opens from the header and can be closed", async ({
    page,
  }) => {
    await addFirstAvailableProductToBag(page);

    await bagButton(page).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading", { name: /Bag/ })).toBeVisible();

    await drawer.getByRole("button", { name: "Close" }).click();
    await expect(drawer.getByRole("heading", { name: /Bag/ })).toBeHidden();
  });

  test("empty cart page invites the visitor to shop", async ({ page }) => {
    await page.goto("/cart");
    await expect(
      page.getByRole("link", { name: /Browse|shop|collection/i }).first(),
    ).toBeVisible();
  });
});
