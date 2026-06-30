import { useState, useEffect } from "react";
import { consumePending } from "../utils/pendingMsg";

const bg: Record<string, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-sky-50 border-sky-200 text-sky-800",
};
const icons: Record<string, string> = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

export default function PendingMessageDisplay() {
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [counter, setCounter] = useState(0);

  // Check for pending messages on every render
  useEffect(() => {
    const p = consumePending();
    if (p) setMsg(p);
  });

  // Auto-dismiss after 3 seconds — runs only when msg changes
  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(timer);
  }, [msg]);

  // Poll every 500ms when no message
  useEffect(() => {
    if (msg) return;
    const id = setInterval(() => setCounter((c) => c + 1), 500);
    return () => clearInterval(id);
  }, [msg]);

  if (!msg) return null;

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3 border rounded-sm shadow-md flex items-center gap-3 font-mono text-[11px] animate-[slideUp_0.3s_ease-out] ${bg[msg.type]}`}
      style={{ minWidth: "300px", maxWidth: "500px" }}
      dangerouslySetInnerHTML={{ __html: `${icons[msg.type]}<span>${msg.text}</span>` }}
    />
  );
}
