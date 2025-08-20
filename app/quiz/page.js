"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { quizDataByClass } from "../quizData.js"; // Import questions
import '../quiz/quiz.css'

export default function Quiz() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [quizData, setQuizData] = useState([]);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false); // New state for showing result

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

    const handleAnswer = async (option) => {
        // 1️⃣ Score calculate in a variable
        let newScore = score;
        if (option === quizData[current].answer) newScore++;

        // 2️⃣ Move to next question or finish quiz
        if (current < quizData.length - 1) {
            setCurrent(current + 1);
            setScore(newScore); // optional: UI update ke liye
        } else {
            // 3️⃣ Firebase collection per class
            const collectionName = `class${user.className}Results`;

            // 4️⃣ Duplicate roll number check
            const q = query(collection(db, collectionName), where("rollNumber", "==", user.roll));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert("You have already taken the quiz for this class!");
                router.push("/");
                return;
            }

            // 5️⃣ Save correct score
            await addDoc(collection(db, collectionName), {
                name: user.name,
                rollNumber: user.roll,
                score: newScore,
            });

            // 6️⃣ Show result section
            setScore(newScore); // final UI update
            setCompleted(true);
            localStorage.removeItem("quizUser");
        }
    };


    if (loading) return <p className="quiz-loading">Loading quiz...</p>;

    // Result section after quiz is completed
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

    return (
        <div className="quiz-container">
            <h2 className="quiz-title">Class {user.className} Quiz</h2>
            <h3 className="quiz-question">{quizData[current].question}</h3>
            <div className="quiz-options">
                {quizData[current].options.map((opt, idx) => (
                    <button key={idx} onClick={() => handleAnswer(opt)} className="quiz-option">
                        {opt}
                    </button>
                ))}
            </div>
            <p className="quiz-progress">Question {current + 1} of {quizData.length}</p>
        </div>
    );
}
