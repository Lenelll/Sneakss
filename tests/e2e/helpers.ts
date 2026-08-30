import { expect, type Page } from "@playwright/test";

/**
 * Opens the shop, navigates into the first product whose detail page offers
 * an in-stock EU size, and adds that size to the bag. Works in both demo
 * and live Shopify mode. Returns the product title that was added.
 */
export async function addFirstAvailableProductToBag(page: Page): Promise<string> {
  await page.goto("/shop");

  const cardLinks = page.locator('article a[href^="/products/"]');
  await expect(cardLinks.first()).toBeVisible();

  const handles = new Set<string>();
  for (const href of await cardLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  )) {
    if (href) {
      handles.add(href);
    }
  }

  for (const href of handles) {
    await page.goto(href);

    const addButton = page.getByRole("button", { name: /^Add .* to bag$/ });
    if ((await addButton.count()) === 0) {
      continue; // sold out — no available size preselected
    }

    const title = (await page.locator("h1").innerText()).trim();
    await addButton.click();
    await expect(page.getByText(/added to your bag\./)).toBeVisible({
      timeout: 20_000,
    });

    // Adding opens the cart drawer; close it so tests start from a neutral
    // state and later header clicks are not intercepted by the open dialog.
    const drawerClose = page
      .getByRole("dialog")
      .getByRole("button", { name: "Close" });
    if (await drawerClose.isVisible().catch(() => false)) {
      await drawerClose.click();
      await expect(drawerClose).toBeHidden();
    }

    return title;
  }

  throw new Error("No purchasable product found in the catalog");
}

/** The header bag button, which carries the live item count. */
export function bagButton(page: Page) {
  return page.getByRole("button", { name: /Open bag with \d+ items?/ });
}
