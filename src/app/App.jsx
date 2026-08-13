import { useEffect, useState } from "react";
import "./App.css";
import { OroAppHeader } from "../components/oro-app-header";
import StarterPage from "../components/StarterPage/StarterPage.jsx";
import Questionnaire from "../components/Questionnaire/Questionnaire.jsx";
import HomeDetails from "../components/HomeDetails/HomeDetails.jsx";
import ResultsPanel from "../components/ResultsPanel/ResultsPanel.jsx";
import {
  DEFAULT_INPUTS,
  getTopRecommendations,
} from "../utils/homeEquityCalculations.js";

const STORAGE_KEY = "oro-home-equity-explorer";
const emptyAnswers = { goal: "", stay: "", payment: "", priority: "" };
const emptyResults = { recommendations: [], allProducts: [] };
const defaultInputs = { ...DEFAULT_INPUTS };

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        screen: "starter",
        answers: emptyAnswers,
        results: emptyResults,
        inputs: defaultInputs,
      };
    }

    const stored = JSON.parse(raw);
    return {
      screen: stored?.screen ?? "starter",
      answers: { ...emptyAnswers, ...(stored?.answers ?? {}) },
      results: stored?.results ?? emptyResults,
      inputs: { ...defaultInputs, ...(stored?.inputs ?? {}) },
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {
      screen: "starter",
      answers: emptyAnswers,
      results: emptyResults,
      inputs: defaultInputs,
    };
  }
};

function App() {
  const initialState = readStoredState();
  const [screen, setScreen] = useState(initialState.screen);
  const [answers, setAnswers] = useState(initialState.answers);
  const [results, setResults] = useState(initialState.results);
  const [inputs, setInputs] = useState(initialState.inputs);

  useEffect(() => {
    if (screen === "starter") {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          screen,
          answers,
          results,
          inputs,
        }),
      );
    } catch {
      // Ignore storage write failures for unsupported browser environments.
    }
  }, [answers, inputs, results, screen]);

  const handleGuidedStart = () => {
    setScreen("questionnaire");
  };

  const handleBack = () => {
    setScreen("starter");
  };

  const handleCompareAll = () => {
    const nextResults = getTopRecommendations(emptyAnswers, inputs);
    setResults({
      recommendations: nextResults.allProducts.slice(0, 3),
      allProducts: nextResults.allProducts,
    });
    setScreen("results");
  };

  const handleRestart = () => {
    setScreen("starter");
    setAnswers(emptyAnswers);
    setResults({ recommendations: [], allProducts: [] });
    setInputs(defaultInputs);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleQuestionsComplete = (nextAnswers) => {
    setAnswers(nextAnswers);
    setScreen("homeDetails");
  };

  const handleHomeDetailsBack = () => {
    setScreen("questionnaire");
  };

  const handleHomeDetailsComplete = (nextInputs) => {
    const nextResults = getTopRecommendations(answers, nextInputs);
    setInputs(nextInputs);
    setResults({
      recommendations: nextResults.recommendations,
      allProducts: nextResults.allProducts,
    });
    setScreen("results");
  };

  return (
    <div className="app">
      <OroAppHeader
        productLabel="Home equity explorer"
        notice="Illustrative estimates · Educational only · Inputs stay on this device"
      />
      <main className="app__content">
        {screen === "starter" && (
          <StarterPage
            onGuidedStart={handleGuidedStart}
            onCompareAll={handleCompareAll}
          />
        )}
        {screen === "questionnaire" && (
          <Questionnaire onComplete={handleQuestionsComplete} onBack={handleBack} />
        )}
        {screen === "homeDetails" && (
          <HomeDetails
            initialValues={inputs}
            onBack={handleHomeDetailsBack}
            onSubmit={handleHomeDetailsComplete}
          />
        )}
        {screen === "results" && (
          <ResultsPanel
            recommendations={results.recommendations}
            allProducts={results.allProducts}
            onRestart={handleRestart}
            onCompareAll={handleCompareAll}
          />
        )}
      </main>
    </div>
  );
}

export default App;
