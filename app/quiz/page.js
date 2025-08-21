"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { quizDataByClass } from "../quizData.js";
import "../quiz/quiz.css";

export default function Quiz() {
    const router = useRouter();

    // ------------------ STATES ------------------
    const [user, setUser] = useState(null);
    const [quizData, setQuizData] = useState([]);
    const [answers, setAnswers] = useState({});
    const [page, setPage] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);

    // ✅ New state → For submit loading
    const [submitting, setSubmitting] = useState(false);

    const QUESTIONS_PER_PAGE = 5;

    // ------------------ QUIZ LOADING ------------------
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("quizUser"));

        if (!userData) {
            alert("No user data found. Redirecting to home.");
            router.push("/");
            return;
        }
        setUser(userData);

        const data = quizDataByClass[userData.className];
        if (!data) {
            alert("Quiz not found for this class.");
            router.push("/");
            return;
        }

        setQuizData(data);
        setLoading(false);
    }, [router]);

    // ------------------ HANDLE CHECKBOX ------------------
    const handleCheckbox = (qIndex, option) => {
        setAnswers((prev) => ({
            ...prev,
            [qIndex]: option
        }));
    };

    // ------------------ NEXT PAGE ------------------
    const handleNext = () => {
        const start = page * QUESTIONS_PER_PAGE;
        const end = start + QUESTIONS_PER_PAGE;
        const currentPageQuestions = quizData.slice(start, end);

        const allAnswered = currentPageQuestions.every(
            (_, idx) => answers[start + idx] !== undefined
        );

        if (!allAnswered) {
            alert("Please answer all questions before proceeding!");
            return;
        }

        setPage((prev) => prev + 1);
    };

    // ------------------ BACK PAGE ------------------
    const handleBack = () => {
        setPage((prev) => prev - 1);
    };

    // ------------------ FINAL SUBMIT ------------------
    const handleSubmit = async () => {
        setSubmitting(true); // ✅ Show loading box when submitting

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
                alert("You have already taken the quiz!");
                router.push("/");
                return;
            }

            await addDoc(collection(db, collectionName), {
                name: user.name,
                rollNumber: user.roll,
                score: finalScore,
            });

            setScore(finalScore);
            setCompleted(true);

            localStorage.removeItem("quizUser");
        } catch (error) {
            console.error("Error submitting quiz:", error);
            alert("Something went wrong while submitting. Try again.");
        } finally {
            setSubmitting(false); // ✅ Hide loading after submission is done
        }
    };

    // ------------------ LOADING QUIZ DATA ------------------
    if (loading) return <p className="quiz-loading">Loading quiz...</p>;

    // ------------------ SUBMITTING LOADING SCREEN ------------------
    if (submitting) {
        return (
            <div className="quiz-loading">
                <p>Submitting your answers... Please wait</p>
            </div>
        );
    }

    // ------------------ RESULT PAGE ------------------
    if (completed) {
        return (
            <div className="quiz-result-container">
                <h2>Quiz Completed!</h2>
                <div className="quiz-result-box">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Class:</strong> {user.className}</p>
                    <p><strong>Roll Number:</strong> {user.roll}</p>
                    <p><strong>Score:</strong> {score}</p>
                    <button onClick={() => router.push("/")} className="quiz-back-button">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // ------------------ QUIZ PAGE ------------------
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
                            {q.options.map((opt, i) => (
                                <label key={i} className="quiz-option">
                                    <input
                                        type="checkbox"
                                        checked={answers[actualIndex] === opt}
                                        onChange={() => handleCheckbox(actualIndex, opt)}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}

            <div className="quiz-navigation">
                {page > 0 && (
                    <button onClick={handleBack} className="quiz-nav-button">
                        Back
                    </button>
                )}
                {end < quizData.length ? (
                    <button onClick={handleNext} className="quiz-nav-button">
                        Next
                    </button>
                ) : (
                    <button onClick={handleSubmit} className="quiz-submit-button">
                        Submit
                    </button>
                )}
            </div>

            <p className="quiz-progress">
                Page {page + 1} of {Math.ceil(quizData.length / QUESTIONS_PER_PAGE)}
            </p>
        </div>
    );
}
