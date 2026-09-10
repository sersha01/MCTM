import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, className = "", id, ...props },
  ref
) {
  const areaId = id ?? props.name;
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={areaId} className="tech-label block mb-1.5">
          {label}
        </label>
      ) : null}
      <textarea ref={ref} id={areaId} className={`field-eng ${className}`} {...props} />
    </div>
  );
});
