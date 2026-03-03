import { useMemo, useState } from "react";
import "./SidebarNav.css";
import SidebarMenuItem from "../SidebarMenuItem/SidebarMenuItem";
import AppButton from "../../ui/AppButton/AppButton";

function SidebarGroupSection({ section, isOpen, onToggle, onNavigate }) {
  return (
    <section className="sidebar-group" aria-label={section.title}>
      <AppButton
        type="button"
        className="sidebar-group-toggle"
        onClick={() => onToggle(section.key)}
        aria-expanded={isOpen}
        aria-controls={`sidebar-group-${section.key}`}
      >
        <span className="sidebar-group-label">{section.title}</span>
        <span className="pill">{section.items.length}</span>
      </AppButton>

      <div
        id={`sidebar-group-${section.key}`}
        className={`sidebar-links-collapse ${isOpen ? "sidebar-links-open" : ""}`}
      >
        <ul className="sidebar-links" role="list">
          {section.items.map((item) => (
            <SidebarMenuItem
              key={item.to}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function SidebarNav({
  id,
  navItems,
  sections = [],
  title = "Tools",
  subtitle = "Grouped by audience",
  onNavigate,
}) {
  const homeItem = useMemo(() => {
    return navItems.find((item) => item.to === "/") || null;
  }, [navItems]);

  const groupedSections = useMemo(() => {
    return sections
      .map((section) => ({
        ...section,
        items: navItems.filter((item) => item.audience === section.audience),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, navItems]);

  const [openGroups, setOpenGroups] = useState(() => {
    return groupedSections.reduce((accumulator, section) => {
      accumulator[section.key] = true;
      return accumulator;
    }, {});
  });

  function toggleGroup(groupKey) {
    setOpenGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  }

  return (
    <aside id={id} className="sidebar-nav" aria-label="Tool navigation sidebar">
      <div className="sidebar-nav-header">
        <div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
      </div>

      {homeItem ? (
        <ul className="sidebar-home-list" role="list">
          <SidebarMenuItem item={homeItem} onNavigate={onNavigate} />
        </ul>
      ) : null}

      <div className="sidebar-nav-groups">
        {groupedSections.map((section) => (
          <SidebarGroupSection
            key={section.key}
            section={section}
            isOpen={openGroups[section.key] ?? true}
            onToggle={toggleGroup}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </aside>
  );
}

export default SidebarNav;
