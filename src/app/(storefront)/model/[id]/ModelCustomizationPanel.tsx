'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { FilamentOption, ModelDimensions } from '@/lib/types';
import { calculatePrice, formatPrice } from '@/lib/pricing';
import { useCartStore } from '@/lib/store';

interface ModelInfo {
  id: string;
  localizedName: string;
  thumbnailUrl: string;
  estimatedBasePrice: number;
  defaultDimensions: ModelDimensions;
  minDimensions?: ModelDimensions;
  maxDimensions?: ModelDimensions;
  supportsEmbossedText: boolean;
  sourceName: string;
  sourceUrl?: string;
}

interface Props {
  model: ModelInfo;
  filaments: FilamentOption[];
}

interface UploadedFile {
  name: string;
  size: number;
  preview?: string;
}

export function ModelCustomizationPanel({ model, filaments }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFilament, setSelectedFilament] = useState(filaments[0]?.id ?? '');
  const [scale, setScale] = useState(100);
  const [embossedText, setEmbossedText] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);

  const selectedFilamentData = filaments.find((f) => f.id === selectedFilament);

  const scaledDimensions: ModelDimensions = useMemo(() => {
    const factor = scale / 100;
    return {
      widthMm: Math.round(model.defaultDimensions.widthMm * factor),
      heightMm: Math.round(model.defaultDimensions.heightMm * factor),
      depthMm: Math.round(model.defaultDimensions.depthMm * factor),
    };
  }, [scale, model.defaultDimensions]);

  const priceBreakdown = useMemo(() => {
    return calculatePrice({
      basePrice: model.estimatedBasePrice,
      dimensions: scaledDimensions,
      defaultDimensions: model.defaultDimensions,
      filamentId: selectedFilament,
      quantity,
      hasEmbossedText: embossedText.trim().length > 0,
    });
  }, [model.estimatedBasePrice, scaledDimensions, model.defaultDimensions, selectedFilament, quantity, embossedText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddToCart = () => {
    addItem({
      modelId: model.id,
      modelName: model.localizedName,
      localizedModelName: model.localizedName,
      thumbnailUrl: model.thumbnailUrl,
      sourceName: model.sourceName,
      sourceUrl: model.sourceUrl,
      customization: {
        filamentId: selectedFilament,
        dimensions: scaledDimensions,
        scale: scale / 100,
        embossedText: embossedText.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      quantity,
      unitPrice: priceBreakdown.unitPrice,
      subtotal: priceBreakdown.subtotal,
    });
    setAddedToCart(true);
    setTimeout(() => router.push('/cart'), 600);
  };

  const isLightColor = selectedFilamentData
    ? ['#FFFFFF', '#FAFAFA', '#F5F5F5', '#E0F2FE', '#EAB308'].includes(selectedFilamentData.colorHex)
    : false;

  return (
    <div className="space-y-5">
      {/* ── Filament Color ── */}
      <div>
        <label className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">צבע פילמנט</span>
          {selectedFilamentData && (
            <span className="text-xs text-muted font-medium">
              {selectedFilamentData.localizedName}
              {selectedFilamentData.priceModifier > 0 && (
                <span className="text-primary mr-1">(+{formatPrice(selectedFilamentData.priceModifier)})</span>
              )}
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2.5">
          {filaments.map((f) => {
            const active = selectedFilament === f.id;
            const isLight = ['#FFFFFF', '#FAFAFA', '#F5F5F5', '#E0F2FE'].includes(f.colorHex);
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFilament(f.id)}
                className={`relative w-10 h-10 rounded-full transition-all duration-150 ${
                  active
                    ? 'ring-[3px] ring-primary/40 ring-offset-2 scale-110'
                    : 'hover:scale-105'
                } ${isLight ? 'border border-gray-200' : ''}`}
                style={{ backgroundColor: f.colorHex }}
                title={f.localizedName}
              >
                {active && (
                  <svg
                    className="absolute inset-0 m-auto w-4.5 h-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={isLight ? '#111' : '#fff'}
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Size ── */}
      <div>
        <label className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">גודל</span>
          <span className="text-xs font-mono text-muted bg-muted-bg px-2 py-0.5 rounded-md" dir="ltr">
            {scaledDimensions.widthMm}×{scaledDimensions.heightMm}×{scaledDimensions.depthMm} mm
          </span>
        </label>
        <div className="relative">
          <input
            type="range"
            min={50}
            max={200}
            step={5}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-1.5 text-[10px] text-muted">
            <span>50%</span>
            <span className={`font-bold ${scale === 100 ? 'text-primary' : ''}`}>{scale}%</span>
            <span>200%</span>
          </div>
        </div>
      </div>

      {/* ── Embossed Text ── */}
      {model.supportsEmbossedText && (
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">טקסט בולט</span>
            <span className="text-[11px] text-muted">אופציונלי</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={embossedText}
              onChange={(e) => setEmbossedText(e.target.value)}
              placeholder='לדוגמה: "דניאל", תאריך, הקדשה...'
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder-gray-400 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              dir="auto"
            />
            {embossedText.length > 0 && (
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                {embossedText.length}/50
              </span>
            )}
          </div>
          {embossedText.trim() && (
            <p className="text-[11px] text-primary mt-1.5 font-medium">+ {formatPrice(15)} עבור טקסט בולט</p>
          )}
        </div>
      )}

      {/* ── Free-Text Notes ── */}
      <div>
        <label className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">הערות והנחיות</span>
          <span className="text-[11px] text-muted">אופציונלי</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="בקשות מיוחדות, הנחיות הדפסה, שינויים רצויים..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder-gray-400 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none leading-relaxed"
          dir="auto"
        />
      </div>

      {/* ── Reference Image Upload ── */}
      <div>
        <label className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">תמונות ייחוס</span>
          <span className="text-[11px] text-muted">אופציונלי</span>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.preview ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-border bg-muted-bg flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1.5 -start-1.5 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border bg-muted-bg/40 text-muted text-sm hover:border-primary/40 hover:text-primary hover:bg-primary-50/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          העלאת תמונה או קובץ
        </button>
        <p className="text-[10px] text-muted mt-1.5">תמונות עזר לצוות ההדפסה (JPEG, PNG)</p>
      </div>

      {/* ── Quantity ── */}
      <div>
        <label className="text-sm font-bold text-foreground mb-2 block">כמות</label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-lg hover:bg-muted-bg active:scale-95 transition-all"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 h-11 text-center text-lg font-bold border border-border rounded-xl outline-none focus:border-primary"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-lg hover:bg-muted-bg active:scale-95 transition-all"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Price Breakdown ── */}
      <div className="bg-gradient-to-br from-muted-bg/80 to-muted-bg rounded-2xl p-5 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted">מחיר בסיס</span>
          <span className="font-medium">{formatPrice(priceBreakdown.basePrice)}</span>
        </div>
        {priceBreakdown.sizeMultiplier !== 1 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">התאמת גודל (×{priceBreakdown.sizeMultiplier})</span>
            <span className="font-medium">{formatPrice(priceBreakdown.sizeAdjustedPrice)}</span>
          </div>
        )}
        {priceBreakdown.materialModifier > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">תוספת חומר ({selectedFilamentData?.material})</span>
            <span className="font-medium">+{formatPrice(priceBreakdown.materialModifier)}</span>
          </div>
        )}
        {priceBreakdown.embossedTextSurcharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">טקסט בולט</span>
            <span className="font-medium">+{formatPrice(priceBreakdown.embossedTextSurcharge)}</span>
          </div>
        )}
        {quantity > 1 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">מחיר ליחידה × {quantity}</span>
            <span className="font-medium">{formatPrice(priceBreakdown.unitPrice)} × {quantity}</span>
          </div>
        )}
        <div className="border-t border-border/60 pt-3 flex justify-between items-baseline">
          <span className="font-bold text-foreground">סה&quot;כ</span>
          <span className="text-2xl font-extrabold text-primary">{formatPrice(priceBreakdown.subtotal)}</span>
        </div>
      </div>

      {/* ── Add to Cart ── */}
      <button
        onClick={handleAddToCart}
        disabled={addedToCart}
        className={`w-full py-4 rounded-2xl font-bold text-[17px] transition-all duration-200 shadow-xl ${
          addedToCart
            ? 'bg-success text-white shadow-success/25'
            : 'bg-primary hover:bg-primary-hover active:scale-[0.98] text-white shadow-primary/25 hover:shadow-primary/40'
        }`}
      >
        {addedToCart ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            נוסף לסל!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            הוסיפו לסל — {formatPrice(priceBreakdown.subtotal)}
          </span>
        )}
      </button>
    </div>
  );
}
