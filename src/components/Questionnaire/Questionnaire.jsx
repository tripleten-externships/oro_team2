import { useMemo, useState } from "react";
import "./Questionnaire.css";

const questionConfig = [
  {
    id: "goal",
    title: "What is your main goal?",
    options: [
      { value: "lump", label: "Access a lump sum of cash" },
      { value: "income", label: "Create extra monthly income" },
      { value: "lower", label: "Lower my monthly payment" },
      { value: "faster", label: "Pay off my mortgage faster" },
    ],
  },
  {
    id: "stay",
    title: "How long do you plan to stay in your home?",
    options: [
      { value: "yes", label: "At least 10+ years" },
      { value: "prob", label: "Likely 5-10 years" },
      { value: "open", label: "I may move in the next few years" },
      { value: "soon", label: "I plan to move soon" },
    ],
  },
  {
    id: "payment",
    title: "Can you comfortably handle an added payment?",
    options: [
      { value: "yes", label: "Yes, a regular payment is fine" },
      { value: "min", label: "Only if it is small" },
      { value: "no", label: "No, I need to avoid extra monthly costs" },
    ],
  },
  {
    id: "priority",
    title: "Which priority matters most?",
    options: [
      { value: "cost", label: "Lowest total cost" },
      { value: "cash", label: "Maximum cash today" },
      { value: "equity", label: "Strongest long-term equity" },
      { value: "simple", label: "Simplest option" },
    ],
  },
];

const emptyAnswers = {
  goal: "",
  stay: "",
  payment: "",
  priority: "",
};

function Questionnaire({ onComplete, onBack }) {
  const [answers, setAnswers] = useState(emptyAnswers);

  const completedCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );

  const isComplete = completedCount === questionConfig.length;

  const handleChange = (questionId, value) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    if (!isComplete) {
      return;
    }

    onComplete(answers);
  };

  return (
    <section className="questionnaire">
      <div className="questionnaire__header">
        <p className="questionnaire__eyebrow">Step 1 of 2</p>
        <h1>Tell us what matters most</h1>
      </div>

      <div className="questionnaire__progress" aria-label="Questionnaire progress">
        <span>{completedCount} of {questionConfig.length} answered</span>
      </div>

      <div className="questionnaire__stack">
        {questionConfig.map((question) => (
          <fieldset key={question.id} className="questionnaire__group">
            <legend>{question.title}</legend>
            <div className="questionnaire__options">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.value;

                return (
                  <label
                    key={option.value}
                    className={`questionnaire__option ${isSelected ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => handleChange(question.id, option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="questionnaire__actions">
        <button type="button" className="questionnaire__secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="questionnaire__primary"
          disabled={!isComplete}
          onClick={handleSubmit}
        >
          See my options
        </button>
      </div>
    </section>
  );
}

export default Questionnaire;
