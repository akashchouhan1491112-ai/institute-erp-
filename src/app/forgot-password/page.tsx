"use client";

import React, { useState } from "react";
import Link from "next/link";
import PublicLayout from "@/components/PublicLayout";
import { KeyRound, Mail, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"REQUEST" | "RESET" | "DONE">("REQUEST");
  const [email, setEmail] = useState("student@vidyavikas.edu.in");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestToken(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REQUEST_TOKEN", email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not generate reset token.");
      } else {
        setResetToken(json.demoResetToken || "");
        setMessage(
          `Verification code generated (${json.demoResetToken}). Enter a new password below.`
        );
        setStep("RESET");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_PASSWORD",
          email,
          resetToken,
          newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Reset failed.");
      } else {
        setMessage(json.message);
        setStep("DONE");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <section className="py-14 max-w-md mx-auto px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-navy-800 text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-navy-900">
                Password Recovery
              </h1>
              <p className="text-xs text-slate-500">
                Reset your Student, Faculty, or Admin password
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              {message}
            </div>
          )}

          {step === "REQUEST" && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold text-sm"
              >
                {loading ? "Generating OTP..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {step === "RESET" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
              >
                {loading ? "Updating..." : "Confirm Password Reset"}
              </button>
            </form>
          )}

          {step === "DONE" && (
            <div className="text-center space-y-4 pt-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <Link
                href="/login"
                className="inline-block w-full py-3 rounded-xl bg-navy-800 text-white font-bold text-sm"
              >
                Return to Sign In
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-navy-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Portal Login
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

