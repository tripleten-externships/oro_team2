import { formatCurrency, formatSignedCurrency } from "../../utils/homeEquityCalculations.js";
import "./ResultsPanel.css";

const productBadges = ["Best fit", "Strong option", "Alternative"];

function ResultsPanel({ recommendations, allProducts, onRestart, onCompareAll }) {
  const showAll = recommendations && recommendations.length > 0;

  return (
    <section className="results-panel">
      <div className="results-panel__header">
        <p className="results-panel__eyebrow">Recommended for you</p>
        <h1>Your home equity options</h1>
      </div>

      {showAll ? (
        <>
          <div className="results-panel__cards">
            {recommendations.map((product, index) => (
              <article key={product.id} className="results-card">
                <div className="results-card__topline">
                  <span className="results-card__badge">{productBadges[index] ?? "Option"}</span>
                  <span className="results-card__score">Score {product.score}</span>
                </div>

                <h2>{product.name}</h2>
                <p className="results-card__summary">
                  {product.id === "refi" && "Good fit if lowering your monthly payment matters most."}
                  {product.id === "heloc" && "Flexible access to cash while keeping borrowing costs controlled."}
                  {product.id === "heloan" && "Predictable fixed payments with a clear payoff timeline."}
                  {product.id === "reverse" && "Best if you are 62+ and want to keep monthly cash flow flexible."}
                  {product.id === "hei" && "A private capital option when you want cash without a monthly debt payment."}
                  {product.id === "coownership" && "Useful when you want fewer monthly obligations and future equity sharing."}
                  {product.id === "saleLeaseback" && "A short-term liquidity move if you can relocate in the near term."}
                </p>

                <dl className="results-card__metrics">
                  <div>
                    <dt>Monthly impact</dt>
                    <dd>{formatSignedCurrency(product.monthly)}</dd>
                  </div>
                  <div>
                    <dt>Cash available</dt>
                    <dd>{formatCurrency(product.cashNet)}</dd>
                  </div>
                  <div>
                    <dt>10-year cost</dt>
                    <dd>{formatCurrency(product.cost10)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="results-panel__table-wrap">
            <h2>Compare all 7 options</h2>
            <table className="results-panel__table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Monthly</th>
                  <th>Cash</th>
                  <th>10-year cost</th>
                  <th>Equity in 10 years</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.ineligible ? "Unavailable" : formatSignedCurrency(product.monthly)}</td>
                    <td>{product.ineligible ? "Unavailable" : formatCurrency(product.cashNet)}</td>
                    <td>{product.ineligible ? "Unavailable" : formatCurrency(product.cost10)}</td>
                    <td>{product.ineligible ? "Unavailable" : formatCurrency(product.equityAt10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="results-panel__empty">
          <h2>No recommendation data yet.</h2>
          <p>Choose a guided path to see a tailored comparison.</p>
        </div>
      )}

      <div className="results-panel__actions">
        <button type="button" className="results-panel__secondary" onClick={onRestart}>
          Start over
        </button>
        <button type="button" className="results-panel__primary" onClick={onCompareAll}>
          Compare all 7 directly
        </button>
      </div>
    </section>
  );
}

export default ResultsPanel;
