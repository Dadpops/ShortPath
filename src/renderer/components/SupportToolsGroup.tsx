import type { Entry, VerticalGroup } from "@shared/types";

interface Props {
  group: VerticalGroup;
  onToggle: () => void;
  onEdit: (entry: Entry) => void;
  onCopy: (entryId: string) => void;
  onReorder: (entryId: string, direction: "up" | "down") => void;
  isSearching: boolean;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  pinned?: Set<string>;
  onTogglePin?: (id: string) => void;
}

export default function SupportToolsGroup({ group, onToggle, onEdit, onCopy, onReorder, isSearching, favorites, onToggleFavorite, pinned, onTogglePin }: Props) {
  function launch(entry: Entry) {
    if (entry.link) {
      window.shortpath.openExternal(entry.link);
      window.shortpath.recordAccess(entry.id);
      onCopy(entry.id);
    }
  }

  return (
    <div className="vertical-group support-tools-group">
      <button className="group-header" onClick={onToggle}>
        <span className={`group-chevron${group.expanded ? " expanded" : ""}`}>›</span>
        <span className="group-label">{group.label}</span>
        <span className="group-count">{group.hitCount}</span>
      </button>

      {group.expanded && (
        <div className="support-tools-grid">
          {group.results.map((result, idx) => {
            const { entry } = result;
            const isFirst = idx === 0;
            const isLast = idx === group.results.length - 1;
            const isFav = favorites?.has(entry.id) ?? false;
            const isPinned = pinned?.has(entry.id) ?? false;
            return (
              <div key={entry.id} className="tool-card" onClick={() => launch(entry)}>
                <div className="tool-card-body">
                  <div className="tool-card-title-row">
                    <span className="tool-card-title">{entry.title}</span>
                  </div>
                  {entry.link && (
                    <span className="tool-card-url">{entry.link.replace(/^https?:\/\//, "")}</span>
                  )}
                </div>
                <div className="tool-card-actions" onClick={(e) => e.stopPropagation()}>
                  {onTogglePin && (
                    <button
                      className={`tool-action-btn pin-btn${isPinned ? " pinned" : ""}`}
                      onClick={() => onTogglePin(entry.id)}
                      title={isPinned ? "Unpin" : "Pin to top"}
                    >
                      {isPinned ? "📌" : "📍"}
                    </button>
                  )}
                  {onToggleFavorite && (
                    <button
                      className={`tool-action-btn star-btn${isFav ? " starred" : ""}`}
                      onClick={() => onToggleFavorite(entry.id)}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  )}
                  {!isSearching && (
                    <>
                      <button
                        className="tool-action-btn"
                        onClick={() => onReorder(entry.id, "up")}
                        disabled={isFirst}
                        title="Move up"
                      >↑</button>
                      <button
                        className="tool-action-btn"
                        onClick={() => onReorder(entry.id, "down")}
                        disabled={isLast}
                        title="Move down"
                      >↓</button>
                    </>
                  )}
                  <button
                    className="tool-action-btn"
                    onClick={() => onEdit(entry)}
                    title="Edit"
                  >✎</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
