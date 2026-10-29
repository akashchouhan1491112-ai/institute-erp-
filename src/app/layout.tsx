import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "National Institute of Academic Studies | Coaching Institute & ERP Portal",
  description:
    "Academic & Competitive Exam Coaching Institute with integrated Online Admission, Fee Management, Student & Faculty ERP.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

