export const categories = ["Food", "Events", "Entertainment", "Activities"] as const;

export type Category = (typeof categories)[number];

export type CategoryFilter = Category | "All";
