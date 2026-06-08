import { useRef, useEffect } from "react";

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

  return (
    <div className="search-bar">
      <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        className="search-input"
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        spellCheck={false}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          tabIndex={-1}
        >
          ×
        </button>
      )}
    </div>
  );
}
