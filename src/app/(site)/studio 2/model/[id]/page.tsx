import Link from 'next/link';
import { getSearchService, getFilamentService } from '@/lib/services/container';
import { CATEGORIES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import { ModelCustomizationPanel } from '@/app/(storefront)/model/[id]/ModelCustomizationPanel';
import { ModelGallery } from '@/app/(storefront)/model/[id]/ModelGallery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ModelPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { id } = await params;
  const searchService = getSearchService();
  const filamentService = getFilamentService();
  const model = await searchService.getModel(id);

  if (!model) {
    notFound();
  }

  const allAvailableFilaments = await filamentService.getAvailableFilaments();
  const availableFilaments = allAvailableFilaments.filter((f) =>
    model.supportedMaterials.includes(f.material),
  );

  const categoryNames = model.categories
    .map((catId) => CATEGORIES.find((c) => c.id === catId)?.localizedName)
    .filter(Boolean);

  const isExternal = model.source.name !== 'local';
  const hasPrintTime = model.printTimeMinutes != null && model.printTimeMinutes > 0;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted overflow-x-auto whitespace-nowrap">
            <Link href="/studio" className="hover:text-primary transition-colors shrink-0">
              דף הבית
            </Link>
            <svg className="w-3.5 h-3.5 shrink-0 rotate-180 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/studio/search" className="hover:text-primary transition-colors shrink-0">
              חיפוש
            </Link>
            <svg className="w-3.5 h-3.5 shrink-0 rotate-180 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-foreground font-medium truncate" dir="auto">
              {model.localizedName}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Image Gallery */}
          <ModelGallery
            images={model.images}
            modelName={model.localizedName}
          />

          {/* Details + Customization */}
          <div>
            {/* Source & Title */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[11px] font-medium bg-muted-bg text-muted px-2.5 py-1 rounded-md">
                  {model.source.displayName}
                </span>
                {categoryNames.map((name) => (
                  <span key={name} className="text-[11px] font-medium bg-primary-50 text-primary px-2.5 py-1 rounded-md">
                    {name}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-3" dir="auto">
                {model.localizedName}
              </h1>
            </div>

            {/* Specs Grid */}
            <div className="bg-muted-bg/60 rounded-2xl p-4 md:p-5 mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-muted font-medium mb-0.5">גודל ברירת מחדל</p>
                <p className="text-sm font-semibold text-foreground">
                  {model.defaultDimensions.widthMm}×{model.defaultDimensions.heightMm}×{model.defaultDimensions.depthMm} מ&quot;מ
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted font-medium mb-0.5">זמן הדפסה משוער</p>
                <p className="text-sm font-semibold text-foreground">
                  {hasPrintTime ? `~${Math.round(model.printTimeMinutes! / 60)} שעות` : 'ייקבע לפי הזמנה'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted font-medium mb-0.5">חומרים</p>
                <p className="text-sm font-semibold text-foreground">{model.supportedMaterials.join(' · ')}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted font-medium mb-0.5">טקסט בולט</p>
                <p className="text-sm font-semibold text-foreground">
                  {model.supportsEmbossedText ? (
                    <span className="text-success">נתמך ✓</span>
                  ) : (
                    <span className="text-muted">לא נתמך</span>
                  )}
                </p>
              </div>
            </div>

            {/* External model info banner */}
            {isExternal && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-6 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <div className="text-xs text-blue-700 leading-relaxed">
                  <p className="font-semibold mb-0.5">מודל מ-{model.source.displayName}</p>
                  <p>הגודל והזמן המוערכים עשויים להשתנות בפועל. הצוות שלנו יוודא התאמה מלאה לפני ההדפסה.</p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border my-6" />

            {/* Customization Panel */}
            <ModelCustomizationPanel
              model={{
                id: model.id,
                localizedName: model.localizedName,
                thumbnailUrl: model.images[0]?.cachedUrl ?? model.images[0]?.url ?? '',
                estimatedBasePrice: model.estimatedBasePrice,
                defaultDimensions: model.defaultDimensions,
                minDimensions: model.minDimensions,
                maxDimensions: model.maxDimensions,
                supportsEmbossedText: model.supportsEmbossedText,
                sourceName: model.source.displayName,
                sourceUrl: model.sourceUrl,
              }}
              filaments={availableFilaments}
            />

            {/* License & Source Attribution */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="rounded-xl p-3.5 mb-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200">
                <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold mb-0.5 text-emerald-800">
                    {model.license.localizedName}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-emerald-700">
                    <span>✓ שימוש מסחרי</span>
                    {model.license.requiresAttribution && <span>✓ נדרש ייחוס</span>}
                    {model.license.shareAlike && <span>✓ שיתוף זהה</span>}
                    {!model.license.allowsModification && <span>✗ ללא שינויים</span>}
                  </div>
                  {model.license.url && (
                    <a
                      href={model.license.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1.5 underline decoration-dotted underline-offset-2 hover:no-underline"
                    >
                      קראו את הרישיון המלא ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted">
                <p>
                  מקור המודל:{' '}
                  <a
                    href={model.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {model.source.displayName} ↗
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

