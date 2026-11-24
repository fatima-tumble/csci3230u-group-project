import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import Header from "../components/header";
import Button from "../components/button";
import { inputClasses } from "../components/formField";
import { useAuth } from "../context/auth";
import type { ScrapbookCanvasHandle } from "../components/scrapbook/scrapbookCanvas";
import {
  BackgroundPicker,
  LayersList,
  PhotoPicker,
  SelectedPanel,
  StickerPicker,
  TextTool,
  TOOLS,
  type ToolId,
} from "../components/scrapbook/editorPanels";
import {
  MAX_ITEMS,
  MAX_TITLE,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  addPhoto,
  addSticker,
  addText,
  clearDraft,
  emptyDoc,
  fileNameFor,
  loadDraft,
  moveItem,
  nudgeItem,
  removeItem,
  saveDraft,
  updateItem,
  type ScrapbookDoc,
  type ScrapbookItem,
} from "../data/scrapbook";
import { fetchScrapbook, saveScrapbook } from "../data/scrapbookApi";

// Konva needs a real browser canvas, so the page only loads it on the client
const ScrapbookCanvas = lazy(() => import("../components/scrapbook/scrapbookCanvas"));

export function meta() {
  return [{ title: "Scrapbook · Wander" }];
}

type LoadState = { status: "loading" } | { status: "ready" } | { status: "missing" } | { status: "error"; message: string };
type PendingAction = "save" | "download" | null;

function CanvasPlaceholder() {
  return <div className="w-full rounded-xl border-2 border-stone-300 bg-white" style={{ aspectRatio: `${PAGE_WIDTH} / ${PAGE_HEIGHT}` }} aria-hidden="true" />;
}

export default function ScrapbookEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enabled, loading: authLoading, user, openAuth } = useAuth();

  const [doc, setDoc] = useState<ScrapbookDoc>(emptyDoc);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [load, setLoad] = useState<LoadState>({ status: id ? "loading" : "ready" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolId>("stickers");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<PendingAction>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [mounted, setMounted] = useState(false);

  const canvasRef = useRef<ScrapbookCanvasHandle>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const readOnly = !!id && load.status === "ready" && ownerId !== user?.id;
  const selected = doc.items.find((i) => i.id === selectedId) ?? null;

  useEffect(() => setMounted(true), []);

  // New scrapbook: pick up the guest draft if there is one
  useEffect(() => {
    if (id) return;
    const draft = loadDraft();
    if (draft) setDoc(draft);
    setLoad({ status: "ready" });
  }, [id]);

  // Saved scrapbook: load it
  useEffect(() => {
    if (!id || !enabled || authLoading) return;
    let cancelled = false;
    setLoad({ status: "loading" });
    fetchScrapbook(id)
      .then((book) => {
        if (cancelled) return;
        if (!book) return setLoad({ status: "missing" });
        setDoc(book.data);
        setOwnerId(book.user_id);
        setIsPublic(book.is_public);
        setDirty(false);
        setLoad({ status: "ready" });
      })
      .catch((err: Error) => { if (!cancelled) setLoad({ status: "error", message: err.message }); });
    return () => { cancelled = true; };
  }, [id, enabled, authLoading, user?.id]);

  // Autosave unsaved work locally so a refresh (or signing up) doesn't lose it
  useEffect(() => {
    if (!id && load.status === "ready" && dirty) saveDraft(doc);
  }, [doc, id, load.status, dirty]);

  const change = useCallback((updater: (d: ScrapbookDoc) => ScrapbookDoc) => {
    setDoc(updater);
    setDirty(true);
    setMessage(null);
  }, []);

  function addAndSelect(updater: (d: ScrapbookDoc) => ScrapbookDoc) {
    if (doc.items.length >= MAX_ITEMS) {
      setMessage({ kind: "error", text: `A page can hold up to ${MAX_ITEMS} items.` });
      return;
    }
    const next = updater(doc);
    setDoc(next);
    setDirty(true);
    setSelectedId(next.items[next.items.length - 1]?.id ?? null);
  }

  // Keyboard: arrows nudge the selected item (Shift = bigger steps), Delete removes it
  useEffect(() => {
    if (readOnly) return;
    function onKey(e: KeyboardEvent) {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
      const step = e.shiftKey ? 20 : 4;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) {
        e.preventDefault();
        change((d) => nudgeItem(d, selectedId, ...moves[e.key]));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        change((d) => removeItem(d, selectedId));
        setSelectedId(null);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, readOnly, change]);

  const doSave = useCallback(async () => {
    if (!user) return;
    setBusy("save");
    setMessage(null);
    try {
      const thumbnail = await canvasRef.current?.toBlob(0.4) ?? null;
      const savedId = await saveScrapbook({ userId: user.id, id, doc, isPublic, thumbnail });
      setDirty(false);
      if (!id) {
        clearDraft();
        navigate(`/scrapbooks/${savedId}`, { replace: true });
      }
      setMessage({ kind: "ok", text: "Saved!" });
    } catch (err) {
      setMessage({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }, [user, id, doc, isPublic, navigate]);

  const doDownload = useCallback(async () => {
    setBusy("download");
    try {
      const blob = await canvasRef.current?.toBlob(2);
      if (!blob) throw new Error("Couldn't create the image. Try again.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFor(doc.title);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setMessage({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }, [doc.title]);

  // Saving and downloading need an account. Guests get the sign-in dialog, and once they're
  // signed in the action they asked for carries on automatically.
  function requireAccount(action: Exclude<PendingAction, null>) {
    if (user) {
      if (action === "save") doSave(); else doDownload();
      return;
    }
    openAuth({
      reason: action === "save" ? "Create a free account to save your scrapbook." : "Create a free account to download your scrapbook.",
      onSuccess: () => setPending(action),
    });
  }

  useEffect(() => {
    if (!pending || !user) return;
    const action = pending;
    setPending(null);
    if (action === "save") doSave(); else doDownload();
  }, [pending, user, doSave, doDownload]);

  function handleEditText(itemId: string) {
    setSelectedId(itemId);
    setTimeout(() => {
      textRef.current?.focus();
      textRef.current?.select();
    }, 0);
  }

  if (load.status === "loading") {
    return <><Header /><main className="mt-4 px-6 w-full max-w-6xl mx-auto"><p role="status" className="text-lg font-bold">Loading scrapbook…</p></main></>;
  }
  if (load.status === "missing" || load.status === "error") {
    return (
      <><Header />
        <main className="mt-4 flex flex-col items-start gap-3 px-6 w-full max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">{load.status === "missing" ? "Scrapbook not found" : "Couldn't load this scrapbook"}</h1>
          <p className="text-stone-700">{load.status === "missing" ? "It may have been deleted or made private." : load.message}</p>
          <Link to="/scrapbooks" className="font-bold underline">Back to scrapbooks</Link>
        </main>
      </>
    );
  }

  const canvas = mounted ? (
    <Suspense fallback={<CanvasPlaceholder />}>
      <ScrapbookCanvas
        ref={canvasRef}
        doc={doc}
        selectedId={selectedId}
        readOnly={readOnly}
        onSelect={setSelectedId}
        onChange={(itemId, changes) => change((d) => updateItem(d, itemId, changes))}
        onEditText={handleEditText}
      />
    </Suspense>
  ) : <CanvasPlaceholder />;

  if (readOnly) {
    return <>
      <Header />
      <main className="mt-4 mb-12 flex flex-col gap-4 px-6 w-full max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{doc.title}</h1>
          <Button variant="secondary" disabled={busy === "download"} onClick={() => requireAccount("download")}>Download PNG</Button>
        </div>
        {canvas}
      </main>
    </>;
  }

  return <>
    <Header />
    <main className="mt-4 mb-12 flex flex-col gap-4 px-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="scrapbook-title" className="text-sm font-semibold">Scrapbook title</label>
          <input
            id="scrapbook-title"
            value={doc.title}
            maxLength={MAX_TITLE}
            onChange={(e) => change((d) => ({ ...d, title: e.target.value }))}
            className={`${inputClasses} max-w-md text-lg font-bold`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user && (
            <label className="mr-2 flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={isPublic} onChange={(e) => { setIsPublic(e.target.checked); setDirty(true); }} className="h-4 w-4 accent-brand-dark" />
              Show on my profile
            </label>
          )}
          <Button variant="secondary" disabled={busy !== null || doc.items.length === 0} onClick={() => requireAccount("download")}>
            {busy === "download" ? "Preparing…" : "Download PNG"}
          </Button>
          <Button disabled={busy !== null || (!dirty && !!id)} onClick={() => requireAccount("save")}>
            {busy === "save" ? "Saving…" : id && !dirty ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {!user && enabled && (
        <p className="rounded-lg bg-white px-4 py-2 text-sm text-stone-700">
          You're making this as a guest. It's kept on this device; create a free account when you're ready to save or download it.
        </p>
      )}
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm font-semibold ${message.kind === "error" ? "text-red-700" : "text-green-800"}`}>
          {message.text}
        </p>
      )}

      <div className="rounded-2xl border border-stone-300 bg-white p-4">
        <div role="group" aria-label="Add to page" className="flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tool === t.id}
              onClick={() => setTool(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                tool === t.id ? "border-brand-dark bg-brand-dark text-white" : "border-stone-300 bg-white text-stone-900 hover:bg-stone-100"
              }`}
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {tool === "stickers" && <StickerPicker onPick={(emoji) => addAndSelect((d) => addSticker(d, emoji))} />}
          {tool === "text" && <TextTool onAdd={() => { addAndSelect((d) => addText(d)); setTimeout(() => textRef.current?.select(), 0); }} />}
          {tool === "photos" && <PhotoPicker onPick={(src, caption) => addAndSelect((d) => addPhoto(d, src, caption))} />}
          {tool === "background" && <BackgroundPicker value={doc.background} onPick={(color) => change((d) => ({ ...d, background: color }))} />}
        </div>
      </div>

      {canvas}
      {doc.items.length === 0 && (
        <p className="-mt-2 text-center text-sm text-stone-600">Your page is empty. Add a sticker, some text or a photo to get started.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div>
          {selected ? (
            <SelectedPanel
              ref={textRef}
              item={selected}
              onChange={(changes: Partial<ScrapbookItem>) => change((d) => updateItem(d, selected.id, changes))}
              onMove={(direction) => change((d) => moveItem(d, selected.id, direction))}
              onDelete={() => { change((d) => removeItem(d, selected.id)); setSelectedId(null); }}
            />
          ) : (
            doc.items.length > 0 && <p className="text-sm text-stone-700">Select something on the page to edit it.</p>
          )}
        </div>
        <LayersList doc={doc} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </main>
  </>;
}
