import { expect, test } from "@playwright/test";

test("the hero renders a slide and keeps the headline over it", async ({
  page,
}) => {
  await page.goto("/");

  const hero = page.getByRole("region", { name: "Featured sneakers" });
  await expect(hero).toBeVisible();
  await expect(
    hero.getByRole("heading", { name: /Browse our latest pairs/i }),
  ).toBeVisible();
  await expect(hero.getByRole("img").first()).toBeVisible();
});

test("the hero cycles between pairs when the catalog has more than one", async ({
  page,
}) => {
  await page.goto("/");

  const hero = page.getByRole("region", { name: "Featured sneakers" });
  const dots = hero.getByRole("button", { name: /Show slide/ });
  const slideCount = await dots.count();

  // A single-product catalog renders no controls; nothing to cycle.
  test.skip(slideCount < 2, "catalog has fewer than two hero slides");

  const status = hero.locator("p.sr-only").first();
  const first = await status.innerText();

  // Dots are the one control present at every width, so drive the test with
  // them rather than the desktop-only arrows.
  await dots.nth(1).click();
  await expect(status).not.toHaveText(first);

  await dots.nth(0).click();
  await expect(status).toHaveText(first);
});

test("each hero slide links to the pair it shows", async ({ page }) => {
  await page.goto("/");

  const hero = page.getByRole("region", { name: "Featured sneakers" });
  const caption = hero.locator('a[href^="/products/"]').first();

  // The caption only renders for catalog-backed slides, not the bundled
  // fallback image.
  test.skip((await caption.count()) === 0, "hero is using the fallback image");

  const href = await caption.getAttribute("href");
  await caption.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await expect(page.locator("h1")).toBeVisible();
});
