import { useEffect, useState } from "react";
import "./App.css";
import Header from "../components/Header/Header.jsx";
import StarterPage from "../components/StarterPage/StarterPage.jsx";
import Questionnaire from "../components/Questionnaire/Questionnaire.jsx";
import ResultsPanel from "../components/ResultsPanel/ResultsPanel.jsx";
import { DEFAULT_INPUTS, getTopRecommendations } from "../utils/homeEquityCalculations.js";

const STORAGE_KEY = "oro-home-equity-explorer";
const emptyAnswers = { goal: "", stay: "", payment: "", priority: "" };
const emptyResults = { recommendations: [], allProducts: [] };

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        screen: "starter",
        answers: emptyAnswers,
        results: emptyResults,
      };
    }

    const stored = JSON.parse(raw);
    return {
      screen: stored?.screen ?? "starter",
      answers: { ...emptyAnswers, ...(stored?.answers ?? {}) },
      results: stored?.results ?? emptyResults,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {
      screen: "starter",
      answers: emptyAnswers,
      results: emptyResults,
    };
  }
};

function App() {
  const initialState = readStoredState();
  const [screen, setScreen] = useState(initialState.screen);
  const [answers, setAnswers] = useState(initialState.answers);
  const [results, setResults] = useState(initialState.results);

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
        }),
      );
    } catch {
      // Ignore storage write failures for unsupported browser environments.
    }
  }, [answers, results, screen]);

  const handleGuidedStart = () => {
    setScreen("questionnaire");
  };

  const handleBack = () => {
    setScreen("starter");
  };

  const handleCompareAll = () => {
    const nextResults = getTopRecommendations(emptyAnswers, DEFAULT_INPUTS);
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
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleComplete = (nextAnswers) => {
    const nextResults = getTopRecommendations(nextAnswers, DEFAULT_INPUTS);
    setAnswers(nextAnswers);
    setResults({
      recommendations: nextResults.recommendations,
      allProducts: nextResults.allProducts,
    });
    setScreen("results");
  };

  return (
    <div className="app">
      <Header />
      <main className="app__content">
        {screen === "starter" && (
          <StarterPage
            onGuidedStart={handleGuidedStart}
            onCompareAll={handleCompareAll}
          />
        )}
        {screen === "questionnaire" && (
          <Questionnaire onComplete={handleComplete} onBack={handleBack} />
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
