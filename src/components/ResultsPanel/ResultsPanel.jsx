import { useMemo, useState } from "react";
import { formatSignedCurrency } from "../../utils/homeEquityCalculations.js";
import "./ResultsPanel.css";

const summaryByProduct = {
  hei: "Receive a discounted lump sum in exchange for a share of future appreciation.",
  coownership: "An investor buys a proportional share of the home in exchange for cash.",
  heloc: "Flexible borrowing with interest-only monthly payments during the draw period.",
  heloan: "Fixed monthly repayment schedule with predictable costs over time.",
  refi: "Replaces your mortgage with a larger loan to unlock home equity.",
  reverse: "Available at age 62+ and can support cash flow without monthly repayment.",
  saleLeaseback: "Sell the home and lease it back to stay in place while accessing proceeds.",
};

const riskByProduct = {
  hei: "An investor receives 15% of future appreciation at settlement.",
  coownership: "The investor owns a share that is settled or bought out at sale.",
  heloc: "Rates may change over time and increase total borrowing costs.",
  heloan: "Fixed payments continue for the full loan term once funds are used.",
  refi: "Extends mortgage costs and resets a portion of long-term amortization.",
  reverse: "Loan balance grows over time and reduces future remaining equity.",
  saleLeaseback: "You become a renter and no longer keep ownership equity growth.",
};

const formatK = (value) => {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }
  return `$${Math.round(value / 1000)}K`;
};

function ResultsPanel({ recommendations, allProducts, onRestart, onCompareAll }) {
  const [activeTab, setActiveTab] = useState("matches");
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedCount = selectedIds.length;
  const matchProducts = useMemo(
    () => (recommendations ?? []).filter((product) => product.id !== "reverse").slice(0, 2),
    [recommendations],
  );
  const renderProducts = activeTab === "matches" ? matchProducts : allProducts ?? [];
  const reverseProduct = (allProducts ?? []).find((product) => product.id === "reverse");
  const reverseUnavailable = reverseProduct?.ineligible;

  const toggleSelected = (productId) => {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  return (
    <section className="results-panel">
      <div className="results-panel__top-progress" aria-label="Options progress">
        <div className="results-panel__segments">
          <span className="results-panel__segment complete" />
          <span className="results-panel__segment complete" />
          <span className="results-panel__segment active" />
        </div>
        <div className="results-panel__top-meta">
          <p>Options to explore</p>
          <span>3 of 3</span>
        </div>
      </div>

      <header className="results-panel__header">
        <p className="results-panel__eyebrow">OPTIONS TO EXPLORE</p>
        <h1>Two options align closely with your priorities</h1>
        <p>
          This is a preference-based starting point, not a financial recommendation. All
          seven products remain available in the full comparison.
        </p>
      </header>

      <div className="results-panel__tabs" role="tablist" aria-label="Results views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "matches"}
          className={`results-panel__tab ${activeTab === "matches" ? "active" : ""}`}
          onClick={() => setActiveTab("matches")}
        >
          Your Matches
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all"}
          className={`results-panel__tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All 7 Options
        </button>
        <button
          type="button"
          className="results-panel__tab"
          onClick={() => setActiveTab("matches")}
        >
          Compare Selected ({selectedCount})
        </button>
      </div>

      <div className="results-panel__cards">
        {renderProducts.map((product) => {
          const isSelected = selectedIds.includes(product.id);

          return (
            <article key={product.id} className="results-card">
              <button
                type="button"
                className={`results-card__picker ${isSelected ? "selected" : ""}`}
                aria-label={`Select ${product.name}`}
                onClick={() => toggleSelected(product.id)}
              />
              <h2>{product.name}</h2>
              <p className="results-card__eligible">
                {product.ineligible ? "Unavailable right now" : "Eligible to explore"}
              </p>
              <p className="results-card__summary">
                {summaryByProduct[product.id] ?? "Explore this option with your estimated values."}
              </p>

              <div className="results-card__stats">
                <div>
                  <span>Monthly impact</span>
                  <strong>{formatSignedCurrency(product.monthly)}</strong>
                  <small>Illustrative</small>
                </div>
                <div>
                  <span>Equity at 10 years</span>
                  <strong>{formatK(product.equityAt10)}</strong>
                  <small>Illustrative</small>
                </div>
              </div>

              <div className="results-card__risk" role="note">
                <span aria-hidden="true">!</span>
                <p>
                  <strong>Risk to understand</strong>
                  {riskByProduct[product.id] ?? "Review tradeoffs before choosing this option."}
                </p>
              </div>

              <button type="button" className="results-card__link">
                Explain this option
              </button>
            </article>
          );
        })}
      </div>

      {reverseUnavailable && (
        <div className="results-panel__callout" role="note">
          <span aria-hidden="true">i</span>
          <p>
            <strong>Why reverse mortgage is not shown here</strong>
            At your current age, reverse mortgage is excluded from preference matches. It
            remains visible as unavailable in All 7 Options.
          </p>
        </div>
      )}

      <div className="results-panel__footer">
        <h2>See how these options compare</h2>
        <div className="results-panel__actions">
          <button type="button" className="results-panel__secondary" onClick={onRestart}>
            Start over
          </button>
          <button type="button" className="results-panel__primary" onClick={onCompareAll}>
            Compare selected
          </button>
        </div>
      </div>
    </section>
  );
}

export default ResultsPanel;
