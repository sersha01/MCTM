"use client";

import { useEffect, useRef } from "react";

interface SearchBarProps {
  open: boolean;
  query: string;
  onChange: (q: string) => void;
  onClose: () => void;
}

/**
 * Search overlay. `/` focuses it on desktop. Debounce is
 * handled by the parent (the query consumer).
 */
export function SearchBar({ open, query, onChange, onClose }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (query) onChange("");
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, query, onChange, onClose]);

  if (!open) return null;

  return (
    <div className="anim-fade px-4 pt-3 md:px-6" role="search">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="SEARCH TITLE / BRANCH / DETAILS..."
          aria-label="Search work orders"
          className="field-eng font-mono !text-xs md:!text-sm tracking-wider uppercase"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="absolute right-2 top-1/2 -translate-y-1/2 btn-eng !min-h-[34px] !min-w-[34px] !p-0 !px-2"
        >
          ESC
        </button>
      </div>
    </div>
  );
}
