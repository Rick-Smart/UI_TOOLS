import { useMemo, useState } from "react";
import {
  callbackScripts,
  callFlowChecklist,
  closeScript,
  contactNumbers,
  difficultCallerScripts,
  greetingScripts,
  holdScripts,
  rfcPrompts,
  verificationScripts,
  wrapUpCodes,
} from "../data/callHandlingData";

function CallHandlingPage() {
  const [callType, setCallType] = useState("inbound");
  const [verificationType, setVerificationType] = useState("claimantPin");
  const [wrapQuery, setWrapQuery] = useState("");

  const [noteFields, setNoteFields] = useState({
    agentId: "",
    callTime: "",
    reasonForCall: "",
    actionsTaken: "",
    importantInfo: "",
    nextSteps: "",
    proxyPermission: false,
  });

  const generatedNote = useMemo(() => {
    const proxyText = noteFields.proxyPermission
      ? "Proxy permission provided by claimant for this interaction only."
      : "No proxy authorization noted.";

    return [
      `${noteFields.agentId || "AGENT_ID"} | ${noteFields.callTime || "CALL_TIME"}`,
      `RFC: ${noteFields.reasonForCall || ""}`,
      `Action Taken: ${noteFields.actionsTaken || ""}`,
      `Important Info: ${noteFields.importantInfo || ""}`,
      `Next Steps: ${noteFields.nextSteps || ""}`,
      `Proxy: ${proxyText}`,
    ].join("\n");
  }, [noteFields]);

  const filteredWrapCodes = useMemo(() => {
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

  function updateNote(field, value) {
    setNoteFields((current) => ({ ...current, [field]: value }));
  }

  async function copyNote() {
    try {
      await navigator.clipboard.writeText(generatedNote);
    } catch {
      // No-op for restricted clipboard contexts
    }
  }

  return (
    <section className="card stack">
      <div>
        <h2>Call Handling Helper</h2>
        <p className="muted section-copy">
          Guided scripts and workflow support for consistent, claimant-centered
          calls.
        </p>
      </div>

      <div className="result stack">
        <h3>Call flow checklist</h3>
        <ul className="list">
          {callFlowChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Greeting script</h3>
          <label htmlFor="call-type">Call type</label>
          <select
            id="call-type"
            value={callType}
            onChange={(event) => setCallType(event.target.value)}
          >
            <option value="inbound">Inbound</option>
            <option value="callback">Callback</option>
          </select>
          <p>{greetingScripts[callType]}</p>
        </div>

        <div className="result stack">
          <h3>Verification helper</h3>
          <label htmlFor="verify-type">Verification mode</label>
          <select
            id="verify-type"
            value={verificationType}
            onChange={(event) => setVerificationType(event.target.value)}
          >
            <option value="claimantPin">Claimant (PIN verified)</option>
            <option value="claimantNoPin">
              Claimant (no PIN verification)
            </option>
            <option value="employer">Employer</option>
          </select>
          <ul className="list">
            {verificationScripts[verificationType].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="result stack">
        <h3>RFC prompts and hold language</h3>
        <p className="muted">
          Use funneling prompts to clarify and confirm reason for calling.
        </p>
        <ul className="list">
          {rfcPrompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
        <p>
          <strong>Initial hold:</strong> {holdScripts.initial}
        </p>
        <p>
          <strong>Check-in:</strong> {holdScripts.checkIn}
        </p>
        <p>
          <strong>Extended hold:</strong> {holdScripts.extended}
        </p>
      </div>

      <div className="grid grid-2">
        <div className="result stack">
          <h3>Voicemail and dropped call</h3>
          <p>
            <strong>Voicemail:</strong> {callbackScripts.voicemail}
          </p>
          <p>
            <strong>Dropped call:</strong> {callbackScripts.dropped}
          </p>
        </div>

        <div className="result stack">
          <h3>Difficult caller language</h3>
          <p>
            <strong>Warning 1:</strong> {difficultCallerScripts.warning1}
          </p>
          <p>
            <strong>Warning 2:</strong> {difficultCallerScripts.warning2}
          </p>
          <p>
            <strong>Final:</strong> {difficultCallerScripts.final}
          </p>
        </div>
      </div>

      <div className="result stack">
        <h3>Case note builder</h3>
        <div className="input-grid">
          <div>
            <label htmlFor="note-agent">Agent note ID</label>
            <input
              id="note-agent"
              type="text"
              placeholder="AgentID_FirstName_LastInitial"
              value={noteFields.agentId}
              onChange={(event) => updateNote("agentId", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="note-time">Time of call</label>
            <input
              id="note-time"
              type="text"
              placeholder="HH:MM"
              value={noteFields.callTime}
              onChange={(event) => updateNote("callTime", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="note-rfc">Reason for call</label>
            <input
              id="note-rfc"
              type="text"
              value={noteFields.reasonForCall}
              onChange={(event) =>
                updateNote("reasonForCall", event.target.value)
              }
            />
          </div>
        </div>

        <div className="stack">
          <div>
            <label htmlFor="note-actions">Actions taken</label>
            <textarea
              className="note-field-large"
              id="note-actions"
              value={noteFields.actionsTaken}
              onChange={(event) =>
                updateNote("actionsTaken", event.target.value)
              }
            />
          </div>
          <div>
            <label htmlFor="note-important">Important info</label>
            <textarea
              className="note-field-large"
              id="note-important"
              value={noteFields.importantInfo}
              onChange={(event) =>
                updateNote("importantInfo", event.target.value)
              }
            />
          </div>
          <div>
            <label htmlFor="note-next">Next steps</label>
            <textarea
              className="note-field-large"
              id="note-next"
              value={noteFields.nextSteps}
              onChange={(event) => updateNote("nextSteps", event.target.value)}
            />
          </div>
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={noteFields.proxyPermission}
            onChange={(event) =>
              updateNote("proxyPermission", event.target.checked)
            }
          />
          <span>Claimant approved speaking to proxy for this call only</span>
        </label>
        <textarea className="note-output" value={generatedNote} readOnly />
        <button type="button" onClick={copyNote}>
          Copy note text
        </button>
      </div>

      <div className="result stack">
        <h3>Wrap-up code helper</h3>
        <label htmlFor="wrap-search">Search wrap-up code</label>
        <input
          id="wrap-search"
          type="text"
          placeholder="Search by code or usage"
          value={wrapQuery}
          onChange={(event) => setWrapQuery(event.target.value)}
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
              {filteredWrapCodes.map((item) => (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>{item.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="result stack">
        <h3>Key contact points</h3>
        <ul className="list">
          {contactNumbers.map((item) => (
            <li key={item.label}>
              <strong>{item.label}:</strong> {item.value}
            </li>
          ))}
        </ul>
        <p>
          <strong>Standard close:</strong> {closeScript}
        </p>
      </div>
    </section>
  );
}

export default CallHandlingPage;
