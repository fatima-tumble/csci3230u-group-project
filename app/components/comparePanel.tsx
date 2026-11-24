import type { MockPlace } from "../data/places";

type comparePanelProps = {
    selectedPlaces : MockPlace[];          // so panel receives actual place data like names, etc.
    onRemove: (placeId: string) => void;
    onToggle: () => void;
}

export default function ComparePanel ({ selectedPlaces, onRemove, onToggle, } : comparePanelProps) {
    return (
        <aside id="compare-panel" aria-labelledby="compare-panel-title"
               className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] overflow-y-auto rounded-xl border border-stone-300 bg-bone p-5 shadow-xl
                          lg:sticky lg:top-4 lg:inset-y-auto lg:right-auto lg:z-auto lg:h-fit lg:max-h-[calc(100vh-2rem)] lg:w-80 lg:max-w-none">
            <div className="mb-4 flex items-center justify-between">
                <h2 id="compare-panel-title" className="text-xl font-bold">
                    Compare Places
                </h2>

                <span className="text-sm text-stone-600"> {selectedPlaces.length} / 3 </span>
            </div>

            <button type="button" onClick={onToggle}
                    className="mt-3 rounded-md px-2 py-1 text-sm font-semibold text-brand hover:bg-brand/10
                               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            > Close
            </button>

            <div id="compare-panel-content">
                {selectedPlaces.length === 0 ? (
                    <p className="text-sm text-stone-600">
                        No places selected yet.
                        Please use the "Add to compare" buttons to begin.
                    </p>) : (
                        <ul className="flex flex-col gap-3">
                            {selectedPlaces.map((place) => (
                                <li key={place.xid}>
                                    <article className="rounded-lg border border-stone-300 p-3 bg-white">
                                        <h3 className="font-semibold"> {place.name} </h3>

                                        <p className="mt-1 text-sm text-stone-600"> {place.categories.join(", ")} </p>
                                        <p className="mt-1 text-sm text-stone-600"> {place.distanceKm} km away </p>

                                        <button type="button"
                                                onClick={() => onRemove(place.xid)} aria-label={`Remove ${place.name} from comparison`}
                                                className="mt-3 rounded-md px-2 py-1 text-sm font-semibold text-brand border border-brand/50 hover:bg-brand/10
                                                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                                        > Remove
                                        </button>
                                    </article>
                                </li>
                            ))}
                        </ul>
                )}

                {selectedPlaces.length === 1 && (
                    <p className="mt-1 text-sm text-stone-600">Please select at least one more place for comparison.</p>
                )}
            </div>
        </aside>
    );
}
