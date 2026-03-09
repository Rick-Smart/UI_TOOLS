import Tooltip from "../../Tooltip";

/**
 * AppSearchBar — reusable labeled text search input.
 *
 * Props:
 *   id          — input id (required, links label)
 *   label       — visible label text
 *   value       — controlled value
 *   onChange    — called with the new string value (not the event)
 *   placeholder — input placeholder
 *   tooltip     — optional Tooltip text shown inline after the label
 */
function AppSearchBar({ id, label, value, onChange, placeholder, tooltip }) {
  return (
    <div className="compact-grid">
      <label htmlFor={id}>
        {label}
        {tooltip ? <Tooltip text={tooltip} /> : null}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default AppSearchBar;
