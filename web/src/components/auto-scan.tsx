"use client";
import { useEffect } from "react";

const API =
  process.env.NEXT_PUBLIC_HUB_API_URL ?? "http://127.0.0.1:8787";

export function AutoScan() {
  useEffect(() => {
    const id = setInterval(() => {
      fetch(`${API}/api/scan`, { method: "POST" }).catch(() => {});
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}
