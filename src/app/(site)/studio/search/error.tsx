'use client';

export default function SearchError({ reset }: { reset: () => void }) {
  return (
    <div className="text-center py-24 px-4 animate-fade-in">
      <div className="w-20 h-20 bg-red-50 rounded-2xl mx-auto mb-5 flex items-center justify-center">
        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">שגיאה בטעינת תוצאות החיפוש</h3>
      <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
        ייתכן שאחד ממקורות המודלים אינו זמין כרגע. אפשר לנסות שוב.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        נסו שוב
      </button>
    </div>
  );
}

