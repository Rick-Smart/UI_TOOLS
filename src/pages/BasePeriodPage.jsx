import { useMemo, useState } from "react";
import {
  formatRange,
  getQuarterCloseLagDays,
  getQuarterInfo,
  lastCompletedQuarter,
  previousQuarter,
} from "../utils/quarterUtils";

function toIsoLocalDate(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().split("T")[0];
}

function QuarterCard({ info, tagText, tagClass, note = "" }) {
  return (
    <div className="quarter-item">
      <div className="label">
        {info.label} {info.year} <span className="muted">({info.months})</span>
      </div>
      <div className="muted">{formatRange(info.start, info.end)}</div>
      {note ? <div className="muted">{note}</div> : null}
      <span className={`pill ${tagClass}`}>{tagText}</span>
    </div>
  );
}

function BasePeriodPage() {
  const todayIso = useMemo(() => toIsoLocalDate(new Date()), []);
  const [claimDate, setClaimDate] = useState(todayIso);

  const calculation = useMemo(() => {
    if (!claimDate) {
      return null;
    }

    const parsedClaimDate = new Date(`${claimDate}T12:00:00`);
    const lastCompleted = lastCompletedQuarter(parsedClaimDate);
    const latestQuarter = getQuarterInfo(
      lastCompleted.year,
      lastCompleted.quarter,
    );

    const lastFive = [latestQuarter];
    let cursor = { year: lastCompleted.year, quarter: lastCompleted.quarter };

    for (let index = 0; index < 4; index += 1) {
      cursor = previousQuarter(cursor);
      lastFive.push(getQuarterInfo(cursor.year, cursor.quarter));
    }

    const lagDays = getQuarterCloseLagDays(
      latestQuarter.year,
      latestQuarter.quarter,
    );
    const lagNote = lagDays
      ? `Quarter-close lag days: ${formatRange(lagDays.start, lagDays.end)}`
      : "Quarter-close lag days: none (quarter-end month ended on Saturday).";

    return {
      latestQuarter,
      basePeriod: lastFive.slice(1).reverse(),
      allFiveChronological: [...lastFive].reverse(),
      lagNote,
    };
  }, [claimDate]);

  return (
    <section className="card stack">
      <div>
        <h2>Base Period Calculator</h2>
        <p className="muted section-copy">
          Base period is the first four of the last five completed quarters
          before filing. Quarter changes begin with the first full week (Sunday)
          of January, April, July, and October.
        </p>
      </div>

      <div className="input-row">
        <div>
          <label htmlFor="claim-date">Claim filing date</label>
          <input
            id="claim-date"
            type="date"
            value={claimDate}
            onChange={(event) => setClaimDate(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div>
          <span className="pill">Quick rules</span>
          <ul className="list">
            <li>
              Quarter changes begin on the first <strong>Sunday</strong> of Jan
              / Apr / Jul / Oct.
            </li>
            <li>
              Find the last five <strong>completed</strong> quarters.
            </li>
            <li>
              Use the <strong>first four</strong> as the base period.
            </li>
            <li>
              The most recent completed quarter is the{" "}
              <strong>lag quarter</strong>.
            </li>
          </ul>
        </div>
        <div>
          <span className="pill">Quarter definitions</span>
          <ul className="list">
            <li>Q1 months: Jan–Mar</li>
            <li>Q2 months: Apr–Jun</li>
            <li>Q3 months: Jul–Sep</li>
            <li>Q4 months: Oct–Dec</li>
            <li>
              Lag days: when a quarter-end month ends before Saturday, days from
              that week’s Sunday through month-end are lag days.
            </li>
          </ul>
        </div>
      </div>

      {!calculation ? (
        <p className="muted">Choose a date to see your base period.</p>
      ) : (
        <>
          <section className="grid grid-2">
            <div className="result" aria-live="polite">
              <h3>Base period (4 quarters)</h3>
              <div className="quarters">
                {calculation.basePeriod.map((info) => (
                  <QuarterCard
                    key={`${info.year}-${info.quarter}`}
                    info={info}
                    tagText="Base period"
                    tagClass="tag-base"
                  />
                ))}
              </div>
            </div>

            <div className="result" aria-live="polite">
              <h3>Lag quarter (most recent completed quarter)</h3>
              <div className="quarters">
                <QuarterCard
                  info={calculation.latestQuarter}
                  tagText="Lag quarter"
                  tagClass="tag-lag"
                  note={calculation.lagNote}
                />
              </div>
            </div>
          </section>

          <div className="result" aria-live="polite">
            <h3>Last five completed quarters</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Quarter</th>
                  <th>Date range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {calculation.allFiveChronological.map((info) => {
                  const isLag =
                    info.year === calculation.latestQuarter.year &&
                    info.quarter === calculation.latestQuarter.quarter;

                  return (
                    <tr key={`${info.year}-${info.quarter}`}>
                      <td>
                        {info.label} {info.year}{" "}
                        <span className="muted">({info.months})</span>
                      </td>
                      <td>{formatRange(info.start, info.end)}</td>
                      <td>{isLag ? "Lag quarter" : "Base period"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default BasePeriodPage;
