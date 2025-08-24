"use client";

import { useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import "../admin/admin.css";
import Link from "next/link";

export default function Admin() {
    const [key, setKey] = useState("");
    const [authorized, setAuthorized] = useState(false);

    const [classInput, setClassInput] = useState(""); // ✅ Class input
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false); // ✅ Loading state

    const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY;

    // ------------------ LOGIN ------------------
    const handleLogin = () => {
        if (key === SECRET_KEY) setAuthorized(true);
        else alert("Wrong Key!");
    };

    // ------------------ FETCH RESULTS (By Class) ------------------
    const fetchClassResults = async () => {
        if (!classInput) {
            alert("Please enter a class number!");
            return;
        }

        setLoading(true); // start loader
        setResults([]);   // clear previous data

        try {
            const snap = await getDocs(collection(db, `class${classInput}Results`));
            let classResults = [];
            snap.forEach((doc) => classResults.push({ class: classInput, ...doc.data() }));
            setResults(classResults);
        } catch (error) {
            console.error("Error fetching results:", error);
            alert("Error fetching data!");
        } finally {
            setLoading(false); // stop loader
        }
    };

    // ------------------ DOWNLOAD EXCEL ------------------
    const downloadExcel = () => {
        if (results.length === 0) {
            alert("No data to export!");
            return;
        }
        const ws = XLSX.utils.json_to_sheet(results);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");
        XLSX.writeFile(wb, `class${classInput}_results.xlsx`);
    };

    // ------------------ LOGIN PAGE ------------------
    if (!authorized) {
        return (
            <div className="login-container">
                <h2>Admin Login</h2>
                <input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter Admin Key"
                    className="login-input"
                />
                <button onClick={handleLogin} className="login-btn">
                    Login
                </button>
            </div>
        );
    }

    // ------------------ ADMIN DASHBOARD ------------------
    return (
        <div className="dashboard">
            <h2>Class Wise Results</h2>

            <div className="input-row">
                <input
                    type="number"
                    value={classInput}
                    placeholder="Enter Class Number"
                    className="class-input"
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val >= 1 && val <= 10) {
                            setClassInput(val);
                        }
                    }}
                />
                <button onClick={fetchClassResults} className="fetch-btn">
                    Fetch Results
                </button>
                <Link href="/" className="fetch-btn">
                    Back to home
                </Link>
            </div>

            {loading && <p className="loading-text">Loading results...</p>}

            {results.length > 0 && (
                <>
                    <button onClick={downloadExcel} className="download-btn">
                        Download Excel
                    </button>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Name</th>
                                <th>Roll Number</th>
                                <th>Score</th>
                                <th>Submitted At</th> {/* ✅ Added */}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((res, idx) => (
                                <tr key={idx}>
                                    <td>{res.class}</td>
                                    <td>{res.name}</td>
                                    <td>{res.rollNumber}</td>
                                    <td>{res.score}</td>
                                    <td>{res.submittedAt || "N/A"}</td> {/* ✅ Added */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
