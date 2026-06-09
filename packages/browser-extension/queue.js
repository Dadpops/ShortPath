const QUEUE_KEY = "shortpath_capture_queue";
const CAPTURE_URL = "http://localhost:57433/capture";

async function enqueue(payload) {
  const result = await chrome.storage.local.get(QUEUE_KEY);
  const queue = result[QUEUE_KEY] || [];
  queue.push({ ...payload, queuedAt: Date.now() });
  await chrome.storage.local.set({ [QUEUE_KEY]: queue });
}

async function getQueue() {
  const result = await chrome.storage.local.get(QUEUE_KEY);
  return result[QUEUE_KEY] || [];
}

async function clearQueue() {
  await chrome.storage.local.set({ [QUEUE_KEY]: [] });
}

async function flushQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;

  for (const payload of queue) {
    try {
      const res = await fetch(CAPTURE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        flushed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
      break; // ShortPath still not running — stop trying
    }
  }

  if (flushed > 0) {
    const remaining = queue.slice(flushed);
    await chrome.storage.local.set({ [QUEUE_KEY]: remaining });
  }

  return { flushed, failed };
}
