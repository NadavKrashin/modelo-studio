import React from 'react';
import Link from 'next/link';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            הצהרת נגישות
          </h1>
          <div className="w-24 h-1 bg-black mx-auto rounded-full"></div>
        </div>

        <article className="text-slate-700 leading-relaxed text-lg space-y-10">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">נגישות אתר האינטרנט</h2>
            <p>
              אתר אינטרנט נגיש הוא אתר המאפשר לאנשים עם מוגבלות ולאנשים מבוגרים לגלוש באותה רמה של יעילות והנאה ככל הגולשים. מודלו מאמינה ופועלת למען שוויון הזדמנויות במרחב האינטרנטי לבעלי לקויות מגוונות ואנשים הנעזרים בטכנולוגיה מסייעת לשימוש במחשב.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">מידע על נגישות האתר</h2>
            <ul className="list-disc list-inside space-y-3 pr-4 marker:text-slate-400">
              <li>אתר זה עומד בדרישות תקנות שיוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג 2013.</li>
              <li>התאמות הנגישות בוצעו עפ"י המלצות התקן הישראלי (ת"י 5568) לנגישות תכנים באינטרנט ברמת AA ומסמך WCAG2.0 הבינלאומי.</li>
              <li>הבדיקות נבחנו לתאימות הגבוהה ביותר עבור דפדפן כרום.</li>
              <li>האתר מספק מבנה סמנטי עבור טכנולוגיות מסייעות ותמיכה בדפוס השימוש המקובל להפעלה עם מקלדת בעזרת מקשי החיצים, Enter ו- Esc ליציאה מתפריטים וחלונות.</li>
              <li>מותאם לתצוגה בדפדפנים הנפוצים ולשימוש בטלפון הסלולרי.</li>
              <li>לשם קבלת חווית גלישה מיטבית עם תוכנת הקראת מסך, אנו ממליצים לשימוש בתוכנת NVDA העדכנית ביותר.</li>
              <li>מסמכים או סרטוני וידאו שעלו לאתר לפני אוקטובר 2017 ייתכן שלא נגישים באופן מלא. במידה שנתקלתם במסמך כזה או בסרטון, תוכלו לפנות לרכז הנגישות במודלו ונדאג להנגיש לכם את המידע.</li>
              <li>מסירת מידע בפורמט נגיש – החברה מעמידה עבור לקוחותיה אפשרות לקבלת מידע בפורמטים נגישים. מסירת המידע הינה ללא עלות ומיועדת עבור אנשים עם מוגבלות. לפניות ומידע בנושא נגישות ניתן ליצור קשר עם רכז הנגישות של החברה שפרטיו מופיעים בהמשך ההצהרה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">הסדרי נגישות מבנים</h2>
            <p>מודלו היא חנות אינטרנטית ואין קבלת קהל במשרדיה.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">דרכי פנייה לבקשות והצעות לשיפור בנושא נגישות</h2>
            <p>
              אנו ממשיכים במאמצים לשפר את נגישות האתר כחלק מאמונתנו להעניק שירות איכותי ומקצועי, וכן, במאמצים לשפר את נגישות החברה כחלק ממחויבותנו לאפשר לכלל האוכלוסייה כולל אנשים עם מוגבלויות לקבל את השרות הנגיש ביותר. במידה ונתקלת בבעיה או בתקלה כלשהי בנושא הנגישות, נשמח שתעדכן אותנו בכך ואנו נעשה כל מאמץ למצוא עבורך פתרון מתאים ולטפל בתקלה בהקדם ככל שניתן.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">פניות בנושא נגישות</h2>
            <p>
              לכל פניה בנושא נגישות האתר, הנך מוזמן ליצור קשר עם רכז הנגישות במייל:<br />
              <a href="mailto:modeloo.info@gmail.com" className="text-blue-600 hover:text-blue-800 underline font-medium mt-2 inline-block">
                modeloo.info@gmail.com
              </a>
            </p>
          </section>

          <section className="pt-8 border-t border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">פרסום הצהרת הנגישות</h2>
            <p className="text-slate-500 text-sm">הצהרת הנגישות עודכנה ביום 21.7.2025.</p>
          </section>

        </article>
      </main>
    </div>
  );
}