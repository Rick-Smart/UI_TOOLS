import { useEffect, useMemo, useRef, useState } from "react";
import PageSection from "../../components/layout/PageSection";
import AppButton from "../../components/ui/AppButton/AppButton";
import { copyText } from "../../utils/copyText";
import { addInteractionMemory } from "../../utils/interactionMemory";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toLocalIsoString(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function formatReadable(date) {
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

function CBCMillisPage() {
  // Live clock
  const [nowMs, setNowMs] = useState(() => Date.now());
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // Date → ms converter
  const [dateInput, setDateInput] = useState(() =>
    toLocalIsoString(new Date()),
  );
  const dateToMs = useMemo(() => {
    if (!dateInput) return null;
    const ms = new Date(dateInput).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [dateInput]);

  // ms → Date converter
  const [millisInput, setMillisInput] = useState("");
  const msToDate = useMemo(() => {
    const n = Number(millisInput.trim());
    if (!millisInput.trim() || !Number.isFinite(n) || n < 0) return null;
    return new Date(n);
  }, [millisInput]);

  // Copy helpers
  const [copyStatus, setCopyStatus] = useState({});
  async function handleCopy(key, value, label) {
    const copied = await copyText(String(value));
    if (copied) addInteractionMemory(label, String(value));
    setCopyStatus((prev) => ({
      ...prev,
      [key]: copied ? "Copied." : "Unavailable.",
    }));
    setTimeout(() => setCopyStatus((prev) => ({ ...prev, [key]: "" })), 2500);
  }

  return (
    <PageSection
      title="Milliseconds / Timestamp Tool"
      description="Convert between human-readable dates and Unix timestamps in milliseconds. Use this to set or verify backend password expiry timestamps."
    >
      {/* ── Live clock ─────────────────────────────────────────────────────── */}
      <section className="card stack">
        <h3>Current Timestamp</h3>
        <div
          className="result"
          aria-live="polite"
          aria-label="Current Unix timestamp in milliseconds"
        >
          <span
            style={{
              fontVariantNumeric: "tabular-nums",
              fontSize: "1.5em",
              fontWeight: 700,
            }}
          >
            {nowMs}
          </span>
          <span
            className="muted"
            style={{ fontSize: "0.82em", display: "block", marginTop: 4 }}
          >
            {formatReadable(new Date(nowMs))}
          </span>
        </div>
        <div className="actions-row">
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => handleCopy("now", nowMs, "Current Timestamp (ms)")}
          >
            Copy milliseconds
          </AppButton>
          {copyStatus.now && <span className="muted">{copyStatus.now}</span>}
        </div>
      </section>

      {/* ── Date → ms ──────────────────────────────────────────────────────── */}
      <section className="card stack">
        <h3>Date / Time → Milliseconds</h3>
        <p className="muted">
          Pick a date and time to get the equivalent Unix timestamp in
          milliseconds.
        </p>
        <div>
          <label htmlFor="cbc-date-to-ms">Date and time</label>
          <input
            id="cbc-date-to-ms"
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </div>
        <div className="result" aria-live="polite">
          {dateToMs !== null ? (
            <>
              <span
                style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
              >
                {dateToMs}
              </span>
              <span
                className="muted"
                style={{ fontSize: "0.82em", display: "block", marginTop: 4 }}
              >
                {formatReadable(new Date(dateToMs))}
              </span>
            </>
          ) : (
            <span className="muted">Enter a valid date and time above.</span>
          )}
        </div>
        <div className="actions-row">
          <AppButton
            type="button"
            variant="secondary"
            disabled={dateToMs === null}
            onClick={() =>
              handleCopy("dateMs", dateToMs, "Date → Milliseconds")
            }
          >
            Copy milliseconds
          </AppButton>
          {copyStatus.dateMs && (
            <span className="muted">{copyStatus.dateMs}</span>
          )}
        </div>
      </section>

      {/* ── ms → Date ──────────────────────────────────────────────────────── */}
      <section className="card stack">
        <h3>Milliseconds → Date / Time</h3>
        <p className="muted">
          Paste a Unix timestamp in milliseconds to see the corresponding date
          and time.
        </p>
        <div>
          <label htmlFor="cbc-ms-to-date">Milliseconds value</label>
          <input
            id="cbc-ms-to-date"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1741651200000"
            value={millisInput}
            onChange={(e) => setMillisInput(e.target.value)}
          />
        </div>
        <div className="result" aria-live="polite">
          {msToDate !== null ? (
            <>
              <span style={{ fontWeight: 600 }}>
                {formatReadable(msToDate)}
              </span>
              <span
                className="muted"
                style={{ fontSize: "0.82em", display: "block", marginTop: 4 }}
              >
                UTC: {msToDate.toUTCString()}
              </span>
            </>
          ) : millisInput.trim() ? (
            <span className="muted">Enter a valid positive number.</span>
          ) : (
            <span className="muted">Enter a milliseconds value above.</span>
          )}
        </div>
        <div className="actions-row">
          <AppButton
            type="button"
            variant="secondary"
            disabled={msToDate === null}
            onClick={() =>
              handleCopy(
                "msDate",
                formatReadable(msToDate),
                "Milliseconds → Date",
              )
            }
          >
            Copy readable date
          </AppButton>
          {copyStatus.msDate && (
            <span className="muted">{copyStatus.msDate}</span>
          )}
        </div>
      </section>
    </PageSection>
  );
}

export default CBCMillisPage;
