import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, className = "", id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="tech-label block mb-1.5">
          {label}
        </label>
      ) : null}
      <input ref={ref} id={inputId} className={`field-eng ${className}`} {...props} />
    </div>
  );
});
