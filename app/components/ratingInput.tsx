import { useId } from "react";

type ratingInputProps = {
  value: number | null
  onChange: (value: number) => void
  error?: string | null
}

// 1–10 rating as a native radio group: arrow keys move between options for free
export default function RatingInput({ value, onChange, error }: ratingInputProps) {
  const name = useId();
  const errorId = `${name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
      <legend className="text-sm font-semibold">Rating <span className="font-normal text-stone-600">(out of 10)</span></legend>
      <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <label key={n} className="relative">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span
              className="flex h-10 cursor-pointer items-center justify-center rounded-lg border-2 border-stone-300 bg-white text-sm font-bold transition-colors hover:border-stone-400 peer-checked:border-brand-dark peer-checked:bg-brand-dark peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
            >
              {n}
            </span>
          </label>
        ))}
      </div>
      {error && <p id={errorId} className="mt-1 text-xs font-semibold text-red-700">{error}</p>}
    </fieldset>
  );
}
