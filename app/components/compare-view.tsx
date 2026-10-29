import { mockPlaces } from "~/data/places";
import { useState } from "react";


export default function CompareView() {
    // selectedIds stores the ids, while setSelectedIds depend on what the user selects
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    function togglePlace(placeId:string) {
        setSelectedIds((currentIds) => {
            /* Checks whether a placeId is already selected or not.
               If it is, remove it.  
            */
            if (currentIds.includes(placeId)) {
                return currentIds.filter((id) => id !== placeId);
            }
            // If three places are already selected, keep currentIds unchanged.
            if (currentIds.length >= 3) {
                return currentIds; 
            }
            // Otherwise, return a new array with the added selected place ID.
            return [...currentIds, placeId];
        });
    }

    // Check places in mockPlaces, get its ID and check if it's been selected.
    const selectedPlaces = mockPlaces.filter((place) => selectedIds.includes(place.xid));
    

    return (
        <main className="px-4 mx-[1.75%]">
            <h1 className="mb-4 mt-4 text-2xl font-bold">Compare Places</h1>
            <section className="choose-places-section">
                <h2 className="mb-2 mt-2 text-xl font-bold">Choose places to compare</h2>
                <p className="mb-4 text-sm"> Select 2 or 3 places to compare.</p>

                <ul className="grid grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                    {mockPlaces.map((place) => ( 
                    <li key={place.xid} className="list-none">
                        <article className="rounded-[10px] border-2 border-[#494949] bg-[#1E1D1D] p-4 text-white">
                            <h3 className="mb-3 text-xl font-bold">{place.name}</h3>
            
                            <button 
                                type="button" 
                                onClick={() => togglePlace(place.xid)}
                                disabled={!selectedIds.includes(place.xid) && selectedIds.length >= 3}
                                className="mt-3 rounded-md border border-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] 
                                           disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {selectedIds.includes(place.xid) ? "Selected" : "Add"}
                            </button>

                        </article>
                    </li>))}
                </ul>
            </section>

            <section className="compare-places-section">
                <h2 className="mb-2 mt-4 text-xl font-bold">Comparison</h2>
                
                {selectedPlaces.length < 2 && (
                    <p className="mb-2 mt-2 text-sm">Please select at least 2 places.</p>
                )}
                {selectedPlaces.length >= 2 && (
                    <ul className="grid grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedPlaces.map((place) => (
                            <li key={place.xid} className="list-none">
                                <article className="rounded-[10px] border-2 border-[#494949] bg-[#1E1D1D] p-4 text-white">
                                    <h3 className="mb-3 text-xl font-bold">{place.name}</h3>
            
                                    <p className="mb-2 text-sm text-gray-300">{place.categories.join(", ")}</p>
                                    <p className="text-sm">{place.distanceKm} km away</p>

                                    <button
                                        type="button"
                                        onClick={() => togglePlace(place.xid)}
                                        className="mt-3 rounded-md border border-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-[#2a2a2a] 
                                                   disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </article>
                            </li>
                        ))}
                    </ul>
                )}

            </section>
        </main>
    );
}