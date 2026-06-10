import type { Entry, Vertical } from "@shared/types";
import ResultItem from "./ResultItem";

interface Props {
  entries: Entry[];
  favorites: Set<string>;
  verticals: Vertical[];
  onBack: () => void;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onOpen: (entry: Entry) => void;
  onToggleFavorite: (id: string) => void;
}

export default function FavoritesView({ entries, favorites, verticals, onBack, onEdit, onCopy, onOpen, onToggleFavorite }: Props) {
  const favEntries = entries.filter((e) => favorites.has(e.id));
  const verticalMap = new Map(verticals.map((v) => [v.id, v.label]));

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
          <ul className="fav-list">
            {favEntries.map((entry) => (
              <li key={entry.id} className="fav-card">
                <span className="fav-card-vertical">{verticalMap.get(entry.vertical) ?? entry.vertical}</span>
                <ResultItem
                  result={{ entry, matches: [] }}
                  onEdit={onEdit}
                  onCopy={onCopy}
                  onOpen={onOpen}
                  isFavorite={favorites.has(entry.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
