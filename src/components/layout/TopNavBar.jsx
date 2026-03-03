import { NavLink } from "react-router-dom";
import AudienceBadge from "../ui/AudienceBadge";

function TopNavBar({ navItems }) {
  return (
    <nav className="top-nav-shell" aria-label="Primary navigation">
      <div className="top-nav-row">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `nav-link top-nav-link ${isActive ? "nav-link-active" : ""}`
            }
          >
            <span className="nav-link-label">{item.label}</span>
            <AudienceBadge audience={item.audience} />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default TopNavBar;
