"use client";

import { DatabaseStatus } from "./DatabaseStatus";
import { SystemLight } from "./SystemLight";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  mcpConnected: boolean;
}

/**
 * Compact console header.
 * Mobile: title + status light only.
 * Desktop: adds subtitle + DATABASE/MCP indicators + theme toggle.
 */
export function Header({ mcpConnected }: HeaderProps) {
  return (
    <header className="safe-top sticky top-0 z-30 bg-paper border-b border-line-strong">
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <SystemLight state="ok" />
            <h1 className="font-mono text-sm md:text-base font-semibold tracking-[0.18em] uppercase truncate">
              Mission Control
            </h1>
          </div>
          <p className="tech-label mt-0.5 hidden md:block">Personal Engineering Operations</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-4">
            <DatabaseStatus />
            <span className="tech-label inline-flex items-center gap-1.5">
              <SystemLight state={mcpConnected ? "ok" : "down"} />
              MCP · {mcpConnected ? "CONNECTED" : "OFFLINE"}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
