import "./ResourceSearchBar.css";

function ResourceSearchBar({
  id,
  label,
  value,
  onChange,
  placeholder,
  matchCount,
  showMatchCount,
}) {
  const hasQuery = String(value || "").trim().length > 0;

  return (
    <div className="resource-search-bar compact-grid">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {showMatchCount && hasQuery ? (
        <p className="muted">Matches: {matchCount}</p>
      ) : null}
    </div>
  );
}

export default ResourceSearchBar;
