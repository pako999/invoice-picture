"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, HelpCircle } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("sent");
      } else {
        setError(json.error ?? "Failed to send.");
        setStatus("error");
      }
    } catch {
      setError("Failed to send. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Contact</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">Get in touch</h1>
          <p className="text-xl text-slate-600">
            We&rsquo;re here to help. Reach us through any of the channels below.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-slate-200 text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Email support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Write to us at</p>
              <a href="mailto:info@posljiracun.si" className="text-blue-600 hover:underline font-medium">
                info@posljiracun.si
              </a>
              <p className="text-xs text-slate-500 mt-3">We reply within 24 hours</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Phone support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Call us</p>
              <a href="tel:+38641580250" className="text-blue-600 hover:underline font-medium">
                +386 41 580 250
              </a>
              <p className="text-xs text-slate-500 mt-3">Mon – Fri, 9:00 – 17:00</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Help &amp; FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">Browse common questions</p>
              <Link href="/en/faq" className="text-blue-600 hover:underline font-medium">
                Open FAQ
              </Link>
              <p className="text-xs text-slate-500 mt-3">Instant answers</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Send us a message</CardTitle>
          </CardHeader>
          <CardContent>
            {status === "sent" ? (
              <div className="text-center py-12 flex flex-col items-center gap-5">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                  ✅
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Message sent!</h2>
                <p className="text-slate-500">We&rsquo;ll reply within one business day.</p>
                <Link href="/en" className="mt-2 text-blue-600 font-semibold hover:underline text-sm">
                  ← Back to home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      minLength={2}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your company"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Question about the app"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                    Message * <span className="text-slate-400 font-normal">(at least 10 characters)</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    minLength={10}
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your question or issue..."
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "📨 Send message"
                  )}
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200">
          <h2 className="text-2xl mb-4 text-center font-semibold">Business support</h2>
          <p className="text-slate-700 text-center mb-6">
            For accounting firms and larger businesses we provide individual support and tailored solutions.
          </p>
          <div className="text-center">
            <a
              href="mailto:info@posljiracun.si"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact business support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
