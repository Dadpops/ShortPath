import { _electron as electron } from "playwright-core";

const app = await electron.launch({
  executablePath: "E:/ShortPath/release/win-unpacked/ShortPath.exe",
  args: [],
  timeout: 15000,
});

const windows = app.windows();
let win = windows[0];
if (!win) win = await app.firstWindow();

await win.waitForLoadState("domcontentloaded");
await new Promise(r => setTimeout(r, 1500));

const title = await win.title();
console.log("Window title:", title);

const searchBox = await win.$('input[type="text"], input[placeholder*="Search"], input[placeholder*="search"]');
console.log("Search input found:", !!searchBox);

if (searchBox) {
  await searchBox.fill("test");
  await new Promise(r => setTimeout(r, 500));
  const val = await searchBox.inputValue();
  console.log("Search value after typing:", val);
  await searchBox.fill("");
}

await win.screenshot({ path: "E:/ShortPath/smoke_built.png" });
console.log("Screenshot saved to smoke_built.png");

await app.close();
console.log("SMOKE TEST PASSED");
