
require("dotenv").config();
const { shopifyGraphQL } = require("./config/shopify");

async function main() {
  const query = `
    query {
      products(first: 50) {
        nodes {
          id
          title
          variants(first: 20) {
            nodes {
              id
              title
              inventoryItem {
                id
              }
            }
          }
        }
      }
      locations(first: 20) {
        nodes {
          id
          name
        }
      }
    }
  `;

  const result = await shopifyGraphQL(query);

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.response?.data || error.message);
});
