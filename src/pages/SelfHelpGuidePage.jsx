const loginSteps = [
  "Go to the AZDES self-help login page.",
  "Enter your username using your C# (example: C0XXXXX) and your password.",
  "Confirm the environment is set to AZDESGOV.",
  "Select Login.",
];

const einLookupSteps = [
  "After login, open the Profile tab in the top navigation.",
  "Scroll to the Attributes section in the profile view.",
  "Locate EIN in the Attributes list.",
  "Use EIN value as needed for approved workflow steps.",
];

const troubleshootingNotes = [
  "Use Forgot your password? for password reset workflow.",
  "Use Account locked out? to recover access after lockout.",
  "If they cannot complete this process, contact the Resolution Center at 602.364.4419 to reset their password.",
  "If account access still fails, escalate through approved internal support path.",
];

const loginScreenshotSrc = `${import.meta.env.BASE_URL}media/AZDES%20LOGIN.png`;
const einScreenshotSrc = `${import.meta.env.BASE_URL}media/EIN%20path.jpg`;

function SelfHelpGuidePage() {
  return (
    <section className="card stack">
      <div>
        <h2>AZDES Self-Help Guide</h2>
        <p className="muted section-copy">
          Quick guide for sign-in and profile lookup steps, including where to
          locate EIN after login.
        </p>
      </div>

      <div className="result stack">
        <h3>Login steps</h3>
        <p>
          Self-help URL:{" "}
          <a
            href="https://adselfservice.azdes.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-break"
          >
            https://adselfservice.azdes.gov/
          </a>
        </p>
        <ul className="list">
          {loginSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      <div className="result stack">
        <h3>Screenshot: Login page</h3>
        <figure className="guide-image-block">
          <img
            className="guide-image"
            src={loginScreenshotSrc}
            alt="AZDES self-help login screen with username, password, and AZDESGOV environment selector"
          />
          <figcaption className="muted">Login screen reference.</figcaption>
        </figure>
      </div>

      <div className="result stack">
        <h3>EIN lookup in Profile</h3>
        <ul className="list">
          {einLookupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      <div className="result stack">
        <h3>Screenshot: Profile EIN location</h3>
        <figure className="guide-image-block">
          <img
            className="guide-image"
            src={einScreenshotSrc}
            alt="AZDES profile screen showing where to find EIN in the Attributes section"
          />
          <figcaption className="muted">Profile/EIN reference.</figcaption>
        </figure>
      </div>

      <div className="result stack">
        <h3>Troubleshooting notes</h3>
        <ul className="list">
          {troubleshootingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default SelfHelpGuidePage;
