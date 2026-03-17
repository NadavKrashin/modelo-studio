import React from 'react';
import { Phone, Mail, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <main className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Right Column: Contact Info & WhatsApp */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            בואו נדבר.
          </h1>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed">
            יש לכם שאלה? רוצים לשתף איתנו פעולה? אנחנו כאן כדי להפוך את הרעיונות שלכם למציאות
            תלת־ממדית.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-slate-100 p-3 rounded-full text-black">
                <Phone size={24} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-medium" dir="ltr">
                055-2745188
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-700">
              <div className="bg-slate-100 p-3 rounded-full text-black">
                <Mail size={24} strokeWidth={1.5} />
              </div>
              <span className="text-xl font-medium">modeloo.info@gmail.com</span>
            </div>

          </div>

          {/* WhatsApp Button */}
          <a
            href="https://wa.me/972552745188"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full md:w-fit bg-[#25D366] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#1ebd57] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <MessageCircle size={24} />
            שילחו לנו הודעה בוואטסאפ
          </a>
        </div>

        {/* Left Column: Business Form */}
        <div className="bg-slate-50 p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">פניות עסקיות (B2B)</h2>
          <p className="text-slate-500 mb-8">מלאו את הפרטים ונחזור אליכם בהקדם האפשרי.</p>

          <form className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">שם מלא</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all bg-white"
                  placeholder="ישראל ישראלי"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">שם חברה / ארגון</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all bg-white"
                  placeholder="מודלו בע״מ"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">אימייל</label>
                <input
                  type="email"
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all bg-white text-left"
                  dir="ltr"
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">טלפון</label>
                <input
                  type="tel"
                  className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all bg-white text-left"
                  dir="ltr"
                  placeholder="050-0000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">תוכן הפנייה</label>
              <textarea
                rows={4}
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-black outline-none transition-all bg-white resize-none"
                placeholder="ספרו לנו על הפרויקט שלכם..."
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-md"
            >
              שליחת פנייה
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
