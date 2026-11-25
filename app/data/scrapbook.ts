// Scrapbook pages: a fixed-size canvas with stickers (emoji), text and place photos.
// Everything here is plain data + pure functions so it can be tested without a canvas.

export const PAGE_WIDTH = 1000;
export const PAGE_HEIGHT = 700;
export const MAX_ITEMS = 60;
export const MAX_TITLE = 80;
export const DRAFT_KEY = "wander:scrapbook-draft";

export const STICKERS = [
  "📍", "🗺️", "✈️", "🚗", "🚲", "🚇", "🏙️", "🌆", "🗼", "🏛️",
  "🎡", "🎢", "🎭", "🎨", "🎵", "🎟️", "📸", "🌳", "🌊", "⛰️",
  "☀️", "🌙", "⭐", "🌈", "❄️", "🍕", "🌮", "🍜", "🍣", "🍔",
  "🥐", "🍦", "☕", "🧋", "🍻", "❤️", "😍", "🤩", "😂", "🥳",
] as const;

export const BACKGROUNDS = [
  { id: "bone", label: "Bone", color: "#F4E7E1" },
  { id: "paper", label: "Paper", color: "#FFFDF7" },
  { id: "sky", label: "Sky", color: "#DCEBF7" },
  { id: "mint", label: "Mint", color: "#DFF2E4" },
  { id: "peach", label: "Peach", color: "#FFE3CC" },
  { id: "night", label: "Night", color: "#1F2937" },
] as const;

export const TEXT_COLORS = ["#1C1917", "#FFFFFF", "#B23A16", "#1D4ED8", "#15803D", "#7E22CE"] as const;

type BaseItem = {
  id: string
  x: number
  y: number
  rotation: number
  scale: number
}

export type StickerItem = BaseItem & { type: "sticker"; emoji: string }
export type TextItem = BaseItem & { type: "text"; text: string; color: string; fontSize: number }
export type PhotoItem = BaseItem & { type: "photo"; src: string; caption: string; width: number; height: number }
export type ScrapbookItem = StickerItem | TextItem | PhotoItem

export type ScrapbookDoc = {
  title: string
  background: string
  items: ScrapbookItem[]
}

export function emptyDoc(): ScrapbookDoc {
  return { title: "My scrapbook", background: BACKGROUNDS[0].color, items: [] };
}

let counter = 0;
export function newId() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

// New items take turns landing in different spots around the page (as fractions of the page
// size) so they don't pile up on top of each other; after a full round they shift slightly.
const SLOTS = [
  [0.5, 0.45], [0.22, 0.28], [0.78, 0.3], [0.25, 0.72], [0.75, 0.72],
  [0.5, 0.18], [0.5, 0.8], [0.12, 0.5], [0.88, 0.5],
] as const;

function placement(doc: ScrapbookDoc, width: number, height: number) {
  const n = doc.items.length;
  const [fx, fy] = SLOTS[n % SLOTS.length];
  const shift = Math.floor(n / SLOTS.length) * 20;
  return {
    x: Math.round(fx * PAGE_WIDTH - width / 2 + shift),
    y: Math.round(fy * PAGE_HEIGHT - height / 2 + shift),
    rotation: 0,
    scale: 1,
  };
}

export function addSticker(doc: ScrapbookDoc, emoji: string): ScrapbookDoc {
  if (doc.items.length >= MAX_ITEMS) return doc;
  return { ...doc, items: [...doc.items, { id: newId(), type: "sticker", emoji, ...placement(doc, 96, 96) }] };
}

export function addText(doc: ScrapbookDoc, text = "Double-click to edit"): ScrapbookDoc {
  if (doc.items.length >= MAX_ITEMS) return doc;
  const item: TextItem = { id: newId(), type: "text", text, color: TEXT_COLORS[0], fontSize: 40, ...placement(doc, 320, 48) };
  return { ...doc, items: [...doc.items, item] };
}

export function addPhoto(doc: ScrapbookDoc, src: string, caption = ""): ScrapbookDoc {
  if (doc.items.length >= MAX_ITEMS) return doc;
  const item: PhotoItem = { id: newId(), type: "photo", src, caption, width: 280, height: 210, ...placement(doc, 280, 240) };
  // Polaroid-style photos look better slightly tilted
  item.rotation = doc.items.length % 2 === 0 ? -4 : 4;
  return { ...doc, items: [...doc.items, item] };
}

export function updateItem(doc: ScrapbookDoc, id: string, changes: Partial<ScrapbookItem>): ScrapbookDoc {
  return { ...doc, items: doc.items.map((item) => (item.id === id ? ({ ...item, ...changes, id, type: item.type } as ScrapbookItem) : item)) };
}

export function removeItem(doc: ScrapbookDoc, id: string): ScrapbookDoc {
  return { ...doc, items: doc.items.filter((item) => item.id !== id) };
}

// Items draw in array order, so moving an item later puts it on top
export function moveItem(doc: ScrapbookDoc, id: string, direction: "up" | "down" | "top" | "bottom"): ScrapbookDoc {
  const index = doc.items.findIndex((item) => item.id === id);
  if (index === -1) return doc;
  const items = [...doc.items];
  const [item] = items.splice(index, 1);
  const target =
    direction === "top" ? items.length
    : direction === "bottom" ? 0
    : direction === "up" ? Math.min(items.length, index + 1)
    : Math.max(0, index - 1);
  items.splice(target, 0, item);
  return { ...doc, items };
}

export function nudgeItem(doc: ScrapbookDoc, id: string, dx: number, dy: number): ScrapbookDoc {
  const item = doc.items.find((i) => i.id === id);
  if (!item) return doc;
  return updateItem(doc, id, { x: clamp(item.x + dx, -200, PAGE_WIDTH), y: clamp(item.y + dy, -200, PAGE_HEIGHT) });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function describeItem(item: ScrapbookItem) {
  if (item.type === "sticker") return `Sticker ${item.emoji}`;
  if (item.type === "text") return `Text “${item.text.length > 24 ? `${item.text.slice(0, 24)}…` : item.text}”`;
  return `Photo${item.caption ? `: ${item.caption}` : ""}`;
}

// Reading saved data -------------------------------------------------------------------

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

function parseItem(raw: unknown): ScrapbookItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isStr(r.id) || !isNum(r.x) || !isNum(r.y)) return null;
  const base = { id: r.id, x: r.x, y: r.y, rotation: isNum(r.rotation) ? r.rotation : 0, scale: isNum(r.scale) && r.scale > 0 ? r.scale : 1 };
  if (r.type === "sticker" && isStr(r.emoji)) return { ...base, type: "sticker", emoji: r.emoji };
  if (r.type === "text" && isStr(r.text)) {
    return { ...base, type: "text", text: r.text.slice(0, 500), color: isStr(r.color) ? r.color : TEXT_COLORS[0], fontSize: isNum(r.fontSize) ? r.fontSize : 40 };
  }
  if (r.type === "photo" && isStr(r.src) && /^https:\/\//.test(r.src)) {
    return { ...base, type: "photo", src: r.src, caption: isStr(r.caption) ? r.caption : "", width: isNum(r.width) ? r.width : 280, height: isNum(r.height) ? r.height : 210 };
  }
  return null;
}

// Tolerates missing/corrupted data: anything unreadable is dropped instead of crashing the editor
export function parseDoc(raw: unknown): ScrapbookDoc {
  const fallback = emptyDoc();
  if (typeof raw !== "object" || raw === null) return fallback;
  const r = raw as Record<string, unknown>;
  const items = Array.isArray(r.items) ? r.items.map(parseItem).filter((i): i is ScrapbookItem => i !== null).slice(0, MAX_ITEMS) : [];
  return {
    title: isStr(r.title) && r.title.trim() ? r.title.slice(0, MAX_TITLE) : fallback.title,
    background: isStr(r.background) && /^#[0-9a-f]{6}$/i.test(r.background) ? r.background : fallback.background,
    items,
  };
}

// Guest drafts live in localStorage until the person signs in and saves --------------

export function loadDraft(): ScrapbookDoc | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? parseDoc(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveDraft(doc: ScrapbookDoc) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(doc));
  } catch {
    // Storage full or blocked: the draft just won't survive a refresh
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function fileNameFor(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "scrapbook"}.png`;
}
