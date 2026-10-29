import react from "react";

type tagProps = {
    children: react.ReactNode
    onClick?: () => void
    selected?: boolean
}

const baseClasses = "inline-flex items-center justify-center rounded-md border py-2 px-5 text-xs font-medium";

export default function Tag({ children, onClick, selected = false }: tagProps) {
  if (!onClick) {
    return (
      <span className={`${baseClasses} border-stone-300 bg-white text-stone-800`}>
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${baseClasses} cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        selected
          ? "border-brand bg-brand text-white"
          : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-200"
      }`}
    >
      {children}
    </button>
  );
}
