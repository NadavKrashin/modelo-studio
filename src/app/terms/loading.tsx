export default function TermsLoading() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16 animate-pulse">
          <div className="mx-auto mb-4 h-10 w-64 rounded-lg bg-slate-200 md:h-12 md:w-80" />
          <div className="mx-auto h-1 w-24 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-slate-100" style={{ width: `${70 + (i % 5) * 5}%` }} />
          ))}
        </div>
      </main>
    </div>
  );
}
