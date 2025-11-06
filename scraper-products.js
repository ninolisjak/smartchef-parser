// --- Puppeteer z zaščito proti blokadam ---
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// ---- pomožne funkcije ----
function parsePrice(txt) {
  if (!txt) return null;
  const norm = txt.replace(/\s/g, "").replace(",", ".");
  const m = norm.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

async function withBrowser(fn) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080"
    ],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

// ---- 1. TUŠ ----
async function scrapeTus(query) {
  const url = `https://www.tus.si/?s=${encodeURIComponent(query)}&post_type=product`;
  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
    );

    console.log("Odpiram:", url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(4000);

    const items = await page.$$eval(".product, .product-list__item, .product-item", (cards) =>
      cards.map((n) => {
        const get = (sel) => n.querySelector(sel)?.textContent?.trim() || null;
        const getAttr = (sel, a) => n.querySelector(sel)?.getAttribute(a) || null;

        const title = get("h2, h3, .product__title, .woocommerce-loop-product__title");
        const priceTxt = get(".price, .woocommerce-Price-amount, .amount");
        const link = getAttr("a", "href");
        const img = getAttr("img", "src") || getAttr("img", "data-src");

        return { title, priceTxt, link, img };
      })
    );

    const scrapedAt = new Date().toISOString();
    const results = items
      .filter((x) => x.title && x.priceTxt && x.title.toLowerCase().includes(query.toLowerCase()))
      .map((x) => ({
        store: "Tuš",
        name: x.title,
        price: parsePrice(x.priceTxt),
        currency: "EUR",
        url: x.link,
        image: x.img,
        scrapedAt
      }));

    console.log(`Najdenih ${results.length} izdelkov na Tuš.`);
    return results;
  });
}

// ---- izvoz ----
module.exports = { scrapeTus };
