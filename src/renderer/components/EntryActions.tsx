import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Entry } from "@shared/types";
import { copyEntry } from "@renderer/utils/htmlToPlain";

interface Props {
  entry: Entry;
  isNarrow: boolean;
  isFavorite?: boolean;
  onCopyComplete?: () => void;
  onOpenLink?: () => void;
  onToggleFavorite?: () => void;
  onEdit: () => void;
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="19" cy="12" r="2"/>
    </svg>
  );
}

export default function EntryActions({ entry, isNarrow, isFavorite, onCopyComplete, onOpenLink, onToggleFavorite, onEdit }: Props) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFocusIdx, setMenuFocusIdx] = useState(0);
  // Track density compact mode to force collapse
  const [densityCompact, setDensityCompact] = useState(document.body.dataset.density === "compact");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const shouldCollapse = isNarrow || densityCompact;

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDensityCompact(document.body.dataset.density === "compact");
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-density"] });
    return () => observer.disconnect();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  // Focus the active menu item whenever focus index changes
  useEffect(() => {
    if (!menuOpen) return;
    const items = menuRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]");
    items?.[menuFocusIdx]?.focus();
  }, [menuFocusIdx, menuOpen]);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onCopyComplete) return;
    void copyEntry(entry).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onCopyComplete();
    });
  }

  function handleOpenLink(e: React.MouseEvent) {
    e.stopPropagation();
    onOpenLink?.();
  }

  function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    onToggleFavorite?.();
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit();
  }

  function handleOverflowTrigger(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen((o) => !o);
    setMenuFocusIdx(0);
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const items = menuRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]");
    if (!items) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMenuFocusIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMenuFocusIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMenuOpen(false);
      triggerRef.current?.focus();
    }
  }

  function getMenuPosition() {
    if (!triggerRef.current) return { top: 0, right: 0 };
    const rect = triggerRef.current.getBoundingClientRect();
    return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
  }

  const menuItems = [
    ...(onToggleFavorite ? [{
      label: isFavorite ? "Unfavorite" : "Favorite",
      icon: <StarIcon filled={!!isFavorite} />,
      onClick: handleToggleFavorite,
    }] : []),
    {
      label: "Edit entry",
      icon: <EditIcon />,
      onClick: handleEdit,
    },
  ];

  return (
    <>
      {/* Primary: Copy (only when entry has body content to copy) */}
      {onCopyComplete && (
        <button
          className={`ea-primary${copied ? " ea-copied" : ""}`}
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          title={copied ? "Copied" : "Copy"}
        >
          {copied ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <CopyIcon />
          )}
        </button>
      )}

      {/* Primary: Open Link (only when entry has a link) */}
      {onOpenLink && (
        <button
          className="ea-primary"
          onClick={handleOpenLink}
          aria-label="Open link in browser"
          title="Open link"
        >
          <ExternalLinkIcon />
        </button>
      )}

      {/* Secondary buttons — full or collapsed */}
      {!shouldCollapse ? (
        <>
          {onToggleFavorite && (
            <button
              className={`ea-secondary${isFavorite ? " ea-active" : ""}`}
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              title={isFavorite ? "Unfavorite" : "Favorite"}
            >
              <StarIcon filled={!!isFavorite} />
            </button>
          )}
          <button
            className="ea-secondary"
            onClick={handleEdit}
            aria-label="Edit entry"
            title="Edit"
          >
            <EditIcon />
          </button>
        </>
      ) : (
        <>
          <button
            ref={triggerRef}
            className={`ea-overflow-trigger${menuOpen ? " ea-active" : ""}`}
            onClick={handleOverflowTrigger}
            aria-label="More actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            title="More"
          >
            <DotsIcon />
          </button>
          {menuOpen && createPortal(
            <div
              ref={menuRef}
              className="ea-overflow-menu"
              role="menu"
              style={(() => { const p = getMenuPosition(); return { top: p.top, right: p.right }; })()}
              onKeyDown={handleMenuKeyDown}
            >
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  className="ea-overflow-item"
                  role="menuitem"
                  data-menu-item=""
                  onClick={item.onClick}
                >
                  <span className="ea-overflow-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>,
            document.body
          )}
        </>
      )}
    </>
  );
}
