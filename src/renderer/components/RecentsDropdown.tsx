import ResultItem from "./ResultItem";
import type { Entry } from "@shared/types";

interface Props {
  entries: Entry[];
  focusedEntryId: string | null;
  favorites: Set<string>;
  onOpen: (entry: Entry) => void;
  onEdit: (entry: Entry) => void;
  onCopy: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function RecentsDropdown({
  entries,
  focusedEntryId,
  favorites,
  onOpen,
  onEdit,
  onCopy,
  onToggleFavorite,
  onMouseDown,
}: Props) {
  return (
    <div className="recents-dropdown" onMouseDown={onMouseDown}>
      <div className="recents-dropdown-header">Recent</div>
      <ul className="result-list">
        {entries.map((entry) => (
          <ResultItem
            key={entry.id}
            result={{ entry, matches: [] }}
            onEdit={onEdit}
            onCopy={onCopy}
            onOpen={onOpen}
            isFocused={focusedEntryId === entry.id}
            isFavorite={favorites.has(entry.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ul>
    </div>
  );
}
