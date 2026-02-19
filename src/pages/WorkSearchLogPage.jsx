import { useMemo, useState } from "react";
import Tooltip from "../components/Tooltip";
import { copyText } from "../utils/copyText";

function createEntry() {
  return {
    contactDate: "",
    employerName: "",
    employerAddress: "",
    contactPersonOrSite: "",
    method: "",
    workSought: "",
    actionTaken: "",
  };
}

function WorkSearchLogPage() {
  const [entries, setEntries] = useState([createEntry()]);
  const [copyStatus, setCopyStatus] = useState("");

  const uniqueContactDays = useMemo(() => {
    const days = entries
      .map((entry) => entry.contactDate)
      .filter((value) => value);
    return new Set(days).size;
  }, [entries]);

  const completeEntries = useMemo(() => {
    return entries.filter((entry) =>
      Object.values(entry).every((value) => String(value).trim().length > 0),
    ).length;
  }, [entries]);

  function updateEntry(index, field, value) {
    setEntries((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function addEntry() {
    setEntries((current) => [...current, createEntry()]);
  }

  function removeEntry(index) {
    setEntries((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  const meetsFourDayRule = uniqueContactDays >= 4;

  async function handleCopySummary() {
    const lines = [
      "Work Search Weekly Summary",
      `Completed contacts: ${completeEntries}`,
      `Unique contact days: ${uniqueContactDays}`,
      `Four-day minimum: ${meetsFourDayRule ? "Met" : "Not met"}`,
      "",
      ...entries.map(
        (entry, index) =>
          `#${index + 1} ${entry.contactDate || "No date"} | ${entry.employerName || "No employer"} | ${entry.method || "No method"}`,
      ),
    ];

    const copied = await copyText(lines.join("\n"));
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

  return (
    <section className="card stack">
      <div>
        <h2>Work Search Compliance Log</h2>
        <p className="muted section-copy">
          Track required weekly work-search contacts and validate four different
          contact days before filing.
        </p>
      </div>

      <div className="result stack" aria-live="polite">
        <h3>
          Weekly status
          <Tooltip text="Track completed contacts and unique contact days to confirm readiness before filing." />
        </h3>
        <p>Completed contacts: {completeEntries}</p>
        <p>Unique contact days: {uniqueContactDays}</p>
        <p>
          <strong>
            {meetsFourDayRule
              ? "Meets four-different-day minimum"
              : "Does not meet four-different-day minimum yet"}
          </strong>
        </p>
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={handleCopySummary}
          >
            Copy summary
          </button>
          {copyStatus ? <span className="muted">{copyStatus}</span> : null}
        </div>
      </div>

      {entries.map((entry, index) => (
        <div key={`entry-${index}`} className="result stack">
          <div className="title-row">
            <h3>Contact #{index + 1}</h3>
            {entries.length > 1 ? (
              <button
                type="button"
                className="button-secondary"
                onClick={() => removeEntry(index)}
              >
                Remove
              </button>
            ) : null}
          </div>

          <div className="stack">
            <div>
              <label htmlFor={`date-${index}`}>
                Date of contact
                <Tooltip text="Use the date the contact attempt occurred, not when notes were entered." />
              </label>
              <input
                id={`date-${index}`}
                type="date"
                value={entry.contactDate}
                onChange={(event) =>
                  updateEntry(index, "contactDate", event.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor={`employer-${index}`}>Employer name</label>
              <input
                id={`employer-${index}`}
                type="text"
                value={entry.employerName}
                onChange={(event) =>
                  updateEntry(index, "employerName", event.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor={`address-${index}`}>Employer address</label>
              <textarea
                id={`address-${index}`}
                value={entry.employerAddress}
                onChange={(event) =>
                  updateEntry(index, "employerAddress", event.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor={`contact-${index}`}>
                Contact person or website
                <Tooltip text="Enter recruiter/contact name or specific website where application was submitted." />
              </label>
              <input
                id={`contact-${index}`}
                type="text"
                value={entry.contactPersonOrSite}
                onChange={(event) =>
                  updateEntry(index, "contactPersonOrSite", event.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor={`method-${index}`}>
                Method of contact
                <Tooltip text="Examples: online application, email, in-person, phone call." />
              </label>
              <input
                id={`method-${index}`}
                type="text"
                value={entry.method}
                onChange={(event) =>
                  updateEntry(index, "method", event.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor={`work-${index}`}>Type of work sought</label>
              <input
                id={`work-${index}`}
                type="text"
                value={entry.workSought}
                onChange={(event) =>
                  updateEntry(index, "workSought", event.target.value)
                }
              />
            </div>
            <div>
              <label htmlFor={`action-${index}`}>
                Action taken
                <Tooltip text="Capture what happened: applied, left voicemail, interview scheduled, follow-up requested, etc." />
              </label>
              <textarea
                id={`action-${index}`}
                value={entry.actionTaken}
                onChange={(event) =>
                  updateEntry(index, "actionTaken", event.target.value)
                }
              />
            </div>
          </div>
        </div>
      ))}

      <div>
        <button type="button" onClick={addEntry}>
          Add contact
        </button>
      </div>
    </section>
  );
}

export default WorkSearchLogPage;
