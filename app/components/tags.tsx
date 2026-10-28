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
      <span className={`${baseClasses} border-gray-600 text-white`}>
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${baseClasses} cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        selected
          ? "border-white bg-white text-black"
          : "border-gray-600 text-white hover:border-gray-400 hover:bg-[#2a2a2a]"
      }`}
    >
      {children}
    </button>
  );
}
