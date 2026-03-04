import { useEffect } from "react";
import AppButton from "../AppButton/AppButton";
import "./AppModal.css";

function AppModal({
  isOpen,
  onClose,
  title,
  titleId,
  children,
  footer,
  closeOnBackdrop = true,
  panelClassName = "",
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleBackdropClick() {
    if (!closeOnBackdrop) {
      return;
    }

    onClose();
  }

  function stopPropagation(event) {
    event.stopPropagation();
  }

  return (
    <div className="app-modal-root" onClick={handleBackdropClick}>
      <div
        className={["app-modal-panel", panelClassName]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={stopPropagation}
      >
        <div className="app-modal-header">
          <h3 id={titleId}>{title}</h3>
          <AppButton
            type="button"
            variant="secondary"
            className="app-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            Close
          </AppButton>
        </div>
        <div className="app-modal-body">{children}</div>
        {footer ? <div className="app-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export default AppModal;
