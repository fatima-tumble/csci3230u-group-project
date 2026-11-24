type buttonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost"
}

const variants = {
  primary: "bg-brand-dark text-white hover:bg-brand-dark/90 border-brand-dark",
  secondary: "bg-white text-stone-900 border-stone-300 hover:bg-stone-100",
  danger: "bg-red-700 text-white border-red-700 hover:bg-red-800",
  ghost: "bg-transparent text-stone-800 border-transparent hover:bg-stone-900/5",
};

export default function Button({ variant = "primary", className = "", type = "button", ...props }: buttonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
