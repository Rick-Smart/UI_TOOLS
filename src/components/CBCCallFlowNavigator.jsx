import { useState } from "react";
import AppButton from "./ui/AppButton/AppButton";
import { cbcCallFlow } from "../data/cbc/cbcCallFlow";

const VARIANT_LABEL = {
  accenture: "Assign to Accenture",
  success: "Resolve & Finalize",
  info: "Next Step",
};

// Minimal outcome colors scoped only to the pill badge — no container overrides
const VARIANT_PILL_STYLE = {
  accenture: { background: "rgba(239,68,68,0.18)", color: "#f87171" },
  success: { background: "rgba(74,222,128,0.18)", color: "#4ade80" },
  info: { background: "rgba(96,165,250,0.18)", color: "#60a5fa" },
};

function CBCCallFlowNavigator() {
  const [currentId, setCurrentId] = useState("start");
  const [history, setHistory] = useState([]);

  const node = cbcCallFlow[currentId];
  const isStart = history.length === 0;

  function navigate(nextId, chosenLabel) {
    setHistory((prev) => [...prev, { fromId: currentId, chosenLabel }]);
    setCurrentId(nextId);
  }

  function goBack() {
    if (isStart) return;
    const prev = history[history.length - 1];
    setCurrentId(prev.fromId);
    setHistory((h) => h.slice(0, -1));
  }

  function restart() {
    setCurrentId("start");
    setHistory([]);
  }

  if (!node) return <p className="muted">Flow node not found.</p>;

  const pillStyle =
    node.type === "end"
      ? (VARIANT_PILL_STYLE[node.variant] ?? VARIANT_PILL_STYLE.info)
      : null;

  return (
    <div className="stack">
      {/* Breadcrumb trail */}
      {history.length > 0 && (
        <div className="type-chip-row">
          {history.map((crumb, i) => (
            <span key={i} className="pill">
              {crumb.chosenLabel}
            </span>
          ))}
        </div>
      )}

      {/* Current node */}
      <article className="result stack">
        {node.type === "end" && pillStyle && (
          <span className="pill" style={pillStyle}>
            {VARIANT_LABEL[node.variant] ?? "Outcome"}
          </span>
        )}

        {node.type === "question" && (
          <p className="muted">Step {history.length + 1}</p>
        )}

        <p style={{ fontWeight: 600, margin: 0 }}>{node.text}</p>

        {node.type === "question" && (
          <div className="stack" style={{ gap: "6px" }}>
            {node.options.map((opt) => (
              <AppButton
                key={opt.next}
                type="button"
                className="accordion-trigger"
                onClick={() => navigate(opt.next, opt.label)}
              >
                <span>{opt.label}</span>
                <span aria-hidden>›</span>
              </AppButton>
            ))}
          </div>
        )}
      </article>

      {/* Navigation controls */}
      {!isStart && (
        <div className="type-chip-row">
          <AppButton type="button" className="type-chip" onClick={goBack}>
            ← Back
          </AppButton>
          <AppButton type="button" className="type-chip" onClick={restart}>
            Start Over
          </AppButton>
        </div>
      )}
    </div>
  );
}

export default CBCCallFlowNavigator;
