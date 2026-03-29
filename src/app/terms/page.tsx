import { LegalContentParagraphs } from '@/components/legal/LegalContentParagraphs';
import { getSiteContent } from '@/lib/site-content/get-site-content';

export const revalidate = 60;

export default async function TermsPage() {
  const content = await getSiteContent('terms');

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            תקנון ומדיניות פרטיות
          </h1>
          <div className="w-24 h-1 bg-black mx-auto rounded-full"></div>
        </div>

        <article className="text-slate-700 leading-relaxed space-y-8 text-lg">
          <LegalContentParagraphs content={content} paragraphClassName="mb-2" />
        </article>
      </main>
    </div>
  );
}
