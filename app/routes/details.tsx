import Header from "../components/header"
import Tag from "../components/tags"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"


// Technically it should be hidden through server proxy
const API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY

type GalleryImageProps = {
    alt?: string,
    src?: string
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
    let placeData = await fetch(`https://api.opentripmap.com/0.1/en/places/autosuggest?name=${placeName}&radius=100000&lon=${placeLon}&lat=${placeLat}&apikey=${API_KEY}`, {
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
    const [place, setPlace] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            if (!xid) return
            setLoading(true)
            let data = await getPlaceData(xid)
            setPlace(data)
            setLoading(false)
        }
    }, [xid])


    if (loading) return <h1>Loading...</h1>
    if (!place) return <h1>Place not found</h1>

    return <>
        <Header />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-[95%] mx-auto">
            <section>
                <h1 className="text-2xl font-bold mt-4">Place Name</h1>
                <h4 className="text-sm font-extralight mb-2 text-gray-300">Address</h4>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>1.2 km away</span>
                    <span aria-hidden="true">•</span>
                    <span>Open until 6 PM</span>
                </div>
                <div className="mt-4">
                    <h1 className="font-bold text-1xl">Description</h1>
                    <h4 className="font-light text-gray-400">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent at dolor nec nibh ultricies elementum et a risus. Maecenas fringilla non felis luctus volutpat</h4>
                </div>
                <h1 className="mt-4 text-1xl font-bold">Tags</h1>
                <div className="mt-4 flex flex-row flex-wrap rounded-[10px] gap-3">
                    <Tag>Test</Tag>
                    <Tag>Test</Tag>
                    <Tag>Test</Tag>
                </div>
            </section>
            <section>
                <h1 className="text-1xl font-bold mt-4">Map</h1>
                <div className="mt-4 border-[#494949] border-2 flex flex-col rounded-[10px] min-h-5/6 p-4">

                </div>
                <h1 className="mt-4 text-1xl font-bold">Gallery</h1>
                <div className="flex flex-row rounded-[10px] flex-wrap gap-5 mb-4 mt-4">
                    <GalleryImage />
                    <GalleryImage />
                    <GalleryImage />
                    <GalleryImage />
                </div>
            </section>
        </div>
    </>
}
