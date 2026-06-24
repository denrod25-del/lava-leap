"use client";

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3;
}

export default function OptionPills({
  options,
  value,
  onChange,
  columns = 2,
}: Props) {
  return (
    <div
      className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`pill ${active ? "pill-active" : ""}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
