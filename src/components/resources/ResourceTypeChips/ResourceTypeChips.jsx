import "./ResourceTypeChips.css";
import AppButton from "../../ui/AppButton/AppButton";

function ResourceTypeChips({ options, activeValue, onSelect, ariaLabel }) {
  return (
    <div
      className="resource-type-chips type-chip-row"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = activeValue === option.value;
        return (
          <AppButton
            key={option.value}
            type="button"
            className={`type-chip ${isActive ? "type-chip-active" : ""}`}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </AppButton>
        );
      })}
    </div>
  );
}

export default ResourceTypeChips;
