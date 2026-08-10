import React from "react";
import { ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react";

export type FilterOption<T extends string> = {
  key: T;
  label: string;
  /** Omit to hide the number. */
  count?: number;
};

type FilterMenuProps<T extends string> = {
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
};

/**
 * One control, one pattern. A dropdown rather than a scrolling row of chips,
 * because a chip row hides its own options off the right edge of a phone.
 */
export function FilterMenu<T extends string>({
  value,
  options,
  onChange,
}: FilterMenuProps<T>) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const current = options.find((option) => option.key === value);

  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4EE] bg-white px-3.5 py-2.5 text-[16px] font-medium text-[#526176] transition-colors hover:bg-[#F8FAFC]"
        onClick={() => setOpen((state) => !state)}
        type="button"
      >
        <SlidersHorizontalIcon
          aria-hidden="true"
          size={16}
          strokeWidth={2.25}
        />
        {current?.label ?? value}
        {current?.count !== undefined ? ` (${current.count})` : ""}
        <ChevronDownIcon
          aria-hidden="true"
          className={
            open ? "rotate-180 transition-transform" : "transition-transform"
          }
          size={16}
          strokeWidth={2.25}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-[#DCE4EE] bg-white shadow-[0_12px_28px_rgba(30,58,138,0.16)]">
          {options.map((option) => (
            <button
              className={`flex w-full items-center justify-between border-b border-[#F1F5F9] px-4 py-3 text-left text-[16px] transition-colors last:border-b-0 hover:bg-[#F8FAFC] ${
                option.key === value
                  ? "font-semibold text-[#1E3A8A]"
                  : "font-normal text-[#526176]"
              }`}
              key={option.key}
              onClick={() => {
                onChange(option.key);
                setOpen(false);
              }}
              type="button"
            >
              {option.label}
              {option.count !== undefined && (
                <span className="text-[14px] font-normal text-[#8291A5]">
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
