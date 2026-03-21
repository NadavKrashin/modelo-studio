"use client";

import Link from "next/link";
import { CheckCircle2, Package, Printer, Mail } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  { icon: Mail, text: "אישור הזמנה נשלח למייל שלך." },
  { icon: Package, text: "הצוות שלנו מעבד את קבצי ה-3D." },
  { icon: Printer, text: "עדכון יישלח ברגע שהמודל יצא להדפסה." },
];

export default function CheckoutSuccessPage() {
  const [visible, setVisible] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number; size: number; color: string }[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const particles = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      size: Math.random() * 4 + 3,
      color: ["#000", "#334155", "#94a3b8", "#e2e8f0", "#f8fafc"][Math.floor(Math.random() * 5)],
    }));
    setConfetti(particles);
  }, []);

  return (
    <div className="bg-white min-h-screen relative overflow-hidden" dir="rtl">
      {/* Confetti */}
      {confetti.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full opacity-0 animate-confetti pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        {/* Icon */}
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-8 transition-all duration-700 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-600" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1
          className={`text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 transition-all duration-700 delay-150 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          ההזמנה התקבלה בהצלחה!
        </h1>
        <p
          className={`text-base text-slate-500 max-w-md mx-auto leading-relaxed transition-all duration-700 delay-300 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          תודה שבחרת במודלו. אנחנו כבר מתחילים לעבוד על המודל התלת-ממדי שלך.
        </p>

        {/* Order Summary Box */}
        <div
          className={`bg-slate-50 border border-slate-100 rounded-2xl p-8 mt-12 text-right transition-all duration-700 delay-[450ms] ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-slate-400">מספר הזמנה</span>
            <span className="text-lg font-extrabold text-slate-900 tracking-wide" dir="ltr">
              MDL-2026-7742
            </span>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-5">מה קורה עכשיו?</h3>
            <ol className="space-y-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={i} className="flex items-start gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{step.text}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 transition-all duration-700 delay-[600ms] ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Link
            href="/profile"
            className="w-full sm:w-auto rounded-2xl bg-black px-8 py-4 text-base font-bold text-white hover:bg-slate-800 transition-colors"
          >
            מעקב אחר ההזמנה
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto rounded-2xl border-2 border-slate-300 px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            חזרה לחנות
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 0;
            transform: translateY(0) rotate(0deg);
          }
          10% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(92vh) rotate(720deg);
          }
        }
        .animate-confetti {
          animation: confetti-fall 2.8s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
