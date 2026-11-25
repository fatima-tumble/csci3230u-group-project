import { useId } from "react";

type formFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  type?: string
  autoComplete?: string
  multiline?: boolean
  maxLength?: number
  required?: boolean
  autoFocus?: boolean
}

export const inputClasses =
  "w-full rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand aria-invalid:border-red-700";

// Labelled, controlled input with its hint and error wired up for screen readers
export default function FormField({
  label, value, onChange, error, hint, type = "text", autoComplete, multiline, maxLength, required, autoFocus,
}: formFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const shared = {
    id,
    value,
    required,
    autoFocus,
    maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: inputClasses,
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      {multiline ? (
        <textarea {...shared} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p id={hintId} className="text-xs text-stone-600">{hint}</p>}
      {error && <p id={errorId} className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
