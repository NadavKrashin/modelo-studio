import Link from 'next/link';

interface Props {
  searchParams: Promise<{ orderNumber?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNumber = params.orderNumber ?? 'MDL-0000';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center animate-fade-in">
      {/* Success animation */}
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 bg-success/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        <div className="relative w-24 h-24 bg-success/10 rounded-full flex items-center justify-center animate-scale-in">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-lg shadow-success/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">ההזמנה התקבלה!</h1>
      <p className="text-muted text-base mb-8">תודה שבחרתם ב-Modelo. נתחיל לטפל בהזמנה שלכם בהקדם.</p>

      {/* Order Number Card */}
      <div className="bg-white rounded-2xl border border-border/80 p-6 md:p-8 mb-8 max-w-sm mx-auto shadow-sm">
        <p className="text-xs text-muted font-medium mb-2">מספר הזמנה</p>
        <p className="text-3xl font-extrabold text-primary tracking-wide" dir="ltr">
          {orderNumber}
        </p>
        <div className="border-t border-border mt-4 pt-4">
          <p className="text-xs text-muted leading-relaxed">
            שמרו את מספר ההזמנה — תוכלו להשתמש בו למעקב בכל עת
          </p>
        </div>
      </div>

      {/* What's next */}
      <div className="bg-muted-bg/60 rounded-2xl p-5 mb-8 text-start max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-foreground mb-3">מה עכשיו?</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justifyCenter mt-0.5 shrink-0">
              1
            </span>
            <span>ההזמנה נבדקת ומאושרת על ידי הצוות</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary/60 text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5 shrink-0">
              2
            </span>
            <span>המודל מודפס באיכות גבוהה</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary/30 text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5 shrink-0">
              3
            </span>
            <span>ההזמנה נשלחת אליכם או מוכנה לאיסוף</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/studio/order/track?orderNumber=${orderNumber}`}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-2xl font-semibold transition-all shadow-lg shadow-primary/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
          מעקב הזמנה
        </Link>
        <Link
          href="/studio"
          className="inline-flex items-center justify-center gap-2 bg-white border border-border hover:bg-muted-bg text-foreground px-7 py-3.5 rounded-2xl font-semibold transition-all"
        >
          חזרה ל-Studio
        </Link>
      </div>
    </div>
  );
}

