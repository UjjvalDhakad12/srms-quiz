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
            quizData.forEach((q, idx) => { if (answers[idx] === q.answer) finalScore++; });
            const collectionName = `class${user.className}Results`;
            const qSnap = query(collection(db, collectionName), where("rollNumber", "==", user.roll));
            const querySnapshot = await getDocs(qSnap);
            if (!querySnapshot.empty) { alert("Quiz already taken!"); router.push("/"); return; }
            await addDoc(collection(db, collectionName), { name: user.name, rollNumber: user.roll, score: finalScore });
            setScore(finalScore);
            setCompleted(true);
            localStorage.removeItem("quizUser");
        } catch (err) {
            console.error(err); alert("Error submitting quiz.");
        } finally { setSubmitting(false); }
    };

    if (loading) return <p className="quiz-loading">Loading quiz...</p>;
    if (submitting) return <p className="quiz-loading">Submitting...</p>;
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

    const start = page * QUESTIONS_PER_PAGE;
    const end = start + QUESTIONS_PER_PAGE;
    const currentQuestions = quizData.slice(start, end);

    return (
        <div className="quiz-container">
            <h2 className="quiz-title">Class {user.className} Quiz</h2>
            {currentQuestions.map((q, idx) => {
                const actualIndex = start + idx;
                return (
                    <div key={actualIndex} className="quiz-question-block">
                        <h3 className="quiz-question">{q.question}</h3>
                        <div className="quiz-options">
                            {q.options.map((opt, i) => {
                                const optionLabel = String.fromCharCode(65 + i); // 65 = "A"
                                return (
                                    <label key={i} className="quiz-option">
                                        <input
                                            type="checkbox"
                                            checked={answers[actualIndex] === opt}
                                            onChange={() => handleCheckbox(actualIndex, opt)}
                                        />
                                        <span className="option-label">{optionLabel}.</span>{opt}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            <div className="quiz-navigation">
                {page > 0 && <button onClick={handleBack} className="quiz-nav-button">Back</button>}
                {end < quizData.length ? <button onClick={handleNext} className="quiz-nav-button">Next</button> : <button onClick={handleSubmit} className="quiz-submit-button">Submit</button>}
            </div>
            <p className="quiz-progress">Page {page + 1} of {Math.ceil(quizData.length / QUESTIONS_PER_PAGE)}</p>
        </div>
    );
}
