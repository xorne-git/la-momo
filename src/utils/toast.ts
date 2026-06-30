import { toast as hotToast } from "react-hot-toast";

export interface ToastEntry {
  type: "success" | "error" | "danger" | "info" | "warning";
  message: string;
  time: number;
  read: boolean;
  id: number;
}

let nextId = 0;
let toastHistory: ToastEntry[] = [];
const MAX_HISTORY = 20;
let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((f) => f !== fn); };
}

function push(type: ToastEntry["type"], msg: string) {
  toastHistory = [{ type, message: msg, time: Date.now(), read: false, id: nextId++ }, ...toastHistory].slice(0, MAX_HISTORY);
  notify();
}

export function getToastHistory(): ToastEntry[] {
  return toastHistory;
}

export function markAllRead() {
  toastHistory.forEach((entry) => { entry.read = true; });
  notify();
}

export function dismissToast(id: number) {
  toastHistory = toastHistory.filter((e) => e.id !== id);
  notify();
}

export function unreadCount(): number {
  return toastHistory.filter((e) => !e.read).length;
}

export const toast = {
  success: (msg: string) => {
    push("success", msg);
    hotToast.success(msg, {
      style: {
        background: "#EAF7EE",
        color: "#1B5E20",
        border: "1px solid #B7E1CD",
      },
      iconTheme: {
        primary: "#1B5E20",
        secondary: "#EAF7EE",
      },
    });
  },
  error: (msg: string) => {
    push("error", msg);
    hotToast.error(msg, {
      style: {
        background: "#FCE8E6",
        color: "#C5221F",
        border: "1px solid #FAD2CF",
      },
      iconTheme: {
        primary: "#C5221F",
        secondary: "#FCE8E6",
      },
    });
  },
  danger: (msg: string) => {
    push("danger", msg);
    hotToast.error(msg, {
      style: {
        background: "#FCE8E6",
        color: "#C5221F",
        border: "1px solid #FAD2CF",
      },
      iconTheme: {
        primary: "#C5221F",
        secondary: "#FCE8E6",
      },
    });
  },
  info: (msg: string) => {
    push("info", msg);
    hotToast(msg, {
      icon: "ℹ️",
      style: {
        background: "#E8F0FE",
        color: "#1A73E8",
        border: "1px solid #D2E3FC",
      },
    });
  },
  warning: (msg: string) => {
    push("warning", msg);
    hotToast(msg, {
      icon: "⚠️",
      style: {
        background: "#FEF7E0",
        color: "#B06000",
        border: "1px solid #FDE293",
      },
    });
  },
};
