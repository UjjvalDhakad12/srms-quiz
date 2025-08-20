"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import './globals.css'

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Save form data in localStorage
    localStorage.setItem("quizUser", JSON.stringify({ name, roll, className }));

    router.push(`/quiz`);
  };

  return (
    <div className="quiz-container">
      <h1 className="quiz-title">Quiz App</h1>
      <form onSubmit={handleSubmit} className="quiz-form">
        <input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="quiz-input"
        />
        <input
          placeholder="Roll Number"
          value={roll}
          onChange={e => setRoll(e.target.value)}
          required
          className="quiz-input"
        />
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
        <button type="submit" className="quiz-button">Start Quiz</button>
      </form>
    </div>

  );
}
