import { expect, test } from "@playwright/test";

test.describe("product reviews", () => {
  test("product page shows the reviews section and a review form", async ({
    page,
  }) => {
    await page.goto("/shop");
    const firstCard = page.locator('article a[href^="/products/"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/products\//);

    const reviews = page.locator("#reviews");
    await expect(
      reviews.getByRole("heading", { level: 2 }),
    ).toBeVisible();

    await reviews.getByRole("button", { name: /Write (a|the first) review/ }).first().click();

    const form = reviews.getByRole("form", { name: "Write a review" });
    await expect(form).toBeVisible();
    await expect(form.getByRole("radio", { name: "5 stars" })).toBeVisible();
    await expect(form.getByLabel("Headline")).toBeVisible();
    await expect(form.getByLabel("Your review")).toBeVisible();
    await expect(form.getByLabel("Name to display")).toBeVisible();
    // Photos are optional: the file input exists but nothing is required.
    await expect(form.locator('input[type="file"]')).toBeAttached();
    await expect(form.locator('input[type="file"]')).not.toHaveAttribute(
      "required",
      /.*/,
    );
  });

  test("the reviews API validates input", async ({ request }) => {
    const missingHandle = await request.get("/api/reviews");
    expect(missingHandle.status()).toBe(400);

    const unknownProduct = await request.get(
      "/api/reviews?handle=definitely-not-a-product",
    );
    expect(unknownProduct.status()).toBe(200);
    expect(await unknownProduct.json()).toMatchObject({
      reviews: [],
      summary: { count: 0 },
    });

    const wrongType = await request.post("/api/reviews", {
      data: { handle: "x" },
    });
    expect(wrongType.status()).toBe(415);

    const missingPhoto = await request.get(
      "/api/reviews/photos/00000000-0000-4000-8000-000000000000",
    );
    expect(missingPhoto.status()).toBe(404);
  });
});
