import { useState } from "react";
import AppButton from "../AppButton/AppButton";
import { copyText } from "../../../utils/copyText";
import { addInteractionMemory } from "../../../utils/interactionMemory";

/**
 * CopyButton — themed copy-to-clipboard button with built-in status feedback.
 *
 * Props:
 *   getSummary — () => string  called on click to get the text to copy
 *   memoryKey  — string        optional; if provided, interaction is logged
 *   children   — ReactNode     button label (default: "Copy summary")
 *   disabled   — bool          forwarded to AppButton
 */
function CopyButton({
  getSummary,
  memoryKey,
  children = "Copy summary",
  disabled,
}) {
  const [status, setStatus] = useState("");

  async function handleClick() {
    const summary = typeof getSummary === "function" ? getSummary() : "";
    if (!summary) {
      return;
    }

    const copied = await copyText(summary);

    if (copied && memoryKey) {
      addInteractionMemory(memoryKey, summary);
    }

    setStatus(copied ? "Copied." : "Copy unavailable.");
  }

  return (
    <>
      <AppButton
        type="button"
        variant="secondary"
        onClick={handleClick}
        disabled={disabled}
      >
        {children}
      </AppButton>
      {status ? <span className="muted">{status}</span> : null}
    </>
  );
}

export default CopyButton;
