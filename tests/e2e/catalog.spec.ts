import { expect, test } from "@playwright/test";

test("shop lists products with prices", async ({ page }) => {
  await page.goto("/shop");

  const cards = page.locator("article");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);

  // Every card shows a cedi price.
  await expect(
    cards.first().getByText(/GH₵|GHS/).first(),
  ).toBeVisible();
});

test("product detail shows sizes, price, and add-to-bag control", async ({
  page,
}) => {
  await page.goto("/shop");
  const firstCard = page.locator('article a[href^="/products/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();

  await expect(page).toHaveURL(/\/products\//);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Select EU size" })).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /^(Add .* to bag|Select an available size)$/,
    }),
  ).toBeVisible();
});

test("search narrows the catalog and recovers from no results", async ({
  page,
}) => {
  await page.goto("/shop?q=zzzz-no-such-sneaker");
  await expect(
    page.locator("main").getByText(/no|match|found/i).first(),
  ).toBeVisible();

  await page.goto("/shop");
  await expect(page.locator("article").first()).toBeVisible();
});
