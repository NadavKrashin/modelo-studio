"use client";

import { useState } from 'react';
import { Leaf, Search, Square, Wrench } from 'lucide-react';
import { useCartStore } from '@/lib/store';

const galleryImages = [
  '/images/cities/tel-aviv.jpeg',
  '/images/cities/london.jpeg',
  '/images/cities/new-york.jpeg',
  '/images/cities/4cities.jpeg',
];

const cityGroups = [
  { country: 'ישראל', cities: ['תל אביב', 'ירושלים'] },
  { country: 'ארה״ב', cities: ['ניו יורק', 'מיאמי', 'לאס וגאס'] },
  { country: 'איטליה', cities: ['ונציה', 'רומא', 'מילאנו'] },
  { country: 'ספרד', cities: ['ברצלונה'] },
  { country: 'אנגליה', cities: ['לונדון'] },
  { country: 'צרפת', cities: ['פריז'] },
  { country: 'איחוד האמירויות', cities: ['דובאי', 'אבו דאבי'] },
] as const;

const colorOptions = [
  { id: 'black', label: 'שחור', swatchClass: 'bg-black' },
  { id: 'white', label: 'לבן', swatchClass: 'bg-white border border-slate-300' },
] as const;

const sizeOptions = [
  { id: 'rectangle', label: 'מלבן (17x12 ס״מ)', price: 149 },
  { id: 'cube', label: 'קובייה (15x15 ס״מ)', price: 169 },
] as const;

export default function ModeloCitiesProductPage() {
  const addItem = useCartStore((s) => s.addItem);
  const [mainImage, setMainImage] = useState(galleryImages[0]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSize, setSelectedSize] = useState<'rectangle' | 'cube' | null>(null);
  const [selectedColor, setSelectedColor] = useState<'black' | 'white' | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<'shipping' | 'aboutModel' | 'materials' | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const selectedSizeOption = sizeOptions.find((size) => size.id === selectedSize);
  const currentPrice = selectedSizeOption?.price ?? null;
  const selectedColorLabel = colorOptions.find((color) => color.id === selectedColor)?.label ?? '-';
  const isFormComplete = Boolean(selectedCity && selectedSize && selectedColor);

  const getStepStateClass = (step: number) => {
    if (activeStep < step) return 'opacity-50 grayscale pointer-events-none';
    if (activeStep === step) return 'opacity-100';
    return 'opacity-85';
  };

  const handleAddToCart = () => {
    if (!selectedCity || !selectedSize || !selectedColor || !selectedSizeOption) return;

    addItem({
      kind: 'simple',
      title: 'מודלו סיטיז - דגם תלת מימד',
      imageUrl: galleryImages[0],
      department: 'cities',
      attributes: [
        selectedCity,
        selectedSize === 'rectangle' ? '17x12 ס״מ' : '15x15 ס״מ',
        selectedColor === 'black' ? 'מסגרת שחורה' : 'מסגרת לבנה',
      ],
      quantity: 1,
      unitPrice: selectedSizeOption.price,
      subtotal: selectedSizeOption.price,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const accordionItems = [
    {
      id: 'shipping' as const,
      title: 'זמני משלוח',
      content: 'משלוח מהיר עד 10 ימי עסקים לכל רחבי הארץ.',
    },
    {
      id: 'aboutModel' as const,
      title: 'על המודל',
      content:
        'דגם תלת־ממדי מפורט ומדויק המיועד לתצוגה מרשימה על הקיר או על שולחן העבודה. מתנה מושלמת לכל חובב אדריכלות או מטייל.',
    },
    {
      id: 'materials' as const,
      title: 'חומרים וייצור',
      content:
        'מיוצר מ-PLA – פולימר ביולוגי (פלסטיק מתכלה) איכותי וידידותי לסביבה. מודפס ברזולוציה גבוהה להדגשת כל פרט בקו הרקיע.',
    },
  ];

  return (
    <div className="bg-white text-slate-900" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Right Column - Images */}
        <section>
          <div className="aspect-square bg-[#F8F9FA] rounded-2xl flex items-center justify-center overflow-hidden mb-4 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainImage}
              alt="מודל עיר בתלת־ממד"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex gap-3">
            {galleryImages.map((img, idx) => (
              <button
                key={img}
                onClick={() => setMainImage(img)}
                className={`aspect-square bg-[#F8F9FA] rounded-xl cursor-pointer hover:ring-2 ring-black transition-all overflow-hidden flex-1 ${
                  mainImage === img ? 'ring-2 ring-black' : ''
                }`}
                aria-label={`תמונה ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`תצוגה מקדימה ${idx + 1}`}
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        </section>

        {/* Left Column - Product Details */}
        <section>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">מודלו סיטיז - דגם תלת מימד</h1>
          <p className="text-2xl font-medium text-slate-700 mb-6">
            {currentPrice ? `₪${currentPrice}` : 'בחרו גודל לתמחור'}
          </p>
          <p className="text-slate-600 mb-8 leading-relaxed">
            מודל תלת־ממדי מינימליסטי ומוקפד של העיר האהובה עליכם. ממוסגר ומיועד לתלייה על הקיר או להנחה על שולחן העבודה.
          </p>

          <div className="space-y-7">
            <div className={`rounded-2xl border border-slate-200 p-5 transition-all duration-500 ease-in-out ${getStepStateClass(1)}`}>
              <label className="block text-sm font-semibold text-slate-900 mb-2">בחירת עיר</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCity(value);
                  setActiveStep(value ? 2 : 1);
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              >
                <option value="">בחרו עיר</option>
                {cityGroups.map((group) => (
                  <optgroup key={group.country} label={group.country}>
                    {group.cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className={`rounded-2xl border border-slate-200 p-5 transition-all duration-500 ease-in-out ${getStepStateClass(2)}`}>
              <label className="block text-sm font-semibold text-slate-900 mb-3">גודל ומחיר</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sizeOptions.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => {
                      setSelectedSize(size.id);
                      setActiveStep(3);
                    }}
                    className={`rounded-2xl border px-4 py-4 text-right transition-all duration-500 ease-in-out ${
                      selectedSize === size.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <p className="font-semibold">{size.label}</p>
                    <p className={`text-sm mt-1 ${selectedSize === size.id ? 'text-white/90' : 'text-slate-500'}`}>
                      ₪{size.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border border-slate-200 p-5 transition-all duration-500 ease-in-out ${getStepStateClass(3)}`}>
              <label className="block text-sm font-semibold text-slate-900 mb-2">צבע מסגרת</label>
              <div className="flex items-center gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                      selectedColor === color.id ? 'ring-2 ring-black ring-offset-2' : 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-2'
                    }`}
                    title={color.label}
                    aria-label={color.label}
                  >
                    <span className={`w-8 h-8 rounded-full ${color.swatchClass}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            disabled={!isFormComplete}
            onClick={handleAddToCart}
            className={`w-full py-4 rounded-full text-lg font-bold transition-all mt-8 shadow-xl ${
              isFormComplete
                ? 'bg-black text-white hover:bg-slate-800'
                : 'bg-slate-300 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
          >
            {justAdded ? 'נוסף לעגלה' : 'הוספה לעגלה'}
          </button>

          <div className="mt-5 text-xs text-slate-500">
            נבחר: {selectedCity || '-'} • {selectedColorLabel} • {selectedSizeOption?.label || '-'}
          </div>
        </section>
      </div>

      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-right text-lg font-extrabold tracking-wide text-slate-900 mb-2">פרטים נוספים</h2>
        {accordionItems.map((item) => {
          const isOpen = openAccordion === item.id;
          return (
            <div key={item.id} className="border-b border-gray-200 py-4">
              <button
                onClick={() => setOpenAccordion(isOpen ? null : item.id)}
                className="w-full flex items-center justify-between text-right transition-all duration-300"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-slate-900">{item.title}</span>
                <span className="text-xl leading-none text-slate-700">{isOpen ? '-' : '+'}</span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isOpen ? 'max-h-40 opacity-100 pt-3' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-sm text-slate-600 leading-relaxed">{item.content}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-16 mb-24">
          <div>
            <Search size={40} strokeWidth={1.5} className="mx-auto mb-4 text-slate-900" />
            <h3 className="font-bold text-lg text-slate-900">מלא בפרטים</h3>
            <p className="text-slate-600 mt-2">טופוגרפיה ואדריכלות מדויקת לחוויה ריאליסטית.</p>
          </div>
          <div>
            <Square size={40} strokeWidth={1.5} className="mx-auto mb-4 text-slate-900" />
            <h3 className="font-bold text-lg text-slate-900">עיצוב נקי</h3>
            <p className="text-slate-600 mt-2">מונוכרומטי, אלגנטי ומשתלב בכל חלל.</p>
          </div>
          <div>
            <Wrench size={40} strokeWidth={1.5} className="mx-auto mb-4 text-slate-900" />
            <h3 className="font-bold text-lg text-slate-900">מיוצר בישראל</h3>
            <p className="text-slate-600 mt-2">הדפסה, גימור והרכבה קפדנית כחול-לבן.</p>
          </div>
          <div>
            <Leaf size={40} strokeWidth={1.5} className="mx-auto mb-4 text-slate-900" />
            <h3 className="font-bold text-lg text-slate-900">ידידותי לסביבה</h3>
            <p className="text-slate-600 mt-2">עשוי מ-PLA ביולוגי מתכלה ואיכותי.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

