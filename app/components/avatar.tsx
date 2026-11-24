import { initialsFor } from "../data/profile";

type avatarProps = {
  name: string
  url?: string | null
  size?: "sm" | "md" | "lg" | "xl"
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

// Decorative: the person's name is always shown as text next to it
export default function Avatar({ name, url, size = "md" }: avatarProps) {
  const classes = `${sizes[size]} shrink-0 overflow-hidden rounded-full bg-accent font-bold text-stone-900`;
  if (url) return <img src={url} alt="" className={`${classes} object-cover`} />;
  return (
    <span aria-hidden="true" className={`${classes} inline-flex items-center justify-center`}>
      {initialsFor(name)}
    </span>
  );
}
