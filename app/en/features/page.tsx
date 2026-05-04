import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Mail, Archive, Smartphone, Shield, Zap, Clock, FileCheck, Users, BarChart } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Features",
  description:
    "One click to send an invoice, unlimited photographs, archive with preview, real-time status, secure Clerk authentication. Everything you need for fast bookkeeping.",
  slug: "funkcionalnosti",
  locale: "en",
});

const features = [
  { Icon: Camera,    color: "blue",    title: "📷 One tap — invoice sent",         desc: "Photograph a paper invoice and tap Send. No typing, no file shuffling. The whole process takes under 5 seconds. The app is mobile-optimised for extremely fast capture and delivery." },
  { Icon: Mail,      color: "green",   title: "📧 Forwarded to your program",      desc: "The app delivers the photo to the email address assigned by your accounting program. OCR is performed by the program — Minimax, Birokrat, Pantheon and others. Data flows automatically into your system, no manual entry." },
  { Icon: Archive,   color: "purple",  title: "📋 Archive of every send",          desc: "All sent invoices are saved with date, delivery status and preview. Verify any time whether an invoice was sent. The history is kept indefinitely and is searchable." },
  { Icon: Smartphone, color: "orange", title: "Mobile-optimised",                   desc: "Built for phones. Simple UI, fast camera, instant send — everything you need to work efficiently on site or in the office." },
  { Icon: Shield,    color: "teal",    title: "Secure authentication",              desc: "Access is protected by Clerk authentication — a modern identity-management system. Your data is secure and accessible only to you." },
  { Icon: Zap,       color: "pink",    title: "Instant delivery",                   desc: "Real-time send status. See immediately when an invoice was sent and delivered to your accounting program. No waiting, no doubts." },
  { Icon: FileCheck, color: "indigo",  title: "Every format supported",             desc: "JPG, PNG, WEBP and PDF supported. However you photograph or receive an invoice, you can forward it for processing." },
  { Icon: Clock,     color: "yellow",  title: "Time saved",                         desc: "Replace minutes of typing with one click. Save up to 80 % of the time you spend on invoice entry. Focus on important work — let the app handle the routine." },
  { Icon: Users,     color: "cyan",    title: "Multi-company management (PRO)",     desc: "The PRO plan supports unlimited companies in one account. Quick switching between companies, separate OCR email per company and a per-company archive." },
  { Icon: BarChart,  color: "emerald", title: "Unlimited storage",                  desc: "The full history of sent invoices is stored without time or quantity limits. You always have access to your data and can review it at any time." },
];

const colorClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  teal: "bg-teal-100 text-teal-600",
  pink: "bg-pink-100 text-pink-600",
  indigo: "bg-indigo-100 text-indigo-600",
  yellow: "bg-yellow-100 text-yellow-600",
  cyan: "bg-cyan-100 text-cyan-600",
  emerald: "bg-emerald-100 text-emerald-600",
};

export default function Features() {
  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">Features</Badge>
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-6 font-bold">
            Everything you need to manage invoices
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Powerful features that simplify your workflow and save valuable time
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <Card key={f.title} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[f.color]}`}>
                  <f.Icon className="w-6 h-6" />
                </div>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription className="mt-3">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
