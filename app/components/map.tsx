import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
} from 'https://cdn.esm.sh/react-leaflet'

interface placeMapCoords {
    lat: number;
    lon: number;
    name: string;
}

export default function PlaceMap({ lat, lon, name }: placeMapCoords) {
    return (
        <MapContainer center={[lat, lon]} zoom={13} scrollWheelZoom={false} style={{ height: "150px", width: "100%", }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lon]}>
                <Popup>
                    {name}
                </Popup>
            </Marker>
        </MapContainer>
    )
}
