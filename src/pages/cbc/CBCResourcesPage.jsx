import PageSection from "../../components/layout/PageSection";
import AppButton from "../../components/ui/AppButton/AppButton";
import {
  cbcResourcesMeta,
  quickShareLinks,
  userGuides,
  individualSetupSteps,
  employerSetupSteps,
  portalNotes,
  desDivisions,
} from "../../data/cbc/cbcResources";

function CBCResourcesPage() {
  return (
    <PageSection
      title="CBC Portal Resources"
      description={cbcResourcesMeta.description}
    >
      <section className="card stack">
        <h3>Portal Overview</h3>
        <p>
          The{" "}
          <a
            href={cbcResourcesMeta.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Arizona CBC web portal
          </a>{" "}
          allows individuals, caregivers, employers, and agencies to request
          background checks from the DCS Central Registry and APS Registry, and
          receive Fingerprint Clearance Card status updates through DPS.
        </p>
        <p className="muted">
          This portal replaces the paper forms DCS-1083A, CSO-1083C, CSO-1058A,
          and CSO-2040.
        </p>
        <div className="actions-row">
          <AppButton
            href={cbcResourcesMeta.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open CBC Portal
          </AppButton>
          <AppButton
            href={cbcResourcesMeta.desPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          >
            DES CBC Resources Page
          </AppButton>
          <AppButton
            href={cbcResourcesMeta.technicalSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          >
            Technical Support
          </AppButton>
        </div>
      </section>

      <section className="card stack">
        <h3>Quick Share Links</h3>
        <p className="muted">
          Links to share with callers during support interactions.
        </p>
        <div className="stack">
          {quickShareLinks.map((link) => (
            <article key={link.url} className="result search-item">
              <div>
                <p>
                  <strong>{link.label}</strong>
                </p>
                <p className="muted">{link.topic}</p>
              </div>
              <AppButton
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </AppButton>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>User Guides &amp; Quick Setup Flyers</h3>
        <p className="muted">
          All guides are available on the{" "}
          <a
            href={cbcResourcesMeta.desPageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            DES CBC Resources page
          </a>
          .
        </p>
        <div className="stack">
          {userGuides.map((guide) => (
            <article key={guide.id} className="result search-item">
              <div>
                <p>
                  <strong>{guide.title}</strong>{" "}
                  <span className="pill">{guide.number}</span>{" "}
                  <span className="muted">Rev. {guide.revision}</span>
                </p>
                <p className="muted">{guide.description}</p>
                <p className="muted">
                  <em>Role: {guide.role}</em>
                </p>
              </div>
              <AppButton
                href={guide.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </AppButton>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Individual Setup — 3 Steps</h3>
        <p className="muted">From CBC-1001A: Quick Setup for Individuals.</p>
        <div className="stack">
          {individualSetupSteps.map((s) => (
            <article key={s.step} className="result">
              <div>
                <p>
                  <strong>
                    Step {s.step}: {s.title}
                  </strong>
                </p>
                <ul className="list muted">
                  {s.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Employer / Agency Setup — 4 Steps</h3>
        <p className="muted">
          From CBC-1003A: Quick Setup for Employers and Agencies.
        </p>
        <div className="stack">
          {employerSetupSteps.map((s) => (
            <article key={s.step} className="result">
              <div>
                <p>
                  <strong>
                    Step {s.step}: {s.title}
                  </strong>
                </p>
                <ul className="list muted">
                  {s.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Portal Notes &amp; Common Situations</h3>
        <p className="muted">Quick reference for frequent caller questions.</p>
        <div className="stack">
          {portalNotes.map((note) => (
            <article key={note.title} className="result">
              <div>
                <p>
                  <strong>{note.title}</strong>
                </p>
                <p className="muted">{note.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Account Types</h3>
        <p className="muted">
          If a caller already has a DPS PSP account at psp.azdps.gov, they
          should <strong>log in</strong> — the same credentials work for the CBC
          portal. They do not need to create a new account.
        </p>
        <div className="stack">
          {[
            {
              role: "Individual",
              desc: "For individuals requesting a background check for their own employment or volunteer service.",
            },
            {
              role: "Caregiver",
              desc: "For individuals applying to become a DCS caregiver (foster parent, placement provider, or guardian).",
            },
            {
              role: "Employer",
              desc: "For organizations initiating or managing background checks for employees, applicants, or DCS caregivers. Use a group/company email.",
            },
            {
              role: "Agency",
              desc: "For agencies overseeing multiple employers' background checks. Does not submit requests directly — monitors employer dashboards.",
            },
          ].map((item) => (
            <article key={item.role} className="result">
              <div>
                <p>
                  <strong>{item.role}</strong>
                </p>
                <p className="muted">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>DES Divisions (Employer Affiliation)</h3>
        <p className="muted">
          DES contractors and service providers select their division when
          setting up an employer account.
        </p>
        <div className="stack">
          {desDivisions.map((div) => (
            <article key={div.short} className="result">
              <div>
                <p>
                  <strong>{div.short}</strong>
                </p>
                <p className="muted">{div.name}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h3>Accessibility</h3>
        <p className="muted">
          The CBC portal supports the NVDA (NonVisual Desktop Access) and JAWS
          (Job Access With Speech) screen readers.
        </p>
      </section>
    </PageSection>
  );
}

export default CBCResourcesPage;
