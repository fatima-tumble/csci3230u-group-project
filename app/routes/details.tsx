import Header from "../components/header"
import Tag from "../components/tags"
import { useParams } from "react-router-dom"
import { Link } from "react-router"
import { useState, useEffect } from "react"
import PlaceMap from "../components/map"


// Technically it should be hidden through server proxy
const API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY

type GalleryImageProps = {
    alt?: string,
    src?: string
}

interface Address {
    city: string
    road: string,
    house: string,
    state: string,
    country: string,
    postcode: string,
    country_code: string,
    house_number: string,
    city_district: string,
    neighbourhood: string,
    state_district: string
}

interface WikipediaInfo {
    title: string,
    text: string,
    html: string
}

interface Preview {
    source: string,
    height: number,
    width: number
}

interface PlaceData {
    xid: string,
    name: string,
    description: string,
    address: Address,
    wikipedia_extracts: WikipediaInfo,
    preview: Preview,
    image?: string,
    kinds: string,
    lat: number,
    lon: number
}

function PlaceImage({ alt, src }: GalleryImageProps) {
    return <img
        src={src?.replace(/\d+px/, "960px")}
        onError={(e) => { if (src && e.currentTarget.src !== src) e.currentTarget.src = src }}
        alt={alt ?? ""}
        className="w-full rounded-2xl bg-stone-200 object-cover lg:h-0 lg:flex-1"
    />
}

async function getApiDetails(placeName: String) {
    // Fetch data via opentstreetmap nominatim
    let placeLocation = await fetch(`https://nominatim.openstreetmap.org/search?q=${placeName}&format=jsonv2`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })

    let placeLocationData = (await placeLocation.json())[0]
    let placeLat = placeLocationData.lat
    let placeLon = placeLocationData.lon

    // Fetch data via opentripmap data
    let placeData = await fetch(`https://api.opentripmap.com/0.1/en/places/autosuggest?name=${placeName}&radius=10&lon=${placeLon}&lat=${placeLat}&apikey=${API_KEY}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })

    placeData = await placeData.json()
    console.log(placeData)
    return placeData
}

async function getPlaceData(xid: String) {
    let placeData = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${API_KEY}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })

    return await placeData.json()
}


export default function Details() {
    const { xid } = useParams()
    const [place, setPlace] = useState<PlaceData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            if (!xid) {
                console.log("No xid provided")
                setLoading(false);
                return
            }
            try {
                setLoading(true)
                let data = await getPlaceData(xid)
                console.log(data)
                setPlace(data)
                setLoading(false)
            }
            catch (err) {
                setLoading(false)
                console.error("Error fetching place data")
            }
        }
        loadData()
    }, [xid])


    const backLink = <Link to="/results" className="inline-block font-bold text-brand hover:underline">← Back to results</Link>

    if (loading || !place?.name) {
        return <>
            <Header />
            <main className="flex flex-col items-start gap-4 mt-8 px-6 w-full max-w-6xl mx-auto">
                <p role="status" className="text-xl font-bold">{loading ? "Loading..." : "Place not found"}</p>
                {!loading && backLink}
            </main>
        </>
    }

    const address = [
        [place.address?.house_number, place.address?.road].filter(Boolean).join(" "),
        place.address?.city,
        place.address?.state,
        place.address?.postcode
    ].filter(Boolean).join(", ")

    const tags = place.kinds.split(",").map(kind => kind.replaceAll(/_/g, " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))

    return <>
        <Header />
        <main className="mt-4 mb-12 px-6 w-full max-w-6xl mx-auto">
            {backLink}
            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <h1 className="text-3xl sm:text-4xl font-bold">{place.name}</h1>
                    {address && (
                        <p className="mt-2 text-stone-600"><span aria-hidden="true">📍 </span>{address}</p>
                    )}
                    <ul aria-label="Tags" className="mt-4 flex flex-row flex-wrap gap-2">
                        {tags.map((tag, index) => <li key={index}><Tag>{tag}</Tag></li>)}
                    </ul>
                    <section className="mt-8">
                        <h2 className="text-xl font-bold">About</h2>
                        {place.wikipedia_extracts?.html ? (
                            <div className="mt-2 space-y-3 leading-relaxed text-stone-700" dangerouslySetInnerHTML={{ __html: place.wikipedia_extracts.html }}></div>
                        ) : (
                            <p className="mt-2 text-stone-700">No description available.</p>
                        )}
                    </section>
                    <section className="mt-8">
                        <h2 className="text-xl font-bold">Map</h2>
                        <div className="mt-2 h-64 w-full overflow-hidden rounded-2xl border-2 border-stone-300 bg-white">
                            {place.point && Number.isFinite(place.point.lat) && Number.isFinite(place.point.lon) ? (
                                <PlaceMap
                                    lat={place.point.lat}
                                    lon={place.point.lon}
                                    name={place.name}
                                />
                            ) : (
                                <p className="flex h-full items-center justify-center text-sm text-stone-600">Map coordinates are unavailable.</p>
                            )}
                        </div>
                    </section>
                </div>
                {place.preview?.source && (
                    <figure className="flex h-full flex-col">
                        <PlaceImage src={place.preview.source} alt={`Photo of ${place.name}`} />
                        {place.image && (
                            <figcaption className="mt-2 text-sm text-stone-600">
                                Photo from <a href={place.image} target="_blank" rel="noreferrer" className="underline hover:text-brand">Wikimedia Commons</a>
                            </figcaption>
                        )}
                    </figure>
                )}
            </div>
        </main>
    </>
}
