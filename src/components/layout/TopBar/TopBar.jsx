import { useEffect, useMemo, useState } from "react";
import Tooltip from "../../Tooltip";
import AppButton from "../../ui/AppButton/AppButton";
import {
  choosePet,
  dismissPet,
  getPetCatalog,
  getPetStateForCurrentAgent,
  showPet,
  subscribePetState,
} from "../../../utils/petBridge";
import "./TopBar.css";

function TopBar({
  searchQuery,
  onSearchQueryChange,
  isTooltipLegendDismissed,
  onShowTips,
  onDismissTips,
  isSidebarVisible,
  onToggleSidebar,
}) {
  const [petState, setPetState] = useState(getPetStateForCurrentAgent);
  const petCatalog = useMemo(() => getPetCatalog(), []);

  useEffect(() => {
    return subscribePetState((nextState) => {
      setPetState(nextState);
    });
  }, []);

  const showPetControls = Boolean(petState?.profile?.unlocked);
  const isPetVisible = Boolean(petState?.profile?.enabled);
  const selectedPetId = petState?.profile?.selectedPetId || "";
  const toggleCompanionVisibility = () => {
    if (isPetVisible) {
      dismissPet();
      return;
    }

    showPet();
  };

  return (
    <header className="top-bar" aria-label="Application top bar">
      <div className="top-bar-left">
        <AppButton
          type="button"
          className="top-bar-menu"
          onClick={onToggleSidebar}
          aria-expanded={isSidebarVisible}
          aria-controls="tool-sidebar"
          aria-label={
            isSidebarVisible ? "Hide tools sidebar" : "Show tools sidebar"
          }
        >
          <span aria-hidden="true">☰</span>
          <span className="sr-only">
            {isSidebarVisible ? "Hide tools sidebar" : "Show tools sidebar"}
          </span>
        </AppButton>
        <div className="top-bar-brand-block">
          <p className="top-bar-brand">AZDES UI Knowledge Base</p>
          <p className="top-bar-subtitle">Agent workspace and quick tools</p>
        </div>
      </div>

      <div className="top-bar-search">
        <label className="top-bar-search-label" htmlFor="global-search">
          Smart search
        </label>
        <input
          id="global-search"
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search anything in the toolbox (tools, KB, terms, docs, links, guidance)"
        />
        <span className="top-bar-search-tooltip">
          <Tooltip text="Searches all toolbox data (tools, KB, call handling guidance, terms, documents, links, top actions, trends, and other src/data entries). Results are capped for speed." />
        </span>
      </div>

      <div className="top-bar-actions">
        {showPetControls ? (
          <div className="top-bar-pet-menu" aria-label="Companion controls">
            <span className="pill">Companion</span>
            {isPetVisible ? (
              <>
                <label className="sr-only" htmlFor="pet-selector">
                  Choose companion
                </label>
                <select
                  id="pet-selector"
                  className="top-bar-pet-select"
                  value={selectedPetId}
                  onChange={(event) => choosePet(event.target.value)}
                >
                  <option value="">Choose companion</option>
                  {petCatalog.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <AppButton
              type="button"
              className="button-secondary"
              onClick={toggleCompanionVisibility}
              aria-pressed={isPetVisible}
              aria-label={
                isPetVisible ? "Turn companion off" : "Turn companion on"
              }
            >
              Companion
            </AppButton>
          </div>
        ) : null}

        {isTooltipLegendDismissed ? (
          <AppButton
            type="button"
            className="tooltip-legend-restore"
            onClick={onShowTips}
          >
            Show tips
          </AppButton>
        ) : (
          <div
            className="tooltip-legend muted"
            role="note"
            aria-label="Tooltip help legend"
          >
            <span className="tooltip-badge" aria-hidden="true">
              ?
            </span>
            Use <strong>?</strong> for guidance. Press <strong>Esc</strong> to
            close tips.
            <AppButton
              type="button"
              className="tooltip-legend-close"
              onClick={onDismissTips}
              aria-label="Dismiss tooltip help legend"
            >
              Dismiss
            </AppButton>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
