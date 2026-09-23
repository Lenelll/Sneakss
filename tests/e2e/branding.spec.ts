import { expect, test } from "@playwright/test";

test("header shows the SVGH logo in the ink color", async ({ page }) => {
  await page.goto("/");

  const headerLogo = page
    .getByRole("link", { name: "Sneaker Vault GH home" })
    .locator("span");
  await expect(headerLogo).toBeVisible();

  const styles = await headerLogo.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      mask: computed.maskImage || computed.webkitMaskImage,
      color: computed.backgroundColor,
    };
  });
  expect(styles.mask).toContain("/brand/logo.svg");
  expect(styles.color).toBe("rgb(0, 0, 0)");
});

test("footer shows the SVGH logo in white", async ({ page }) => {
  await page.goto("/");

  const footerLogo = page
    .locator("footer")
    .getByRole("link", { name: "Sneaker Vault GH" })
    .locator("span");
  await expect(footerLogo).toBeAttached();

  const styles = await footerLogo.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      mask: computed.maskImage || computed.webkitMaskImage,
      color: computed.backgroundColor,
    };
  });
  expect(styles.mask).toContain("/brand/logo.svg");
  expect(styles.color).toBe("rgb(255, 255, 255)");
});

test("brand assets are served", async ({ request }) => {
  const logo = await request.get("/brand/logo.svg");
  expect(logo.status()).toBe(200);
  expect(await logo.text()).toContain("svgh-mark");

  const icon = await request.get("/icon.png");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toContain("image/png");
});

test("favicon link points at the brand icon", async ({ page }) => {
  await page.goto("/");
  const href = await page
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href");
  expect(href).toContain("/icon.png");
});
