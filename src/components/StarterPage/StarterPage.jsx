import "./StarterPage.css";

function StarterPage({ onGuidedStart, onCompareAll }) {
  return (
    <main className="starter-page">
      <section className="starter-page__intro">
        <p className="starter-page__eyebrow">
          A private, educational tool from ORO
        </p>
        <h1 className="starter-page__title">
          Understand your home equity and options
        </h1>
        <p className="starter-page__description">
          Tell us what matters, add a few home details, and compare how seven
          common options may affect monthly payments, costs, and future equity.
        </p>
      </section>

      <section className="starter-page__options">
        <article className="starter-page__card">
          <h2 className="starter-page__card-title">Help me explore options</h2>

          <p className="starter-page__card-description">
            Answer four short preference questions, then add home details to see
            two or three options aligned with your priorities.
          </p>
          <button
            className="starter-page__primary-button"
            type="button"
            onClick={onGuidedStart}
          >
            Find options for me
          </button>
          <p className="starter-page__card-meta">About 4-6 minutes</p>
        </article>

        <article className="starter-page__card">
          <h2 className="starter-page__card-title">
            I know what I want to compare
          </h2>
          <p className="starter-page__card-description">
            Skip the preference questions, enter home details, and review all
            seven options with equal prominence.
          </p>
          <button
            className="starter-page__secondary-button"
            type="button"
            onClick={onCompareAll}
          >
            Compare all 7 directly
          </button>
          <p className="starter-page__card-meta">
            Useful for returning users and concierge sessions
          </p>
        </article>
      </section>

      <div className="starter-page__callout" role="note">
        <span className="starter-page__callout-icon" aria-hidden="true">
          i
        </span>
        <p>
          Private by design. Your entries are calculated in this browser session and
          are not stored or transmitted. Results are illustrative estimates—not
          financial advice.
        </p>
      </div>
    </main>
  );
}

export default StarterPage;
