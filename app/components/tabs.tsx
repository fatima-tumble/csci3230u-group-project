import { useRef } from "react";

export type TabItem = { id: string; label: string; content: React.ReactNode }

type tabsProps = {
  label: string
  items: TabItem[]
  active: string
  onChange: (id: string) => void
}

// Accessible tabs (arrow keys move between them). With a single item it just shows a heading.
export default function Tabs({ label, items, active, onChange }: tabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = items.find((t) => t.id === active) ?? items[0];
  const baseId = label.toLowerCase().replace(/\s+/g, "-");

  if (items.length === 1) {
    return (
      <section aria-labelledby={`${baseId}-${current.id}-heading`}>
        <h2 id={`${baseId}-${current.id}-heading`} className="mb-4 text-xl font-bold">{current.label}</h2>
        {current.content}
      </section>
    );
  }

  function handleKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = items[(index + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label={label} className="mb-4 flex gap-6 border-b-2 border-stone-300">
        {items.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => { refs.current[tab.id] = el; }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={current.id === tab.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={current.id === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKey(e, index)}
            className={`-mb-0.5 border-b-4 px-1 pb-2 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
              current.id === tab.id ? "border-brand-dark text-stone-900" : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${current.id}`}>
        {current.content}
      </div>
    </div>
  );
}
