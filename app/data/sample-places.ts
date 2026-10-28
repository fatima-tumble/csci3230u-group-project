// template for what each place should have
interface Place {
    id: string,
    category: string,
    name: string,
    tags: Array<string>,
    distance: number,  
    opening_hours: string
}

// list of sample places
const samplePlaces: Place[] = [
    {   
        id: "cn-tower",
        category: "Attractions", 
        name: "CN Tower",
        tags: ["Landmark", "Views"],
        distance: 1.2,
        opening_hours: "9AM - 9:30PM"
    },
    {   
        id: "st-lawrence-market",
        category: "Food", 
        name: "St. Lawrence Market",
        tags: ["Market", "Local"],
        distance: 1.8,
        opening_hours: "9AM - 7PM"
    },
    {   
        id: "royal-ontario-museum",
        category: "Attractions", 
        name: "Royal Ontario Museum",
        tags: ["Museum", "History"],
        distance: 3.4,
        opening_hours: "10AM - 5:30PM"
    },
    {   
        id: "scotiabank-arena",
        category: "Entertainment", 
        name: "Scotiabank Arena",
        tags: ["Sports", "Concerts"],
        distance: 1.0,
        opening_hours: "No Fixed Hours"
    },
    {   
        id: "kensington-market",
        category: "Food", 
        name: "Kensington Market",
        tags: ["Streetfood", "Shopping"],
        distance: 2.6,
        opening_hours: "9AM - 7PM"
    }

];

export default samplePlaces; 