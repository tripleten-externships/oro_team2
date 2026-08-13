import { useMemo, useState } from "react";
import "./Questionnaire.css";

const steps = [
  {
    questionNumber: "QUESTION 1 OF 4",
    title: "What are you trying to accomplish?",
    description: "Choose the outcome that is closest to what you need right now.",
    fields: [
      {
        id: "goal",
        options: [
          {
            value: "lump",
            label: "Receive a lump sum",
            hint: "Access cash for one-time needs or expenses.",
          },
          {
            value: "income",
            label: "Create monthly income",
            hint: "Supplement ongoing income from home equity.",
          },
          {
            value: "lower",
            label: "Lower my monthly payment",
            hint: "Reduce the amount leaving your budget each month.",
          },
          {
            value: "faster",
            label: "Pay off my mortgage faster",
            hint: "Prioritize becoming mortgage-free sooner.",
          },
        ],
      },
    ],
  },
  {
    questionNumber: "QUESTION 2 OF 4",
    title: "How long do you plan to stay in your home?",
    description: "This helps us prioritize options that fit your timeline.",
    fields: [
      {
        id: "stay",
        options: [
          { value: "yes", label: "At least 10+ years" },
          { value: "prob", label: "Likely 5-10 years" },
          { value: "open", label: "I may move in the next few years" },
          { value: "soon", label: "I plan to move soon" },
        ],
      },
    ],
  },
  {
    questionNumber: "QUESTION 3-4 OF 4",
    title: "Payment comfort and priorities",
    description: "One last step so we can rank your options clearly.",
    fields: [
      {
        id: "payment",
        label: "Can you comfortably handle an added payment?",
        options: [
          { value: "yes", label: "Yes, a regular payment is fine" },
          { value: "min", label: "Only if it is small" },
          { value: "no", label: "No, I need to avoid extra monthly costs" },
        ],
      },
      {
        id: "priority",
        label: "Which priority matters most?",
        options: [
          { value: "cost", label: "Lowest total cost" },
          { value: "cash", label: "Maximum cash today" },
          { value: "equity", label: "Strongest long-term equity" },
          { value: "simple", label: "Simplest option" },
        ],
      },
    ],
  },
];

const emptyAnswers = { goal: "", stay: "", payment: "", priority: "" };

function Questionnaire({ onComplete, onBack }) {
  const [answers, setAnswers] = useState(emptyAnswers);
  const [currentStep, setCurrentStep] = useState(0);

  const stepData = steps[currentStep];
  const isStepComplete = useMemo(
    () => stepData.fields.every((field) => Boolean(answers[field.id])),
    [answers, stepData.fields],
  );

  const handleChange = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleBack = () => {
    if (currentStep === 0) {
      onBack();
      return;
    }
    setCurrentStep((index) => index - 1);
  };

  const handleContinue = () => {
    if (!isStepComplete) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((index) => index + 1);
      return;
    }

    onComplete(answers);
  };

  return (
    <section className="questionnaire">
      <div className="questionnaire__top-progress" aria-label="Options progress">
        <div className="questionnaire__segments">
          {steps.map((_, index) => (
            <span
              key={`segment-${index}`}
              className={`questionnaire__segment ${index <= currentStep ? "active" : ""}`}
            />
          ))}
        </div>
        <div className="questionnaire__top-meta">
          <p>Options to explore</p>
          <span>{currentStep + 1} of 3</span>
        </div>
      </div>

      <div className="questionnaire__layout">
        <article className="questionnaire__panel">
          <header className="questionnaire__header">
            <p className="questionnaire__eyebrow">{stepData.questionNumber}</p>
            <h1>{stepData.title}</h1>
            <p className="questionnaire__description">{stepData.description}</p>
          </header>

          <div className="questionnaire__stack">
            {stepData.fields.map((field) => (
              <fieldset key={field.id} className="questionnaire__group">
                {field.label && <legend>{field.label}</legend>}
                <div className="questionnaire__options">
                  {field.options.map((option) => {
                    const isSelected = answers[field.id] === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`questionnaire__option ${isSelected ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={field.id}
                          value={option.value}
                          checked={isSelected}
                          onChange={() => handleChange(field.id, option.value)}
                        />
                        <span className="questionnaire__option-mark" aria-hidden="true" />
                        <span className="questionnaire__option-content">
                          <strong>{option.label}</strong>
                          {option.hint && <small>{option.hint}</small>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="questionnaire__actions">
            <button type="button" className="questionnaire__back" onClick={handleBack}>
              Back
            </button>
            <button
              type="button"
              className="questionnaire__continue"
              disabled={!isStepComplete}
              onClick={handleContinue}
            >
              {currentStep === steps.length - 1 ? "See my options" : "Continue"}
            </button>
          </div>
        </article>

        <aside className="questionnaire__help-panel" aria-label="Why we ask">
          <h2>Why we ask</h2>
          <p>
            Your answers guide fit scoring. They do not change your financial calculations.
          </p>
          <div className="questionnaire__help-note" role="note">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Scoring, not advice</strong>
              <p>
                Answers guide recommendation ranking; eligibility and home details are
                evaluated separately.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Questionnaire;
