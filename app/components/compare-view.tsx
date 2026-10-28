import samplePlaces from "~/data/sample-places";
import Tag from "./tags";

export default function CompareView() {
    return (
        <header>
            <h1>Compare Places</h1>
            <section className="compare-section">
                <ul className="place-list">
                    {samplePlaces.map((place) => ( 
                    <li key={place.id}>
                        <article className="place-card">
                            <h3>{place.name}</h3>
                            <p>{place.category}</p>
                            <p>{place.distance}</p>
                            <p>{place.opening_hours}</p>
                            
                            <ul className="place-tags">
                                {place.tags.map((tag) => (
                                    <Tag key={tag}>{tag}</Tag>
                                ))}
                            </ul>
                            
                        </article>
                    </li>))
                    }
                </ul>
            </section>
        </header>
    );
}