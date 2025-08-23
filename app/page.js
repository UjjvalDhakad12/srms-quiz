"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import './globals.css'
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("quizUser", JSON.stringify({ name, roll, className }));
    router.push(`/quiz`);
  };

  return (
    <>
      <div className="bg-purple-100 text-end p-8">
        <Link href="/admin"  className="font-bold text-red-500 text-2xl">Admin</Link>
      </div>
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
            minLength={8}
            maxLength={8}
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
    </>
  );
}
