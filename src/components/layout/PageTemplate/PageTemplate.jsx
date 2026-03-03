import { useEffect, useState } from "react";
import TopBar from "../TopBar/TopBar";
import SidebarNav from "../SidebarNav/SidebarNav";
import AppButton from "../../ui/AppButton/AppButton";
import AgentPetHost from "../../integrations/AgentPetHost";
import "./PageTemplate.css";

const SIDEBAR_VISIBLE_KEY = "azdes.sidebarVisible";

function getSidebarVisible() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(SIDEBAR_VISIBLE_KEY) === "true";
}

function PageTemplate({
  searchQuery,
  onSearchQueryChange,
  isTooltipLegendDismissed,
  onShowTips,
  onDismissTips,
  navItems,
  sidebarSections,
  children,
}) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(getSidebarVisible);

  const handleCloseSidebar = () => {
    setIsSidebarVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_VISIBLE_KEY, "false");
    }
  };

  useEffect(() => {
    if (!isSidebarVisible) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      handleCloseSidebar();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSidebarVisible]);

  const handleToggleSidebar = () => {
    setIsSidebarVisible((current) => {
      const next = !current;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_VISIBLE_KEY, String(next));
      }

      return next;
    });
  };

  return (
    <main className="page stack">
      <TopBar
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        isTooltipLegendDismissed={isTooltipLegendDismissed}
        onShowTips={onShowTips}
        onDismissTips={onDismissTips}
        isSidebarVisible={isSidebarVisible}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="app-shell">
        <section className="app-content stack">{children}</section>
      </div>

      <AgentPetHost />

      <div
        className={`sidebar-overlay ${isSidebarVisible ? "sidebar-overlay-open" : ""}`}
        aria-hidden={!isSidebarVisible}
      >
        <AppButton
          type="button"
          className="sidebar-overlay-backdrop"
          onClick={handleCloseSidebar}
          aria-label="Close tools sidebar"
        />
        <SidebarNav
          navItems={navItems}
          sections={sidebarSections}
          id="tool-sidebar"
          onNavigate={handleCloseSidebar}
        />
      </div>
    </main>
  );
}

export default PageTemplate;
