// Global pending message system — survives full page reload.
// Backed by localStorage so it survives even document.body replacement.

const KEY = "morinerie_pending_msg";

export function setPending(type: "success" | "error" | "info", text: string) {
  localStorage.setItem(KEY, JSON.stringify({ type, text, ts: Date.now() }));
}

export function consumePending(): { type: "success" | "error" | "info"; text: string } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > 10000) return null;
    return { type: data.type, text: data.text };
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}
