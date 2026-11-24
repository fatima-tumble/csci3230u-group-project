import { forwardRef } from "react";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import {
  BACKGROUNDS,
  STICKERS,
  TEXT_COLORS,
  describeItem,
  type ScrapbookDoc,
  type ScrapbookItem,
} from "../../data/scrapbook";
import Button from "../button";
import { inputClasses } from "../formField";

export type ToolId = "stickers" | "text" | "photos" | "background";

export const TOOLS: { id: ToolId; label: string; icon: string }[] = [
  { id: "stickers", label: "Stickers", icon: "😀" },
  { id: "text", label: "Text", icon: "T" },
  { id: "photos", label: "Photos", icon: "🖼" },
  { id: "background", label: "Background", icon: "🎨" },
];

const swatch = "h-9 w-9 rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function StickerPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <ul aria-label="Stickers" className="grid grid-cols-8 gap-1 sm:grid-cols-10">
      {STICKERS.map((emoji) => (
        <li key={emoji}>
          <button
            type="button"
            onClick={() => onPick(emoji)}
            aria-label={`Add ${emoji} sticker`}
            className="flex h-11 w-full items-center justify-center rounded-lg text-2xl hover:bg-bone focus-visible:outline-2 focus-visible:outline-brand"
          >
            {emoji}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TextTool({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onAdd}>+ Add text</Button>
      <p className="text-sm text-stone-700">Then edit the words, colour and size in the panel below the page.</p>
    </div>
  );
}

// Photos come from places you've recently viewed, so there's nothing to upload
export function PhotoPicker({ onPick }: { onPick: (src: string, caption: string) => void }) {
  const { places } = useRecentlyViewed();
  const withImages = places.filter((p) => p.image);
  if (withImages.length === 0) {
    return <p className="text-sm text-stone-700">Photos of places you view show up here. Open a few places first, then come back.</p>;
  }
  return (
    <ul aria-label="Place photos" className="flex gap-3 overflow-x-auto pb-2">
      {withImages.map((place) => {
        const src = place.image!.replace(/\/\d+px-/, "/500px-");
        return (
          <li key={place.xid} className="w-28 shrink-0">
            <button
              type="button"
              onClick={() => onPick(src, place.name)}
              className="flex w-full flex-col gap-1 rounded-lg p-1 text-left hover:bg-bone focus-visible:outline-2 focus-visible:outline-brand"
            >
              <img src={place.image!.replace(/\/\d+px-/, "/330px-")} alt="" className="aspect-4/3 w-full rounded-md object-cover" />
              <span className="text-xs font-semibold leading-tight line-clamp-2">Add {place.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function BackgroundPicker({ value, onPick }: { value: string; onPick: (color: string) => void }) {
  return (
    <ul aria-label="Background colours" className="flex flex-wrap gap-3">
      {BACKGROUNDS.map((bg) => (
        <li key={bg.id}>
          <button
            type="button"
            onClick={() => onPick(bg.color)}
            aria-label={`${bg.label} background`}
            aria-pressed={value === bg.color}
            className={`${swatch} ${value === bg.color ? "border-brand-dark ring-2 ring-brand-dark ring-offset-2" : "border-stone-300"}`}
            style={{ backgroundColor: bg.color }}
          />
        </li>
      ))}
    </ul>
  );
}

type selectedPanelProps = {
  item: ScrapbookItem
  onChange: (changes: Partial<ScrapbookItem>) => void
  onMove: (direction: "up" | "down" | "top" | "bottom") => void
  onDelete: () => void
}

// Edit whatever is selected. The text box is focusable from the canvas (double-click a text item).
export const SelectedPanel = forwardRef<HTMLTextAreaElement, selectedPanelProps>(function SelectedPanel(
  { item, onChange, onMove, onDelete }, textRef,
) {
  return (
    <section aria-labelledby="selected-heading" className="flex flex-col gap-4 rounded-2xl border border-stone-300 bg-white p-4">
      <h2 id="selected-heading" className="font-bold">Selected: {describeItem(item)}</h2>

      {item.type === "text" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="selected-text" className="text-sm font-semibold">Text</label>
            <textarea id="selected-text" ref={textRef} rows={2} maxLength={500} value={item.text} onChange={(e) => onChange({ text: e.target.value })} className={inputClasses} />
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Colour</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange({ color })}
                  aria-label={`Text colour ${color}`}
                  aria-pressed={item.color === color}
                  className={`${swatch} ${item.color === color ? "border-brand-dark ring-2 ring-brand-dark ring-offset-2" : "border-stone-300"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="selected-size" className="text-sm font-semibold">Size: {item.fontSize}px</label>
            <input id="selected-size" type="range" min={16} max={120} value={item.fontSize} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="accent-brand-dark" />
          </div>
        </>
      )}

      {item.type === "photo" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="selected-caption" className="text-sm font-semibold">Caption</label>
          <input id="selected-caption" type="text" maxLength={40} value={item.caption} onChange={(e) => onChange({ caption: e.target.value })} className={inputClasses} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onMove("up")}>Bring forward</Button>
        <Button variant="secondary" onClick={() => onMove("down")}>Send back</Button>
        <Button variant="secondary" onClick={() => onChange({ rotation: 0, scale: 1 })}>Reset size &amp; angle</Button>
        <Button variant="danger" onClick={onDelete}>Delete</Button>
      </div>
      <p className="text-xs text-stone-600">Tip: drag to move, use the corner handles to resize and rotate. Arrow keys nudge, Delete removes.</p>
    </section>
  );
});

// Keyboard-friendly list of everything on the page (the canvas itself can't be read by screen readers)
export function LayersList({ doc, selectedId, onSelect }: { doc: ScrapbookDoc; selectedId: string | null; onSelect: (id: string) => void }) {
  if (doc.items.length === 0) return null;
  return (
    <section aria-labelledby="layers-heading" className="rounded-2xl border border-stone-300 bg-white p-4">
      <h2 id="layers-heading" className="font-bold">On this page ({doc.items.length})</h2>
      <ol className="mt-2 flex flex-col-reverse gap-1">
        {doc.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={selectedId === item.id}
              className={`w-full rounded-lg px-3 py-1.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-brand ${
                selectedId === item.id ? "bg-brand-dark font-semibold text-white" : "hover:bg-bone"
              }`}
            >
              {describeItem(item)}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
