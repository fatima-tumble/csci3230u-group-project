import Header from "../components/header"
import Tag from "../components/tags"
import { useParams } from "react-router-dom"
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
    kinds: string,
    lat: number,
    lon: number
}

function GalleryImage({ alt, src }: GalleryImageProps) {
    return <div className="border-[#494949] border-2 rounded-[10px] aspect-square min-h-50">
        <img src={src} className="h-full w-full object-cover" alt={alt ?? ""}></img>
    </div>
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


    if (loading) return <h1>Loading...</h1>
    if (!place) return <h1>Place not found</h1>

    return <>
        <Header />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-[95%] mx-auto">
            <section>
                <h1 className="text-2xl font-bold mt-4">{place?.name}</h1>
                <h4 className="text-sm font-extralight mb-2 text-gray-300">
                    {[
                        [place?.address.house_number, place?.address.road].filter(Boolean).join(" "),
                        place?.address.city, 
                        place?.address.state, 
                        place?.address.postcode
                    ].filter(Boolean).join(", ")}
                </h4>
                {/* <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>1.2 km away</span>
                    <span aria-hidden="true">•</span>
                    <span>Open until 6 PM</span>
                </div> */}
                <div className="mt-4">
                    <h1 className="font-bold text-1xl">Description</h1>
                    {place?.wikipedia_extracts?.html ? (
                        <h4 className="font-light text-gray-400" dangerouslySetInnerHTML={{ __html: place?.wikipedia_extracts.html }}></h4>
                    )
                    :
                    (
                        <h4 className="font-light text-gray-400">No description avaliable</h4>
                    )
                }
                </div>
                <h1 className="mt-4 text-1xl font-bold">Tags</h1>
                <div className="mt-4 flex flex-row flex-wrap rounded-[10px] gap-3">
                    {place?.kinds.split(',').map((kind, index) => <Tag key={index}>{kind.replaceAll(/_/g, " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</Tag>)}
                </div>
            </section>
            <section>
                <h1 className="text-1xl font-bold mt-4">Map</h1>
                <div className="mt-4 border-[#494949] border-2 flex flex-col rounded-[10px] min-h-5/6 p-4">
                    {place.point && Number.isFinite(place.point.lat) && Number.isFinite(place.point.lon) ? (
                        <PlaceMap
                            lat={place.point.lat}
                            lon={place.point.lon}
                            name={place.name}
                        />
                    ) : (
                        <p className="p-4 text-gray-400">
                            Map coordinates are unavailable.
                        </p>
                    )}
                </div>
                <h1 className="mt-4 text-1xl font-bold">Image</h1>
                <div className="flex flex-row rounded-[10px] flex-wrap gap-5 mb-4 mt-4">
                    <GalleryImage src={place?.preview.source.replaceAll(/\d+px/gmi, "250px")} />
                </div>
            </section>
        </div>
    </>
}
