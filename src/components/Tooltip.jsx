import { useId, useState } from "react";

function Tooltip({ text, label = "More info" }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <span className="tooltip-wrap" onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="tooltip-trigger"
        aria-label={label}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={`tooltip-panel ${open ? "tooltip-open" : ""}`}
      >
        {text}
      </span>
    </span>
  );
}

export default Tooltip;
