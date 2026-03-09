import { useState } from "react";
import {
  callGuideMeta,
  greetingScripts,
  managingCallSteps,
  noteRequirements,
  orderedCallChecklist,
  prepareChecklist,
  unableToVerifyProtocol,
} from "../../data/cbc/callHandlingGuideData";
import PageSection from "../../components/layout/PageSection";

function StepSection({ title, items }) {
  return (
    <section className="card stack">
      <h3>{title}</h3>
      <ol className="stack">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    </section>
  );
}

function ScriptBlock({ label, script }) {
  return (
    <div className="card stack">
      <p>
        <strong>{label}</strong>
      </p>
      <p className="muted">{script}</p>
    </div>
  );
}

function CBCCallHandlingPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <PageSection
      title={callGuideMeta.title}
      description={`${callGuideMeta.version} · Program ${callGuideMeta.program}`}
    >
      <section className="card stack">
        <h3>Call Steps</h3>
        <div className="tools-grid home-top-actions-grid">
          {managingCallSteps.map((step, index) => (
            <button
              key={step}
              type="button"
              className={`tool-card ${activeStep === index ? "tool-card-active" : ""}`}
              onClick={() => setActiveStep(index)}
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <p>
                <strong>
                  {index + 1}. {step}
                </strong>
              </p>
            </button>
          ))}
        </div>
      </section>

      <StepSection title="Prepare Checklist" items={prepareChecklist} />

      <section className="card stack">
        <h3>Greeting Scripts</h3>
        <ScriptBlock label="Inbound" script={greetingScripts.inbound} />
        {greetingScripts.callback && (
          <ScriptBlock label="Callback" script={greetingScripts.callback} />
        )}
      </section>

      <StepSection
        title="Unable to Verify Protocol"
        items={unableToVerifyProtocol}
      />

      <StepSection
        title="Ordered Call Checklist"
        items={orderedCallChecklist}
      />

      <StepSection title="Case Note Requirements" items={noteRequirements} />

      <section className="card stack">
        <h3>Stub Notice</h3>
        <p className="muted">
          This is a placeholder Call Handling page for the CBC knowledge base.
          Full scripts, verification flows, RFC prompts, and portal navigation
          guides will be added as CBC-specific documentation becomes available.
        </p>
      </section>
    </PageSection>
  );
}

export default CBCCallHandlingPage;
