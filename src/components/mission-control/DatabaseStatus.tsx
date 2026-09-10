"use client";

import { useEffect, useState } from "react";
import { SystemLight } from "./SystemLight";

interface HealthResponse {
  database: "CONNECTED" | "DEGRADED";
}

/**
 * Real database status indicator. Polls /api/health once on mount
 * (plus on window focus). Never fakes the state.
 */
export function DatabaseStatus() {
  const [state, setState] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as HealthResponse;
        if (!cancelled) setState(body.database === "CONNECTED" ? "ok" : "down");
      } catch {
        if (!cancelled) setState("down");
      }
    };

    void check();
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
    };
  }, []);

  if (state === "checking") {
    return (
      <span className="tech-label inline-flex items-center gap-1.5">
        <SystemLight state="warn" />
        DATABASE · CHECKING
      </span>
    );
  }

  return (
    <span className="tech-label inline-flex items-center gap-1.5">
      <SystemLight state={state === "ok" ? "ok" : "down"} />
      DATABASE · {state === "ok" ? "CONNECTED" : "DEGRADED"}
    </span>
  );
}
