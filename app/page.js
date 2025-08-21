"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import './globals.css'

export default function Home() {
  const router = useRouter();

  // ------------------ FORM STATES ------------------
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Loading state added

  // ------------------ HANDLE FORM SUBMIT ------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // ✅ Show loading box

    /**
     * Save user data in localStorage
     */
    localStorage.setItem("quizUser", JSON.stringify({ name, roll, className }));

    // ✅ Small delay so loading box is visible
    setTimeout(() => {
      router.push(`/quiz`);
    }, 1500);
  };

  // ------------------ UI RENDER ------------------
  return (
    <div className="quiz-container">
      <h1 className="quiz-title">Quiz App</h1>

      {/* ✅ Show loading box if loading */}
      {loading ? (
        <div className="loading-box">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      ) : (
        // ------------------ Input Form ------------------
        <form onSubmit={handleSubmit} className="quiz-form">

          {/* Name Input */}
          <input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="quiz-input"
          />

          {/* Roll Number Input */}
          <input
            placeholder="Roll Number"
            value={roll}
            onChange={e => setRoll(e.target.value)}
            required
            className="quiz-input"
            minLength={8}
            maxLength={8}
          />

          {/* Class Dropdown */}
          <select
            value={className}
            onChange={e => setClassName(e.target.value)}
            required
            className="quiz-select"
          >
            <option value="">Select Class</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>

          {/* Submit Button */}
          <button type="submit" className="quiz-button">Start Quiz</button>
        </form>
      )}
    </div>
  );
}
