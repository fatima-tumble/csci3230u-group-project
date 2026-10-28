type searchBarProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
}

export default function SearchBar({ value, onChange, placeholder, label }: searchBarProps) {
  const inputId = "search-places-input";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="sr-only">
        {label ?? "Search places"}
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search places by name"}
        className="w-full text-sm font-bold bg-[#1E1D1D] border-[#494949] border-2 p-2 rounded-[10px]"
      />
    </div>
  );
}
