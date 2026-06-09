import { useRef, useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  focusTrigger?: number;       // increment to imperatively focus the input
  onNavigateDown?: () => void; // ArrowDown pressed in search bar
  onNavigateUp?: () => void;   // ArrowUp pressed in search bar
  onEnter?: () => void;        // Enter pressed in search bar
  onEscape?: () => void;       // Escape pressed in search bar
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SearchBar({ value, onChange, focusTrigger, onNavigateDown, onNavigateUp, onEnter, onEscape, onFocus, onBlur }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (focusTrigger !== undefined && focusTrigger > 0) {
      inputRef.current?.focus();
    }
  }, [focusTrigger]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigateDown?.();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onNavigateUp?.();
    } else if (e.key === "Enter") {
      onEnter?.();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onEscape?.();
    }
  }

  function handleClear() {
    onChange("");
    inputRef.current?.blur();
  }

  const showClear = isFocused || !!value;

  return (
    <div className="search-bar">
      {showClear ? (
        <button
          className="search-icon-btn"
          onClick={handleClear}
          tabIndex={-1}
          aria-label="Clear search"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : (
        <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )}
      <input
        ref={inputRef}
        className="search-input"
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { setIsFocused(true); onFocus?.(); }}
        onBlur={() => { setIsFocused(false); onBlur?.(); }}
        spellCheck={false}
      />
    </div>
  );
}
