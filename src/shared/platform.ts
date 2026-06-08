export function formatAccelerator(acc: string, platform: string): string {
  return acc
    .replace("CommandOrControl", platform === "darwin" ? "Cmd" : "Ctrl")
    .replace(/\+/g, " + ");
}
