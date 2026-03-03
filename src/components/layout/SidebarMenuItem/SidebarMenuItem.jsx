import { NavLink } from "react-router-dom";
import AudienceBadge from "../../ui/AudienceBadge";
import "./SidebarMenuItem.css";

function SidebarMenuItem({ item, onNavigate }) {
  const itemLabel = item?.label || item?.title || item?.to || "Untitled";

  return (
    <li className="sidebar-link-item">
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
        }
        onClick={() => onNavigate?.()}
      >
        <span>{itemLabel}</span>
        <AudienceBadge audience={item.audience} />
      </NavLink>
    </li>
  );
}

export default SidebarMenuItem;
