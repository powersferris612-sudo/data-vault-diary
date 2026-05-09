import { useEffect, useState, useCallback } from "react";

// Realtime current month/year (recomputed on mount, and exposed setter for navigating)
export function useCurrentMonth() {
  const [{ year, month }, set] = useState(() => {
    if (typeof window === "undefined") return { year: 2026, month: 5 };
    // Default to today, but never before May 2026 (tracking start)
    const d = new Date();
    let y = d.getFullYear(); let m = d.getMonth() + 1;
    if (y < 2026 || (y === 2026 && m < 5)) { y = 2026; m = 5; }
    return { year: y, month: m };
  });
  const setYM = useCallback((y: number, m: number) => set({ year: y, month: m }), []);
  return { year, month, setYM };
}

// Subscribe to data changes from finance-store
export function useDataVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV(x => x + 1);
    window.addEventListener("hf:data-changed", h);
    return () => window.removeEventListener("hf:data-changed", h);
  }, []);
  return v;
}
