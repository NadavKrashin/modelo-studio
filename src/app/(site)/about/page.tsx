import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <main className="max-w-4xl mx-auto px-4 py-20 md:py-32">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            אז מה זה מודלו בעצם
          </h1>
          <div className="w-16 h-1 bg-black mx-auto rounded-full"></div>
        </div>

        {/* Content Section */}
        <article className="text-slate-700 text-lg md:text-xl leading-relaxed space-y-8 text-center font-medium">
          <p>
            <strong className="text-black font-extrabold">מודלו - Modelo</strong> נולדה מתוך רעיון פשוט אך
            עוצמתי : להפוך רגעים משמעותיים לחוויות מוחשיות, מתנות עם ערך אישי שמנציחות זיכרונות
            ורגשות.
          </p>

          <p>
            החלטנו לקחת את הקסם הזה צעד קדימה – ויצרנו דרך חדשנית להחיות רגעים ולהפוך אותם למשהו
            שניתן להחזיק, לראות ולהרגיש.
          </p>

          <p>
            במודלו, אנחנו משלבים טכנולוגית AI מתקדמת, טכנולוגיות עיבוד תמונה והדפסה תלת-ממדית, כדי
            ליצור דמויות תלת-ממדיות מדויקות ואישיות.
            <br />
            כל מודל הוא לא סתם חפץ – הוא תוצאה של חיבור בין יצירתיות, טכנולוגיה וזיכרון, שמעניק חיים
            חדשים לרגעים החשובים ביותר.
          </p>

          {/* Highlighted Conclusion */}
          <div className="pt-12 mt-12 border-t border-slate-100">
            <p className="font-extrabold text-2xl md:text-3xl text-black leading-snug">
              המטרה שלנו היא פשוטה אך עוצמתית:
              <br />
              <span className="text-slate-500 font-medium text-xl md:text-2xl mt-4 block">
                לתת חיים לרגעים, להפוך זיכרונות לסיפור מוחשי, חווייתי ובלתי נשכח, שנשאר איתכם לנצח.
              </span>
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

