"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  default: "",
  primary: "is-primary",
  danger: "is-danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", loading = false, className = "", children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`btn-eng ${variantClass[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="anim-pulse">{children}</span> : children}
    </button>
  );
});
