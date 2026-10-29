# Project Milestone 0

## Team Name
Team Wander

## Topic and Candidate API 
We plan to build an application focusing on food spots such as restaurants, cafes, and fast food chains.

For this purpose, we are considering the OpenTripMap API which hosts a collection of food-related categories for various locations.  

## Members and Roles
- Fatima Nawaz, Project Lead - layout, responsive shell, repo and board upkeep
- Vincent Wong, UI Developer - search and interactions, overall polish
- Julian Cruzet, Discovery Developer - categories, tags, browsing history
- Brian Chan, Content Developer - detail page, distance and hours, directions
- Matthew Wong, Integration Developer - OpenTripMap wiring, map components, secondary API

## Development

Copy `.env.example` to `.env` and fill in a free [OpenTripMap API key](https://opentripmap.io/product). The home and results pages work without it; the detail page needs it to load place info.

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:5173`.
