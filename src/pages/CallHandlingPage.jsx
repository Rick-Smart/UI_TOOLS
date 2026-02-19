import { useMemo, useState } from "react";
import {
  callGuideMeta,
  closeScript,
  contactInfo,
  customerServiceHighlights,
  difficultCallerScripts,
  generalReviewChecklist,
  greetingScripts,
  managingCallSteps,
  noteDoNotInclude,
  noteRequirements,
  prepareChecklist,
  rfcPrompts,
  supportResources,
  verificationGuides,
  voicemailScripts,
  wrapUpCodes,
} from "../data/callHandlingGuideData";
import { copyText } from "../utils/copyText";

function CallHandlingPage() {
  const [wrapQuery, setWrapQuery] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const filteredCodes = useMemo(() => {
    const query = wrapQuery.trim().toLowerCase();
    if (!query) {
      return wrapUpCodes;
    }

    return wrapUpCodes.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.use.toLowerCase().includes(query),
    );
  }, [wrapQuery]);

  async function handleCopyCloseScript() {
    const copied = await copyText(closeScript);
    setCopyStatus(copied ? "Closing script copied." : "Copy unavailable.");
  }

  return (
    <section className="card stack">
      <div className="title-row">
        <div>
          <h2>Call Handling</h2>
          <p className="muted section-copy">
            {callGuideMeta.title} · {callGuideMeta.version} ·{" "}
            {callGuideMeta.program}
          </p>
        </div>
        <span className="pill">Guide access restored</span>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Managing a call</h3>
          <ul className="list">
            {managingCallSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="result stack">
          <h3>Prepare checklist</h3>
          <ul className="list">
            {prepareChecklist.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Greeting scripts</h3>
          <p>
            <strong>Inbound:</strong> {greetingScripts.inbound}
          </p>
          <p>
            <strong>Callback:</strong> {greetingScripts.callback}
          </p>
          <p className="muted">{greetingScripts.proxy}</p>
        </div>

        <div className="result stack">
          <h3>Voicemail / Ghost call</h3>
          <p>
            <strong>Voicemail:</strong> {voicemailScripts.voicemail}
          </p>
          <p>
            <strong>Ghost call:</strong> {voicemailScripts.ghost}
          </p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Verification (PIN verified)</h3>
          <ul className="list">
            {verificationGuides.pinVerified.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="result stack">
          <h3>Verification (No PIN)</h3>
          <ul className="list">
            {verificationGuides.noPin.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <h3>Employer verification</h3>
          <ul className="list">
            {verificationGuides.employer.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="result stack">
        <h3>Identify RFC + hold language</h3>
        <p>
          <strong>Openers:</strong>
        </p>
        <ul className="list">
          {rfcPrompts.openers.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>
          <strong>Follow-up examples:</strong>
        </p>
        <ul className="list">
          {rfcPrompts.followUps.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>
          <strong>Paraphrase RFC:</strong> {rfcPrompts.paraphrase}
        </p>
        <p>
          <strong>Initial hold:</strong> {rfcPrompts.holdInitial}
        </p>
        <p>
          <strong>Hold check-in:</strong> {rfcPrompts.holdCheckIn}
        </p>
      </div>

      <div className="result stack">
        <h3>General claim review</h3>
        <ul className="list">
          {generalReviewChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Case note required fields</h3>
          <ul className="list">
            {noteRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="result stack">
          <h3>Do not include in notes</h3>
          <ul className="list">
            {noteDoNotInclude.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Closing script</h3>
          <p>{closeScript}</p>
          <div className="actions-row">
            <button
              type="button"
              className="button-secondary"
              onClick={handleCopyCloseScript}
            >
              Copy closing script
            </button>
            {copyStatus ? <span className="muted">{copyStatus}</span> : null}
          </div>
        </div>

        <div className="result stack">
          <h3>Difficult caller protocol</h3>
          <p>
            <strong>Warning 1:</strong> {difficultCallerScripts.warning1}
          </p>
          <p>
            <strong>Warning 2:</strong> {difficultCallerScripts.warning2}
          </p>
          <p>
            <strong>Final:</strong> {difficultCallerScripts.final}
          </p>
          <p className="muted">
            Note suffix: {difficultCallerScripts.noteSuffix}
          </p>
        </div>
      </div>

      <div className="result stack">
        <h3>Customer service reminders</h3>
        <ul className="list">
          {customerServiceHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Contact information</h3>
          <p>
            <strong>Unemployment phones</strong>
          </p>
          <ul className="list">
            {contactInfo.unemploymentPhones.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p>
            <strong>Automated system</strong>
          </p>
          <ul className="list">
            {contactInfo.automatedSystem.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p>
            <strong>Internal transfers</strong>
          </p>
          <ul className="list">
            {contactInfo.internalTransfers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <p>
            <strong>Email:</strong> {contactInfo.emails.join(", ")}
          </p>
          <p>
            <strong>Website:</strong> {contactInfo.website}
          </p>
        </div>

        <div className="result stack">
          <h3>UI Assist services</h3>
          <ul className="list">
            {supportResources.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                {item.phone ? ` · ${item.phone}` : ""}
                {item.url ? (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.url}
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="result stack">
        <h3>Wrap-up codes</h3>
        <label htmlFor="wrap-search">Search by code or use</label>
        <input
          id="wrap-search"
          type="text"
          value={wrapQuery}
          onChange={(event) => setWrapQuery(event.target.value)}
          placeholder="UIB-CLMT Docs, missing payment, appeal..."
        />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Use</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.map((item) => (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>{item.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default CallHandlingPage;
