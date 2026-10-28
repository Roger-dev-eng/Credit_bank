import { Search, X } from "lucide-react";
import { Input } from "../atoms/Input";
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="search-field">
      <Search size={17} aria-hidden="true" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder || label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          aria-label={"Limpar " + label.toLocaleLowerCase("pt-BR")}
          onClick={() => onChange("")}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
