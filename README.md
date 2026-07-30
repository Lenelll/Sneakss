# Sneaker Vault GH

Headless ecommerce storefront for a Ghana-based sneaker reseller. The app uses
Next.js, TypeScript, and Tailwind CSS, with Shopify planned as the source of
truth for products, size-level inventory, customers, carts, and orders.

## Current build

The storefront currently runs in a deliberate preview mode:

- 12 fictional products with EU size variants and GHS prices
- responsive home, shop, product, cart, account, and checkout routes
- local demo cart state for testing the full browsing flow
- informational and draft policy pages
- Shopify and Paystack integration gates that never simulate a real order

Official products, photography, logo files, contact details, and approved legal
copy still need to replace the temporary content before launch.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validation commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Connect the Shopify Headless channel

Shopify requires its Headless sales channel for a bring-your-own-stack
storefront. When you are ready to connect the existing store:

1. In Shopify Admin, install the **Headless** channel from the Shopify App
   Store.
2. Open **Sales channels → Headless** and select **Add storefront**.
3. Name it `Sneaker Vault GH Web`.
4. In **Manage API access**, enable the Storefront API permissions needed for
   products, variants, inventory availability, carts, and checkout.
5. Copy the store domain and the server-only private Storefront token into
   `.env.local`, following `.env.example`.
6. Enable Shopify **Customer accounts**, then add the production and local
   callback URLs for the Customer Account API client.
7. Publish the real products to the Headless sales channel.

The private Storefront token, Customer Account client secret, and webhook
secret must remain server-only. Never prefix them with `NEXT_PUBLIC_`.

Official references:

- [Bring your own headless stack](https://shopify.dev/docs/storefronts/headless/bring-your-own-stack)
- [Manage the Headless channel](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/manage-headless-channels)
- [Shopify customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts)

## Configure Paystack

Paystack belongs inside Shopify checkout, not in the Next.js frontend:

1. In Shopify Admin, open **Settings → Payments**.
2. Install or activate the current Paystack payment app.
3. Connect the client’s Paystack test account and keep the integration in test
   mode.
4. Verify a full test order, webhook/payment status, refund flow, and GHS
   settlement before enabling live payments.

Do not add a Paystack secret key to this project. See Paystack’s
[Shopify setup guide](https://support.paystack.com/en/articles/2132226).

## Content ownership

`sneakervaultgh` is the production codebase. Private reference material is not
part of this project; none of its code, assets, wording, or brand identifiers
may be copied into the storefront.
