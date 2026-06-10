import type { Entry } from "@shared/types";

export function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function copyEntry(entry: Entry): Promise<void> {
  const raw = entry.body ?? entry.link ?? entry.title;
  if (entry.copyMode === "html" && entry.body) {
    const plain = htmlToPlain(entry.body);
    const htmlBlob = new Blob([raw], { type: "text/html" });
    const plainBlob = new Blob([plain], { type: "text/plain" });
    return navigator.clipboard.write([new ClipboardItem({ "text/html": htmlBlob, "text/plain": plainBlob })]);
  }
  return navigator.clipboard.writeText(htmlToPlain(raw));
}
