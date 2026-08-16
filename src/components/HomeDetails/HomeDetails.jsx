import { useMemo, useState } from "react";
import "./HomeDetails.css";

const fields = [
  {
    id: "homeValue",
    label: "Home value",
    hint: "Estimated market value today.",
    prefix: "$",
  },
  {
    id: "mortgageBalance",
    label: "Mortgage balance",
    hint: "Current principal remaining.",
    prefix: "$",
  },
  {
    id: "currentMortgageRate",
    label: "Current interest rate",
    hint: "Use the rate on your current mortgage.",
    suffix: "%",
  },
  {
    id: "yearsRemaining",
    label: "Years remaining",
    hint: "Whole years are sufficient.",
  },
  {
    id: "cashNeeded",
    label: "Cash needed",
    hint: "Approximate amount you want to access.",
    prefix: "$",
  },
  {
    id: "homeOwnerAge",
    label: "Age",
    hint: "Used for age-based eligibility only.",
  },
];

const toInputState = (values) =>
  Object.fromEntries(fields.map((field) => [field.id, String(values[field.id] ?? "")]));

const getFieldError = (fieldId, rawValue) => {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    return "Enter a number above zero.";
  }
  if (fieldId === "homeOwnerAge" && value < 18) {
    return "Age must be 18 or older.";
  }
  return "";
};

function HomeDetails({ initialValues, onBack, onSubmit }) {
  const [values, setValues] = useState(() => toInputState(initialValues));
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.id, getFieldError(field.id, values[field.id])]),
      ),
    [values],
  );

  const hasErrors = Object.values(errors).some(Boolean);

  const handleChange = (fieldId, nextValue) => {
    setValues((current) => ({ ...current, [fieldId]: nextValue }));
  };

  const handleSubmit = () => {
    setShowErrors(true);
    if (hasErrors) {
      return;
    }

    const parsed = Object.fromEntries(
      fields.map((field) => [field.id, Number(values[field.id])]),
    );
    onSubmit(parsed);
  };

  return (
    <section className="home-details">
      <div className="home-details__top-progress" aria-label="Options progress">
        <div className="home-details__segments">
          <span className="home-details__segment complete" />
          <span className="home-details__segment active" />
          <span className="home-details__segment" />
        </div>
        <div className="home-details__top-meta">
          <p>Your home details</p>
          <span>2 of 3</span>
        </div>
      </div>

      <div className="home-details__layout">
        <article className="home-details__panel">
          <header className="home-details__header">
            <p className="home-details__eyebrow">YOUR HOME DETAILS</p>
            <h1>Add the details needed for estimates</h1>
            <p>
              We will combine these values with your four preference answers. You can edit
              them at any time.
            </p>
          </header>

          <div className="home-details__grid">
            {fields.map((field) => (
              <label key={field.id} className="home-details__field">
                <span className="home-details__label">{field.label}</span>
                <span className="home-details__control">
                  {field.prefix && <span className="home-details__affix">{field.prefix}</span>}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values[field.id]}
                    onChange={(event) => handleChange(field.id, event.target.value)}
                    aria-invalid={showErrors && Boolean(errors[field.id])}
                  />
                  {field.suffix && <span className="home-details__affix">{field.suffix}</span>}
                </span>
                <span className="home-details__hint">{field.hint}</span>
                {showErrors && errors[field.id] && (
                  <span className="home-details__error">{errors[field.id]}</span>
                )}
              </label>
            ))}
          </div>

          <div className="home-details__actions">
            <button type="button" className="home-details__back" onClick={onBack}>
              Back
            </button>
            <button type="button" className="home-details__submit" onClick={handleSubmit}>
              See options to explore
            </button>
          </div>
        </article>

        <aside className="home-details__help">
          <h2>Why these details matter</h2>
          <p>
            Preference answers route the experience. These values produce illustrative
            monthly, cost, and equity estimates.
          </p>

          <div className="home-details__note" role="note">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Private in this session</strong>
              <p>Calculations stay in your browser. No login or storage.</p>
            </div>
          </div>

          <div className="home-details__assumptions">
            <h3>Base assumptions</h3>
            <p>3% annual home appreciation</p>
            <p>Representative illustrative rates</p>
            <p>Product-specific closing costs included</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default HomeDetails;
