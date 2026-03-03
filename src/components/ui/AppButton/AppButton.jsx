import { useState } from "react";
import { Link } from "react-router-dom";
import "./AppButton.css";

function AppButton({
  children,
  type = "button",
  variant = "primary",
  className = "",
  to,
  href,
  onHoverChange,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variantClass = variant === "secondary" ? "button-secondary" : "";
  const hoveredClass = isHovered ? "app-button-hovered" : "";
  const classes = ["app-button", variantClass, hoveredClass, className]
    .filter(Boolean)
    .join(" ");

  function handleMouseEnter(event) {
    setIsHovered(true);
    onHoverChange?.(true);
    onMouseEnter?.(event);
  }

  function handleMouseLeave(event) {
    setIsHovered(false);
    onHoverChange?.(false);
    onMouseLeave?.(event);
  }

  function handleFocus(event) {
    onHoverChange?.(true);
    onFocus?.(event);
  }

  function handleBlur(event) {
    onHoverChange?.(false);
    onBlur?.(event);
  }

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    >
      {children}
    </button>
  );
}

export default AppButton;
