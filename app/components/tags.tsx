import react from "react";

type tagProps = {
    children: react.ReactNode
}

export default function Tag({ children }: tagProps) {
  return (
    <span className="inline-flex items-center justify-center rounded-md border border-gray-600 py-3 px-5 text-xs font-medium text-white">
      {children}
    </span>
  );
}
