// importScripts is used in service workers (Chrome MV3 background).
// queue.js is loaded by both Chrome and Firefox.
importScripts("queue.js");

const CAPTURE_URL = "http://localhost:57433/capture";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-shortpath",
    title: "Save to ShortPath",
    contexts: ["selection", "page"],
  });
});

chrome.runtime.onStartup.addListener(async () => {
  // On browser startup, try to flush any queued captures in case
  // ShortPath is already running.
  await flushQueue();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "save-to-shortpath") return;

  const payload = {
    title: tab?.title ?? "Untitled",
    body: info.selectionText ?? "",
    url: tab?.url ?? info.pageUrl ?? "",
    source: "browser-extension",
  };

  try {
    const res = await fetch(CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "ShortPath",
        message: "Saved to ShortPath.",
      });
    } else {
      await enqueue(payload);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "ShortPath",
        message: "ShortPath isn't running. This will be imported next time you open ShortPath.",
      });
    }
  } catch {
    await enqueue(payload);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "ShortPath",
      message: "ShortPath isn't running. This will be imported next time you open ShortPath.",
    });
  }
});
