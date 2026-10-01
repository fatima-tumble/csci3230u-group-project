# Project Proposal

The website will be an informational place-discovery site that collects and displays information from external APIs 

The site is designed for those who want to explore different locations by categories such as food, events, entertainment, and activities. Showcasing information about its name, category and description.

## Data Source

The primary data source will be OpenTripMap API. Additional APIs may be used to support features such as mapping, directions, and navigation to the locations.

Final APIs used will depend on their availability, licensing, restrictions, and rate limits.

## Comparators

The website may be similar to Google Maps or review sites like Yelp because it provides real-world information about locations. 
However, they differ in many ways:
- This site will focus specifically on location discovery and comparison rather than directions
- It will organize the locations into different categories and tags
- It will summarize information from various external sources into a single interface
- It will not primarily depend on user input, such as reviews and ratings
- It will provide descriptive information whenever possible
- It is mainly an information site rather than a mapping platform

## Scaled feature plan

We're splitting the work into three tiers so there's always a working site,
even if we run out of time for the fancier stuff.
                             
### Must have

Stuff the site needs to actually be useful:
- Search and results list (Vincent)
  - Search by city or postal code
  - Pull matching places from OpenTripMap and show them
  - Handle loading and "no results" states
- Category browsing (Julian)
  - Food, events, entertainment, and activities as the main categories
  - Clicking a category filters the results
- Location detail page (Brian)
  - Place name, category, and description
  - A static map image showing where it is
- Site shell and responsive layout (Fatima)
  - Header, search bar, nav
  - Mobile first, works on desktop too
- Map setup and API wiring (Matthew)
  - Base map component used across pages
  - Shared fetch helper for OpenTripMap (handles the API key, errors)

### Should have

What we're aiming to actually ship:
- Nearby search using the browser's location (All of Us)
- Accessibility pass: keyboard nav, alt text, colour contrast (Fatima)
- Tags on each place card, clickable to filter (Julian)
- Fuller detail page (Brian)
  - Distance from where the user is
  - "Open until" when the data has it
  - Image gallery
- Action buttons on the detail page (Vincent)
  - Open in Google Maps, share link, save to favourites (saved in the browser,
 no login)
- Interactive map on the detail page, with pan and zoom (Matthew)

### Nice to have

If we have time:
- Pulling extra info (photos, hours) from a second API (Matthew)
- Compare view, two or three places side by side (Fatima)
- Directions from the user to the place (Brian)
- Recently viewed and suggested categories, stored in the browser (Julian)
- Dark mode and polish pass (Vincent)

### Risks

- OpenTripMap might not have good data for every category, so we may trim the
category list to the ones that actually work.
- Any second API gets picked later, once we've checked its licensing and rate
limits. Features that depend on it stay optional.
- If the user blocks location access, nearby search falls back to the postal
code search.


## Wireframes

The initial wireframe shows two pages. The home page which contains:
- Header
  - Which will contain:
    - Search bar
    - Navigation buttons
- Location search section
  - Which contains:
    - Search by city or postal code
    - Use nearby location
- Category based tags

The location detail page which contains:
- Header
  - Which will contain:
    - Search bar
    - Navigation buttons
- Place Information
  - Which will contain:
    - Place name
    - Distance away (if available)
    - Open until
    - Description (if available)
- Tags
- Action Buttons
- Map
- Gallery
