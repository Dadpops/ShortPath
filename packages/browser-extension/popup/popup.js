const PING_URL = "http://localhost:57433/ping";
const CAPTURE_URL = "http://localhost:57433/capture";
const QUEUE_KEY = "shortpath_capture_queue";

const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const connectedPanel = document.getElementById("connected-panel");
const disconnectedPanel = document.getElementById("disconnected-panel");
const savePageBtn = document.getElementById("save-page-btn");
const queueRow = document.getElementById("queue-row");
const queueCount = document.getElementById("queue-count");
const flushBtn = document.getElementById("flush-btn");
const queueRowDc = document.getElementById("queue-row-dc");
const queueCountDc = document.getElementById("queue-count-dc");
const viewQueueBtn = document.getElementById("view-queue-btn");
const queueList = document.getElementById("queue-list");
const clearQueueBtn = document.getElementById("clear-queue-btn");

async function getQueue() {
  const result = await chrome.storage.local.get(QUEUE_KEY);
  return result[QUEUE_KEY] || [];
}

async function clearQueue() {
  await chrome.storage.local.set({ [QUEUE_KEY]: [] });
}

async function flushQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0 };
  let flushed = 0;
  for (const payload of queue) {
    try {
      const res = await fetch(CAPTURE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) flushed++;
      else break;
    } catch {
      break;
    }
  }
  if (flushed > 0) {
    const remaining = queue.slice(flushed);
    await chrome.storage.local.set({ [QUEUE_KEY]: remaining });
  }
  return { flushed };
}

async function checkConnection() {
  try {
    const res = await fetch(PING_URL, { method: "GET" });
    if (res.ok) return true;
  } catch {
    // ShortPath not running
  }
  return false;
}

async function init() {
  const [connected, queue] = await Promise.all([checkConnection(), getQueue()]);

  if (connected) {
    statusDot.className = "dot green";
    statusText.textContent = "ShortPath is running";
    connectedPanel.classList.remove("hidden");

    if (queue.length > 0) {
      queueRow.classList.remove("hidden");
      queueCount.textContent = `${queue.length} item${queue.length !== 1 ? "s" : ""} queued`;
    }

    savePageBtn.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      const payload = {
        title: tab.title ?? "Untitled",
        body: "",
        url: tab.url ?? "",
        source: "browser-extension",
      };
      try {
        await fetch(CAPTURE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        window.close();
      } catch {
        statusText.textContent = "Could not reach ShortPath";
      }
    });

    flushBtn.addEventListener("click", async () => {
      flushBtn.textContent = "Importing...";
      flushBtn.disabled = true;
      const { flushed } = await flushQueue();
      const remaining = await getQueue();
      if (remaining.length === 0) {
        queueRow.classList.add("hidden");
      } else {
        queueCount.textContent = `${remaining.length} item${remaining.length !== 1 ? "s" : ""} queued`;
      }
      flushBtn.textContent = flushed > 0 ? `Imported ${flushed}` : "Import now";
      flushBtn.disabled = false;
    });
  } else {
    statusDot.className = "dot red";
    statusText.textContent = "ShortPath is not running";
    disconnectedPanel.classList.remove("hidden");

    if (queue.length > 0) {
      queueRowDc.classList.remove("hidden");
      queueCountDc.textContent = `${queue.length} item${queue.length !== 1 ? "s" : ""} queued — will import when ShortPath opens`;
      viewQueueBtn.classList.remove("hidden");
      clearQueueBtn.classList.remove("hidden");
    }

    viewQueueBtn.addEventListener("click", () => {
      if (queueList.classList.contains("hidden")) {
        queueList.innerHTML = "";
        queue.forEach((item) => {
          const el = document.createElement("div");
          el.className = "queue-item";
          el.title = item.title;
          el.textContent = item.title;
          queueList.appendChild(el);
        });
        queueList.classList.remove("hidden");
        viewQueueBtn.textContent = "Hide queued items";
      } else {
        queueList.classList.add("hidden");
        viewQueueBtn.textContent = "View queued items";
      }
    });

    clearQueueBtn.addEventListener("click", async () => {
      await clearQueue();
      queueRowDc.classList.add("hidden");
      queueList.classList.add("hidden");
      viewQueueBtn.classList.add("hidden");
      clearQueueBtn.classList.add("hidden");
    });
  }
}

init().catch(console.error);
