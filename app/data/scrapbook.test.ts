import { beforeEach, describe, expect, it } from "vitest";
import {
  DRAFT_KEY,
  MAX_ITEMS,
  addPhoto,
  addSticker,
  addText,
  clearDraft,
  describeItem,
  emptyDoc,
  fileNameFor,
  loadDraft,
  moveItem,
  nudgeItem,
  parseDoc,
  removeItem,
  saveDraft,
  updateItem,
  type ScrapbookDoc,
} from "./scrapbook";

function docWith(n: number): ScrapbookDoc {
  let doc = emptyDoc();
  for (let i = 0; i < n; i++) doc = addSticker(doc, "⭐");
  return doc;
}

describe("adding items", () => {
  it("adds stickers, text and photos with unique ids", () => {
    let doc = addSticker(emptyDoc(), "🌮");
    doc = addText(doc, "best tacos");
    doc = addPhoto(doc, "https://upload.wikimedia.org/a.jpg", "Kensington");
    expect(doc.items.map((i) => i.type)).toEqual(["sticker", "text", "photo"]);
    expect(new Set(doc.items.map((i) => i.id)).size).toBe(3);
  });

  it("offsets new items so they don't sit exactly on top of each other", () => {
    const doc = docWith(2);
    expect(doc.items[0].x).not.toBe(doc.items[1].x);
  });

  it("stops adding at the item limit", () => {
    const full = docWith(MAX_ITEMS);
    expect(addSticker(full, "❤️").items).toHaveLength(MAX_ITEMS);
    expect(addText(full).items).toHaveLength(MAX_ITEMS);
  });

  it("doesn't change the original document", () => {
    const doc = emptyDoc();
    addSticker(doc, "⭐");
    expect(doc.items).toHaveLength(0);
  });
});

describe("editing items", () => {
  it("updates one item without changing its id or type", () => {
    const doc = addText(emptyDoc(), "hi");
    const id = doc.items[0].id;
    const next = updateItem(doc, id, { text: "hello", id: "hacked", type: "sticker" } as never);
    expect(next.items[0]).toMatchObject({ id, type: "text", text: "hello" });
  });

  it("removes items", () => {
    const doc = docWith(3);
    expect(removeItem(doc, doc.items[1].id).items.map((i) => i.id)).toEqual([doc.items[0].id, doc.items[2].id]);
  });

  it("reorders items (later in the list draws on top)", () => {
    const doc = docWith(3);
    const [a, b, c] = doc.items.map((i) => i.id);
    expect(moveItem(doc, a, "up").items.map((i) => i.id)).toEqual([b, a, c]);
    expect(moveItem(doc, c, "down").items.map((i) => i.id)).toEqual([a, c, b]);
    expect(moveItem(doc, a, "top").items.map((i) => i.id)).toEqual([b, c, a]);
    expect(moveItem(doc, c, "bottom").items.map((i) => i.id)).toEqual([c, a, b]);
    expect(moveItem(doc, c, "up").items.map((i) => i.id)).toEqual([a, b, c]);
  });

  it("nudges items with the keyboard but keeps them near the page", () => {
    const doc = addSticker(emptyDoc(), "⭐");
    const { id, x, y } = doc.items[0];
    expect(nudgeItem(doc, id, 4, -4).items[0]).toMatchObject({ x: x + 4, y: y - 4 });
    expect(nudgeItem(doc, id, -99999, 0).items[0].x).toBe(-200);
  });

  it("describes items for the accessible layers list", () => {
    const doc = addPhoto(addText(addSticker(emptyDoc(), "🌮"), "a very long note that keeps on going"), "https://x.org/a.jpg", "ROM");
    expect(doc.items.map(describeItem)).toEqual(["Sticker 🌮", "Text “a very long note that ke…”", "Photo: ROM"]);
  });
});

describe("parseDoc", () => {
  it("returns an empty page for missing or junk data", () => {
    expect(parseDoc(null)).toEqual(emptyDoc());
    expect(parseDoc("nope")).toEqual(emptyDoc());
  });

  it("keeps valid items and drops broken or unsafe ones", () => {
    const doc = parseDoc({
      title: "Trip",
      background: "#DCEBF7",
      items: [
        { id: "1", type: "sticker", emoji: "⭐", x: 1, y: 2 },
        { id: "2", type: "text", x: 1 },
        { id: "3", type: "photo", src: "javascript:alert(1)", x: 0, y: 0 },
        { id: "4", type: "photo", src: "https://upload.wikimedia.org/a.jpg", x: 0, y: 0 },
        { id: "5", type: "mystery", x: 0, y: 0 },
      ],
    });
    expect(doc.title).toBe("Trip");
    expect(doc.background).toBe("#DCEBF7");
    expect(doc.items.map((i) => i.id)).toEqual(["1", "4"]);
    expect(doc.items[0]).toMatchObject({ rotation: 0, scale: 1 });
  });

  it("rejects backgrounds that aren't hex colours", () => {
    expect(parseDoc({ background: "url(evil)" }).background).toBe(emptyDoc().background);
  });
});

describe("guest drafts", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips through localStorage and can be cleared", () => {
    const doc = addText(emptyDoc(), "draft");
    saveDraft(doc);
    expect(loadDraft()?.items[0]).toMatchObject({ type: "text", text: "draft" });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("ignores a corrupted draft", () => {
    localStorage.setItem(DRAFT_KEY, "{not json");
    expect(loadDraft()).toBeNull();
  });
});

describe("fileNameFor", () => {
  it("makes a safe file name from the title", () => {
    expect(fileNameFor("Toronto Trip '26!")).toBe("toronto-trip-26.png");
    expect(fileNameFor("🎉")).toBe("scrapbook.png");
  });
});
