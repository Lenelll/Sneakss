import "server-only";

import {
  getShopifyConfigurationStatus,
  SHOPIFY_STOREFRONT_API_VERSION,
} from "./shopify";
import {
  getCustomerAuthSetupIssues,
  isCustomerAuthConfigured,
} from "./shopify/customer-auth";

export interface CommerceReadiness {
  readonly storefrontConnected: boolean;
  readonly customerAccountsConnected: boolean;
  readonly webhookVerificationConfigured: boolean;
  readonly apiVersion: typeof SHOPIFY_STOREFRONT_API_VERSION;
  readonly setupIssues: readonly string[];
}

export function getCommerceReadiness(): CommerceReadiness {
  const storefront = getShopifyConfigurationStatus();
  const customerIssues = getCustomerAuthSetupIssues();

  return {
    storefrontConnected: storefront.configured,
    customerAccountsConnected: isCustomerAuthConfigured(),
    webhookVerificationConfigured: Boolean(
      process.env.SHOPIFY_WEBHOOK_SECRET?.trim(),
    ),
    apiVersion: SHOPIFY_STOREFRONT_API_VERSION,
    setupIssues: [
      ...storefront.issues.map((issue) => issue.message),
      ...customerIssues,
    ],
  };
}
