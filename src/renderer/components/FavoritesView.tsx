import type { Entry } from "@shared/types";
import ResultItem from "./ResultItem";

interface Props {
  entries: Entry[];
  favorites: Set<string>;
  onBack: () => void;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onOpen: (entry: Entry) => void;
  onToggleFavorite: (id: string) => void;
}

export default function FavoritesView({ entries, favorites, onBack, onEdit, onCopy, onOpen, onToggleFavorite }: Props) {
  const favEntries = entries.filter((e) => favorites.has(e.id));

  return (
    <div className="favorites-shell">
      <div className="form-header">
        <button className="form-back-btn" onClick={onBack}>
          ← Back
        </button>
        <span className="form-title">Favorites</span>
      </div>

      <main className="results-container">
        {favEntries.length === 0 ? (
          <div className="empty-state">
            <p>No favorites yet. Star an entry to save it here.</p>
          </div>
        ) : (
          <ul className="result-list">
            {favEntries.map((entry) => (
              <ResultItem
                key={entry.id}
                result={{ entry, matches: [] }}
                onEdit={onEdit}
                onCopy={onCopy}
                onOpen={onOpen}
                isFavorite={favorites.has(entry.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
