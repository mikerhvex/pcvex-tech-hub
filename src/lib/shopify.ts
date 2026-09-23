export const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_DOMAIN = "pcvex-tech-hub-axynx-zjwk0muw.myshopify.com";
const SHOPIFY_TOKEN = "17eb3e6e74f280b8f54539c9a48a4459";
const SHOPIFY_URL = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

export interface Money { amount: string; currencyCode: string }
export interface ShopifyVariant {
  id: string; title: string; availableForSale: boolean; price: Money;
  compareAtPrice: Money | null; selectedOptions: Array<{ name: string; value: string }>;
}
export interface ShopifyProduct {
  id: string; title: string; description: string; handle: string; productType: string;
  tags: string[]; priceRange: { minVariantPrice: Money };
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  variants: { edges: Array<{ node: ShopifyVariant }> };
  options: Array<{ name: string; values: string[] }>;
}

export async function storefrontApiRequest<T>(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": SHOPIFY_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`No se pudo conectar con la tienda (${response.status})`);
  const payload = await response.json() as { data?: T; errors?: Array<{ message: string }> };
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join(", "));
  if (!payload.data) throw new Error("Shopify no devolvió datos");
  return payload.data;
}

const PRODUCT_FIELDS = `
  id title description handle productType tags
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 5) { edges { node { url altText } } }
  variants(first: 20) { edges { node { id title availableForSale price { amount currencyCode } compareAtPrice { amount currencyCode } selectedOptions { name value } } } }
  options { name values }
`;

export async function getProducts(first = 20) {
  const data = await storefrontApiRequest<{ products: { edges: Array<{ node: ShopifyProduct }> } }>(
    `query Products($first: Int!) { products(first: $first) { edges { node { ${PRODUCT_FIELDS} } } } }`, { first },
  );
  return data.products.edges.map(({ node }) => node);
}

export async function getProduct(handle: string) {
  const data = await storefrontApiRequest<{ product: ShopifyProduct | null }>(
    `query Product($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }`, { handle },
  );
  return data.product;
}

export function formatMoney(money: Money) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: money.currencyCode, maximumFractionDigits: 2 }).format(Number(money.amount));
}