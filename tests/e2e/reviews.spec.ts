import { expect, test } from "@playwright/test";

test.describe("product reviews", () => {
  test("signed-out visitors see the reviews section and are asked to sign in", async ({
    page,
  }) => {
    await page.goto("/shop");
    const firstCard = page.locator('article a[href^="/products/"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/products\//);

    const reviews = page.locator("#reviews");
    await expect(reviews.getByRole("heading", { level: 2 })).toBeVisible();

    // Reviews are posted under the account name, so signed-out visitors get
    // a sign-in link instead of the form.
    const signIn = reviews
      .getByRole("link", { name: /Sign in to write/ })
      .first();
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute(
      "href",
      /\/account\/sign-in\?returnTo=/,
    );
    await expect(
      reviews.getByRole("form", { name: "Write a review" }),
    ).toHaveCount(0);
  });

  test("the reviews API validates input and requires an account", async ({
    request,
  }) => {
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

    const signedOut = await request.post("/api/reviews", {
      multipart: { handle: "x", rating: "5", title: "Great", body: "Great pair." },
    });
    expect(signedOut.status()).toBe(401);

    const missingPhoto = await request.get(
      "/api/reviews/photos/00000000-0000-4000-8000-000000000000",
    );
    expect(missingPhoto.status()).toBe(404);
  });
});
