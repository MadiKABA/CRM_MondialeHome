import { chromium } from "@playwright/test";

const shotDir =
  "/tmp/claude-1000/-home-noumtech-Bureau-noumtech-CRMMondialHome/13de9758-be63-449c-ac85-e47b7930222e/scratchpad";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
const serverErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));
page.on("response", (res) => {
  if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`);
});

page.setDefaultTimeout(90000);
page.setDefaultNavigationTimeout(90000);

// Login
await page.goto("http://localhost:3000/login", { waitUntil: "load" });
await page.fill('input[type="email"], input[name="email"]', "admin@mondialhome.sn");
await page.fill('input[type="password"], input[name="password"]', "Mondial@2024!");
await page.click('button[type="submit"]');
await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 90000 });
console.log("STEP1 Logged in, at:", page.url());

// Go to new dynamic segment page
await page.goto("http://localhost:3000/segments/nouveau-segment", { waitUntil: "load" });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${shotDir}/s1-page.png`, fullPage: true });
console.log("STEP2 On segment creation page:", page.url());

// Fill segment name (required) so form is valid
const nameInput = page.locator('input[name="name"]').first();
if ((await nameInput.count()) > 0) {
  await nameInput.fill("TEST verify - acheteurs article");
}

// Click "Ajouter une condition"
const addBtn = page.getByText("Ajouter une condition").first();
await addBtn.click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${shotDir}/s2-first-criterion.png`, fullPage: true });
console.log("STEP3 Added first criterion row");

// Open the field select for the criterion row
const champSelect = page.locator('[data-slot="select-trigger"]').first();
await champSelect.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/s3-champ-dropdown.png`, fullPage: true });
console.log("STEP4 Opened field dropdown");

// Select "A acheté l'article"
await page.getByRole("option", { name: "A acheté l'article", exact: true }).click();
await page.waitForTimeout(500);
await page.screenshot({
  path: `${shotDir}/s4-article-field-selected.png`,
  fullPage: true,
});
console.log("STEP5 Selected 'A acheté l'article' field");

// Check article picker is visible, type search
const articlePickerInput = page
  .locator('input[placeholder*="article" i], input[placeholder*="rechercher" i]')
  .first();
const articlePickerVisible = await articlePickerInput.count();
console.log("STEP6 Article picker input present:", articlePickerVisible);

if (articlePickerVisible > 0) {
  await articlePickerInput.click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${shotDir}/s5-article-picker-open.png`,
    fullPage: true,
  });
  await articlePickerInput.fill("a");
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `${shotDir}/s6-article-picker-search.png`,
    fullPage: true,
  });
  console.log("STEP7 Typed search in article picker");

  const bodyText = await page.locator("body").innerText();
  console.log("STEP8 Body text snippet after search:", bodyText.slice(0, 500));

  // Try selecting first article result
  const resultButtons = page.locator('[role="listbox"] button, [role="option"]');
  const resultCount = await resultButtons.count();
  console.log("STEP9 Result options count:", resultCount);
  if (resultCount > 0) {
    await resultButtons.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${shotDir}/s7-article-selected.png`, fullPage: true });
    console.log("STEP10 Selected an article from picker");
  }
}

// Now test category + period variant: add a second criterion
const addBtn2 = page.getByText("Ajouter une condition").first();
await addBtn2.click();
await page.waitForTimeout(500);
const champSelect2 = page.locator('[data-slot="select-trigger"]').nth(2); // second row's field select (account for operator selects too)
await page.screenshot({ path: `${shotDir}/s8-second-row-added.png`, fullPage: true });
console.log("STEP11 Added second criterion row");

console.log("CONSOLE_ERRORS:", JSON.stringify(consoleErrors, null, 2));
console.log("SERVER_ERRORS:", JSON.stringify(serverErrors, null, 2));

await browser.close();
