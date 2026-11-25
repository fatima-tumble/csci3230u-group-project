import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/auth";
import Button from "./button";
import FormField from "./formField";
import RatingInput from "./ratingInput";
import Avatar from "./avatar";
import { inputClasses } from "./formField";
import { profileName } from "../data/profile";
import { MAX_BLURB, MAX_PHOTOS, todayISO, validateVisit, type PublicProfile, type Visibility } from "../data/social";
import { createVisit, fetchFollowing } from "../data/socialApi";

export type VisitPlace = { xid: string; name: string; image?: string | null }

type visitDialogProps = {
  place: VisitPlace
  open: boolean
  onClose: () => void
  onPosted?: () => void
}

type Person = PublicProfile & { id: string }

// "I've been here" form: rating, date, blurb, photos, who you went with, and who can see it
export default function VisitDialog({ place, open, onClose, onPosted }: visitDialogProps) {
  const { user, profile } = useAuth();
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [visitedOn, setVisitedOn] = useState(todayISO());
  const [blurb, setBlurb] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("followers");
  const [companionIds, setCompanionIds] = useState<string[]>([]);
  const [following, setFollowing] = useState<Person[]>([]);
  const [peopleFilter, setPeopleFilter] = useState("");
  const [errors, setErrors] = useState<ReturnType<typeof validateVisit>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPrivate = !!profile?.is_private;
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Reset the form and load the people you can tag each time it opens
  useEffect(() => {
    if (!open) return;
    setRating(null);
    setVisitedOn(todayISO());
    setBlurb("");
    setPhotos([]);
    setVisibility("followers");
    setCompanionIds([]);
    setPeopleFilter("");
    setErrors({});
    setFormError(null);
    if (user) fetchFollowing(user.id).then(setFollowing).catch(() => setFollowing([]));
  }, [open, user?.id]);

  const filteredPeople = following.filter((p) => {
    const q = peopleFilter.trim().toLowerCase();
    return !q || p.username.includes(q) || (p.display_name ?? "").toLowerCase().includes(q);
  });

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)].slice(0, MAX_PHOTOS));
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleCompanion(id: string) {
    setCompanionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const next = validateVisit({ rating, visitedOn, blurb, photos });
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await createVisit(user.id, {
        xid: place.xid,
        placeName: place.name,
        placeImage: place.image,
        rating: rating!,
        visitedOn,
        blurb,
        visibility: isPrivate ? "followers" : visibility,
        photos,
        companionIds,
      });
      onPosted?.();
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="visit-dialog-title"
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-bone p-0 text-stone-900 shadow-xl backdrop:bg-stone-900/50"
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="visit-dialog-title" className="text-2xl font-bold">Log your visit to {place.name}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-xl leading-none hover:bg-stone-900/5 focus-visible:outline-2 focus-visible:outline-brand">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <RatingInput value={rating} onChange={setRating} error={errors.rating} />

        <div className="flex flex-col gap-1">
          <label htmlFor="visit-date" className="text-sm font-semibold">Date visited</label>
          <input
            id="visit-date"
            type="date"
            value={visitedOn}
            max={todayISO()}
            onChange={(e) => setVisitedOn(e.target.value)}
            aria-invalid={errors.visitedOn ? true : undefined}
            aria-describedby={errors.visitedOn ? "visit-date-error" : undefined}
            className={inputClasses}
          />
          {errors.visitedOn && <p id="visit-date-error" className="text-xs font-semibold text-red-700">{errors.visitedOn}</p>}
        </div>

        <FormField
          label="What was it like?"
          value={blurb}
          onChange={setBlurb}
          multiline
          maxLength={MAX_BLURB}
          hint={`${blurb.length}/${MAX_BLURB}`}
          error={errors.blurb}
        />

        <div className="flex flex-col gap-2">
          <span id="visit-photos-label" className="text-sm font-semibold">Photos <span className="font-normal text-stone-600">(up to {MAX_PHOTOS})</span></span>
          {photos.length > 0 && (
            <ul aria-labelledby="visit-photos-label" className="grid grid-cols-4 gap-2">
              {photos.map((file, i) => (
                <li key={previews[i]} className="relative">
                  <img src={previews[i]} alt={`Selected photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute right-1 top-1 rounded-full bg-stone-900/80 px-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" aria-labelledby="visit-photos-label" onChange={(e) => addPhotos(e.target.files)} />
          {photos.length < MAX_PHOTOS && (
            <Button variant="secondary" className="self-start" onClick={() => fileRef.current?.click()}>+ Add photos</Button>
          )}
          {errors.photos && <p className="text-xs font-semibold text-red-700">{errors.photos}</p>}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">Who did you go with? <span className="font-normal text-stone-600">(optional)</span></legend>
          {following.length === 0 ? (
            <p className="text-sm text-stone-600">Follow people to tag them in your visits.</p>
          ) : (
            <>
              {following.length > 6 && (
                <input
                  type="search"
                  value={peopleFilter}
                  onChange={(e) => setPeopleFilter(e.target.value)}
                  placeholder="Search people you follow"
                  aria-label="Search people you follow"
                  className={inputClasses}
                />
              )}
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                {filteredPeople.map((person) => (
                  <li key={person.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white">
                      <input type="checkbox" checked={companionIds.includes(person.id)} onChange={() => toggleCompanion(person.id)} className="h-4 w-4 accent-brand-dark" />
                      <Avatar name={profileName(person)} url={person.avatar_url} size="sm" />
                      <span className="text-sm"><span className="font-semibold">{profileName(person)}</span> <span className="text-stone-600">@{person.username}</span></span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">Who can see this?</legend>
          {isPrivate ? (
            <p className="text-sm text-stone-700">Your account is private, so only your approved followers will see it.</p>
          ) : (
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              {([["followers", "Followers"], ["public", "Everyone"]] as const).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="radio" name="visit-visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} className="h-4 w-4 accent-brand-dark" />
                  {label}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        {formError && <p role="alert" className="text-sm font-semibold text-red-700">{formError}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post"}</Button>
        </div>
      </form>
    </dialog>
  );
}
