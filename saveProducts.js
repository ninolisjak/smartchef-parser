const fs = require("fs");
const { scrapeTus } = require("./scraper-products");

(async () => {
  const query = process.argv.slice(2).join(" ") || "mleko";
  console.log(`Iskanje: ${query}`);

  const tusResults = await scrapeTus(query);

  console.log(`Najdenih ${tusResults.length} izdelkov na Tuš.`);
  fs.writeFileSync("products.json", JSON.stringify(tusResults, null, 2));
  console.log("Shranjeno v products.json");
})();
