"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Search,
  UserCheck,
  MessageCircle,
} from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
  settings?: any;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/courses", label: "Courses" },
  { href: "/admissions", label: "Admissions" },
  { href: "/results", label: "Results" },
  { href: "/faculty", label: "Faculty" },
  { href: "/gallery", label: "Gallery" },
  { href: "/news", label: "News & Events" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

export default function PublicLayout({ children, settings }: PublicLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const instituteName =
    settings?.instituteName || "National Institute of Academic Studies";
  const tagline =
    settings?.tagline || "Academic Coaching & Institute Management Portal";
  const phone = settings?.phone || "+91 11 2650 0000";
  const whatsapp = settings?.whatsapp || "911126500000";
  const email = settings?.email || "office@institute.edu.in";
  const address =
    settings?.address ||
    "Academic Block, Institutional Area, New Delhi - 110016";
  const session = settings?.academicSession || "2026-2027";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Utility Bar */}
      <div className="bg-navy-800 text-slate-200 text-xs border-b border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Academic Session {session}
            </span>
            <a
              href={`tel:${phone}`}
              className="hidden sm:inline-flex items-center gap-1 hover:text-white transition"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="hidden md:inline-flex items-center gap-1 hover:text-white transition"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              {email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/track"
              className="inline-flex items-center gap-1 text-blue-200 hover:text-white font-semibold transition"
            >
              <Search className="w-3.5 h-3.5" />
              Track Application
            </Link>
            <span className="text-navy-600">|</span>
            <Link
              href="/student"
              className="hover:text-white font-medium transition"
            >
              Student Portal
            </Link>
            <span className="text-navy-600">|</span>
            <Link
              href="/teacher"
              className="hover:text-white font-medium transition"
            >
              Faculty Portal
            </Link>
            <span className="text-navy-600">|</span>
            <Link
              href="/admin"
              className="text-blue-200 hover:text-white font-semibold transition"
            >
              Administration
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-navy-800 text-white flex items-center justify-center shadow-sm group-hover:bg-royal-600 transition">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-base sm:text-lg font-bold text-navy-900 tracking-tight leading-none">
                {instituteName}
              </span>
              <span className="block text-[11px] font-medium text-slate-500 mt-1">
                {tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    active
                      ? "bg-blue-50 text-royal-600"
                      : "text-slate-700 hover:text-navy-900 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTA Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:border-navy-700 hover:text-navy-900 text-xs font-semibold transition"
            >
              <UserCheck className="w-4 h-4 text-royal-600" />
              Portal Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-royal-600 text-white text-xs font-semibold shadow-sm transition"
            >
              Apply Online
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="xl:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-5 space-y-2 shadow-xl">
            <div className="grid grid-cols-2 gap-1.5">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-royal-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 rounded-xl bg-navy-800 text-white text-xs font-semibold"
              >
                Online Registration
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-semibold"
              >
                Portal Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-navy-900 text-slate-300 pt-14 pb-10 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-navy-800">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-royal-600 text-white flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">
                  {instituteName}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tagline}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                GSTIN: {settings?.gstNumber || "07AAACN0000A1Z5"}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Academic Links
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    About the Institute
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="hover:text-white transition">
                    Academic Courses
                  </Link>
                </li>
                <li>
                  <Link href="/admissions" className="hover:text-white transition">
                    Admission Process & Eligibility
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition">
                    Online Student Registration
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="hover:text-white transition">
                    Application Status Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/faculty" className="hover:text-white transition">
                    Faculty Directory
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Portals & Compliance
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/admin" className="hover:text-white transition">
                    Administration ERP Portal
                  </Link>
                </li>
                <li>
                  <Link href="/student" className="hover:text-white transition">
                    Student & Parent Portal
                  </Link>
                </li>
                <li>
                  <Link href="/teacher" className="hover:text-white transition">
                    Faculty Portal
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="hover:text-white transition">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Contact Information
              </h4>
              <p className="flex items-start gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </p>
              <p className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{phone}</span>
              </p>
              <p className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{email}</span>
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} {instituteName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
              <Link href="/refund-policy" className="hover:text-white">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Enquiry Button */}
      <a
        href={`https://wa.me/${whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="no-print fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-3 rounded-full shadow-lg transition"
        aria-label="WhatsApp Enquiry"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp Enquiry</span>
      </a>
    </div>
  );
}
