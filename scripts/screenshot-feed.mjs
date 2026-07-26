import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const scratch =
  process.env.SCRATCH ||
  path.join(process.cwd(), ".scratch-screenshots");
const base = process.env.BASE_URL || "http://localhost:3456";

async function main() {
  await mkdir(scratch, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(`${base}/feed`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(scratch, "shell.png"),
    fullPage: false,
  });
  await page.screenshot({
    path: path.join(scratch, "ui.png"),
    fullPage: true,
  });

  const hasHeadline = await page.getByText("What's happening at B&G").count();
  const hasFeedNav = await page.getByRole("link", { name: "Feed" }).count();
  const posts = await page.locator("article").count();

  await browser.close();

  const report = {
    hasHeadline: hasHeadline > 0,
    hasFeedNav: hasFeedNav > 0,
    articleCount: posts,
    pageErrors: errors.slice(0, 20),
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.hasHeadline || report.articleCount < 3) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
