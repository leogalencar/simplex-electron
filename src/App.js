import "./App.css";

import { useState } from "react";

import { Container } from "react-bootstrap";
import SimplexForm from "./Components/SimplexForm";
import Result from "./Components/Result";
import Footer from "./Components/Footer";

function App() {
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState([]);
    const [answer, setAnswer] = useState([]);
    const [error, setError] = useState("");

    const version = "1.0.0";

    function getSimplexResults([tables, ans, error, forceShowTables=0]) {
        if (tables === null || ans === null) {
            setError(error);
            
            if (!forceShowTables) {
                return;
            }

            setResult(tables);
            setAnswer(ans);
            setShowResult(true);
            
            return;
        }

        setError("");
        setResult(tables);
        setAnswer(ans);
        setShowResult(true);
    }

    function handleClear() {
        setShowResult(false);
        setResult([]);
        setAnswer([]);
        setError("");
    }

    return (
        <div className="page-container">
            <Container className="mt-5 px-3 pt-3 bg-dark text-light content-wrap">
                <SimplexForm
                getSimplexResults={getSimplexResults}
                handleClear={handleClear}
                error={error}
                />
                {showResult && <Result tables={result} answer={answer}></Result>}
            </Container>
            <Footer version={version}></Footer>
        </div>
    );
}

export default App;

