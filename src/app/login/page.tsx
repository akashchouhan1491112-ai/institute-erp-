"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PublicLayout from "@/components/PublicLayout";
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  GraduationCap,
  Users,
  BookOpen,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Invalid credentials.");
      } else {
        const userRole = json.user?.role;
        if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "TEACHER") {
          router.push("/teacher");
        } else {
          router.push("/student");
        }
      }
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <section className="py-12 lg:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Sign In Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-navy-800 text-white flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-royal-600">
                  Institutional Authentication
                </span>
                <h1 className="text-xl font-bold text-navy-900">
                  ERP Portal Sign In
                </h1>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institute.edu.in"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-royal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-royal-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-royal-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-navy-800 hover:bg-royal-600 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Applying for new admission?</span>
              <Link
                href="/register"
                className="font-bold text-royal-600 hover:underline"
              >
                Online Registration Form →
              </Link>
            </div>
          </div>

          {/* Institutional Portal Guide */}
          <div className="lg:col-span-6 bg-navy-900 text-white rounded-2xl p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Role-Based Access Control
              </div>
              <h2 className="text-xl font-bold">
                Unified Academic & Administration Portal
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign in with your institutional credentials. You will be
                automatically directed to your authorized portal based on your
                assigned role.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <GraduationCap className="w-4 h-4 text-blue-400" />
                    Student & Parent Portal
                  </div>
                  <p className="text-slate-300">
                    Access class timetables, attendance records, study materials,
                    fee installment payments, GST receipts, and examination
                    marksheets.
                  </p>
                </div>

                <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Faculty Portal
                  </div>
                  <p className="text-slate-300">
                    Manage assigned batches, mark daily student attendance,
                    upload study materials, assign homework, and publish
                    examination marks.
                  </p>
                </div>

                <div className="bg-navy-800 border border-navy-700 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Users className="w-4 h-4 text-blue-400" />
                    Administration & Accounts ERP
                  </div>
                  <p className="text-slate-300">
                    Manage registrations, admissions, courses, batches, fee
                    structures, offline payment verification, reports, and
                    website content.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-navy-800 pt-4">
              Protected by HTTP-only encrypted session tokens and server-side
              role authorization.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
