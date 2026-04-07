import * as React from "react";
import clsx from "clsx";

import s from "./SearchInput.module.scss";
import { SearchIcon } from "../../assets/img/svg/SearchIcon";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  debounceMs?: number;
  onSearch?: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, debounceMs = 300, placeholder = "Search", ...props }, ref) => {
    const [value, setValue] = React.useState(props.defaultValue);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (onSearch) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onSearch(newValue);
        }, debounceMs);
      }
    };

    return (
      <div className={clsx(s.wrap, className)}>
        <SearchIcon />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          className={s.input}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
