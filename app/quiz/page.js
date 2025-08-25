"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { quizDataByClass } from "../quizData.js";
import "../quiz/quiz.css";

export default function Quiz() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [quizData, setQuizData] = useState([]);
    const [answers, setAnswers] = useState({});
    const [page, setPage] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 🔥 Timer states
    const [timeLeft, setTimeLeft] = useState(100); // 5 min = 300 sec
    const [quizStarted, setQuizStarted] = useState(false);

    const QUESTIONS_PER_PAGE = 5;

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("quizUser"));
        if (!userData) { alert("No user found."); router.push("/"); return; }
        setUser(userData);
        const data = quizDataByClass[userData.className];
        if (!data) { alert("Quiz not found."); router.push("/"); return; }
        setQuizData(data);
        setLoading(false);
    }, [router]);

    // 🔥 Timer logic
    useEffect(() => {
        if (!quizStarted || completed) return;

        if (timeLeft <= 0) {
            handleSubmit(); // auto-submit when timer hits 0
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [quizStarted, timeLeft, completed]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleCheckbox = (qIndex, option) => {
        setAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const handleNext = () => {
        const start = page * QUESTIONS_PER_PAGE;
        const end = start + QUESTIONS_PER_PAGE;
        const currentPageQuestions = quizData.slice(start, end);
        const allAnswered = currentPageQuestions.every((_, idx) => answers[start + idx] !== undefined);
        if (!allAnswered) { alert("Answer all questions!"); return; }
        setPage(prev => prev + 1);
    };

    const handleBack = () => setPage(prev => prev - 1);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let finalScore = 0;
            quizData.forEach((q, idx) => {
                if (answers[idx] === q.answer) finalScore++;
            });

            const collectionName = `class${user.className}Results`;
            const qSnap = query(
                collection(db, collectionName),
                where("rollNumber", "==", user.roll)
            );
            const querySnapshot = await getDocs(qSnap);

            if (!querySnapshot.empty) {
                alert("Quiz already taken!");
                router.push("/");
                return;
            }

            const submissionTime = new Date().toLocaleString();

            await addDoc(collection(db, collectionName), {
                name: user.name,
                rollNumber: user.roll,
                score: finalScore,
                submittedAt: submissionTime
            });

            setScore(finalScore);
            setCompleted(true);
            localStorage.removeItem("quizUser");

        } catch (err) {
            console.error(err);
            alert("Error submitting quiz.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="quiz-loading">Loading quiz...</p>;
    if (submitting) return <p className="quiz-loading">Submitting...</p>;

    // ⏰ Start screen
    if (!quizStarted && !completed) {
        return (
            
            <div className="quiz-start-container" style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: "transparent"
            }}>
                
                <button
                    onClick={() => setQuizStarted(true)}
                    className="quiz-start-button"
                    style={{
                        padding: "15px 40px",
                        fontSize: "22px",
                        border: "none",
                        borderRadius: "10px",
                        backgroundColor: "#4CAF50",
                        color: "#fff",
                        cursor: "pointer"
                    }}
                >
                    Start Quiz
                </button>
            </div>
        );
    }

    // ✅ Completed
    if (completed) {
        return (
            <div className="quiz-result-container">
                <h2>Quiz Completed!</h2>
                <div className="quiz-result-box">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Class:</strong> {user.className}</p>
                    <p><strong>Roll Number:</strong> {user.roll}</p>
                    <p><strong>Score:</strong> {score}</p>
                    <button onClick={() => router.push("/")} className="quiz-back-button">Back to Home</button>
                </div>
            </div>
        );
    }

    // ✅ Quiz screen
    const start = page * QUESTIONS_PER_PAGE;
    const end = start + QUESTIONS_PER_PAGE;
    const currentQuestions = quizData.slice(start, end);

    return (
        <div className="quiz-container">
            <h2 className="quiz-title">Class {user.className} Quiz</h2>
            <p className="quiz-timer">⏳ Time Left: {formatTime(timeLeft)}</p>

            {currentQuestions.map((q, idx) => {
                const actualIndex = start + idx;
                return (
                    <div key={actualIndex} className="quiz-question-block">
                        <h3 className="quiz-question">{q.question}</h3>
                        <div className="quiz-options">
                            {q.options.map((opt, i) => {
                                const optionLabel = String.fromCharCode(65 + i);
                                return (
                                    <label key={i} className="quiz-option">
                                        <input
                                            type="checkbox"
                                            checked={answers[actualIndex] === opt}
                                            onChange={() => handleCheckbox(actualIndex, opt)}
                                        />
                                        <span className="option-label">{optionLabel}</span>{opt}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <div className="quiz-navigation">
                {page > 0 && <button onClick={handleBack} className="quiz-nav-button">Back</button>}
                {end < quizData.length
                    ? <button onClick={handleNext} className="quiz-nav-button">Next</button>
                    : <button onClick={handleSubmit} className="quiz-submit-button">Submit</button>}
            </div>

            <p className="quiz-progress">Page {page + 1} of {Math.ceil(quizData.length / QUESTIONS_PER_PAGE)}</p>
        </div>
    );
}
