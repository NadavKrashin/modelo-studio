'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type ModelType = 'person' | 'animal';
type QuantityType = 'single' | 'couple' | null;
type WizardStepId =
  | 'modelType'
  | 'quantity'
  | 'uploadPhoto'
  | 'characteristics'
  | 'baseDedication'
  | 'summary';

interface PersonalWizardState {
  modelType: ModelType | null;
  quantity: QuantityType;
  uploadedPhoto: string | null;
  eyeColor: string;
  skinColor: string;
  customPreferences: string;
  baseColor: string;
  dedicationText: string;
}

const EYE_COLORS = [
  { label: 'חום', hex: '#654321' },
  { label: 'ירוק', hex: '#4CAF50' },
  { label: 'כחול', hex: '#2196F3' },
] as const;
const SKIN_COLORS = [
  { label: 'בהיר', hex: '#FFDFC4' },
  { label: 'בינוני', hex: '#D09B76' },
  { label: 'כהה', hex: '#4A2E1B' },
] as const;
const BASE_COLORS = ['שחור', 'בז', 'לבן'] as const;

const INITIAL_STATE: PersonalWizardState = {
  modelType: null,
  quantity: null,
  uploadedPhoto: null,
  eyeColor: '',
  skinColor: '',
  customPreferences: '',
  baseColor: '',
  dedicationText: '',
};

export function PersonalWizard({ onClose }: { onClose: () => void }) {
  const [wizardState, setWizardState] = useState<PersonalWizardState>(INITIAL_STATE);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedPhotoUrlRef = useRef<string | null>(null);

  const steps = useMemo(() => {
    const base: WizardStepId[] = ['modelType'];
    if (wizardState.modelType === 'person') {
      base.push('quantity');
    }
    base.push('uploadPhoto');
    if (wizardState.modelType === 'person') {
      base.push('characteristics');
    }
    base.push('baseDedication');
    base.push('summary');
    return base;
  }, [wizardState.modelType]);

  const activeStep = steps[activeStepIndex];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === steps.length - 1;

  const progressPercentage = ((activeStepIndex + 1) / steps.length) * 100;

  const basePrice = useMemo(() => {
    if (wizardState.modelType === 'animal') return 199;
    if (wizardState.modelType === 'person' && wizardState.quantity === 'single') return 289;
    if (wizardState.modelType === 'person' && wizardState.quantity === 'couple') return 479;
    return 0;
  }, [wizardState.modelType, wizardState.quantity]);

  const dedicationAddon = useMemo(
    () => (wizardState.dedicationText.trim().length > 0 ? 50 : 0),
    [wizardState.dedicationText]
  );

  const totalPrice = useMemo(() => basePrice + dedicationAddon, [basePrice, dedicationAddon]);

  const canGoNext = useMemo(() => {
    if (activeStep === 'modelType') return wizardState.modelType !== null;
    if (activeStep === 'quantity') return wizardState.quantity !== null;
    if (activeStep === 'uploadPhoto') return wizardState.uploadedPhoto !== null;
    if (activeStep === 'characteristics') {
      return wizardState.eyeColor.length > 0 && wizardState.skinColor.length > 0;
    }
    if (activeStep === 'baseDedication') {
      return wizardState.baseColor.length > 0;
    }
    if (activeStep === 'summary') return false;
    return false;
  }, [
    activeStep,
    wizardState.modelType,
    wizardState.quantity,
    wizardState.uploadedPhoto,
    wizardState.eyeColor,
    wizardState.skinColor,
    wizardState.baseColor,
    wizardState.dedicationText,
  ]);

  const updateState = <K extends keyof PersonalWizardState>(
    key: K,
    value: PersonalWizardState[K]
  ) => {
    setWizardState((prev) => ({ ...prev, [key]: value }));
  };

  const handleModelTypeSelect = (modelType: ModelType) => {
    setWizardState((prev) => ({
      ...prev,
      modelType,
      quantity: modelType === 'person' ? prev.quantity : null,
      eyeColor: modelType === 'person' ? prev.eyeColor : '',
      skinColor: modelType === 'person' ? prev.skinColor : '',
      customPreferences: modelType === 'person' ? prev.customPreferences : '',
    }));
  };

  const setUploadedPhotoFromFile = (file: File) => {
    if (uploadedPhotoUrlRef.current) {
      URL.revokeObjectURL(uploadedPhotoUrlRef.current);
    }
    const photoUrl = URL.createObjectURL(file);
    uploadedPhotoUrlRef.current = photoUrl;
    updateState('uploadedPhoto', photoUrl);
  };

  const resetUploadedPhoto = () => {
    if (uploadedPhotoUrlRef.current) {
      URL.revokeObjectURL(uploadedPhotoUrlRef.current);
      uploadedPhotoUrlRef.current = null;
    }
    updateState('uploadedPhoto', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (uploadedPhotoUrlRef.current) {
        URL.revokeObjectURL(uploadedPhotoUrlRef.current);
      }
    };
  }, []);

  const onDropFile: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setUploadedPhotoFromFile(file);
    }
  };

  const onInputFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedPhotoFromFile(file);
    }
  };

  const goToNext = () => {
    if (!canGoNext || isLastStep) return;
    setActiveStepIndex((prev) => prev + 1);
  };

  const goToBack = () => {
    if (isFirstStep) return;
    setActiveStepIndex((prev) => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm p-4 sm:p-6" dir="rtl">
      <div className="mx-auto w-full max-w-5xl h-[90vh] max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="shrink-0 px-5 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Modelo Personal</p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">אשף עיצוב אישי</h2>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="סגירה"
          >
            ✕
          </button>
        </div>

        <div className="shrink-0 px-5 sm:px-8 pt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              שלב {activeStepIndex + 1} מתוך {steps.length}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gray-900 transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-5 sm:p-7">
            <div className="transition-all duration-300 ease-out animate-fade-in">
              {activeStep === 'modelType' && (
                <section>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2">בחרו סוג מודל</h3>
                  <p className="text-gray-600 mb-6">מה תרצו שניצור עבורכם?</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleModelTypeSelect('person')}
                      className={`rounded-2xl border-2 p-6 text-right transition-all ${
                        wizardState.modelType === 'person'
                          ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-3">👤</div>
                      <p className="text-lg font-bold">בן אדם</p>
                      <p
                        className={`text-sm mt-1 ${
                          wizardState.modelType === 'person'
                            ? 'text-gray-200'
                            : 'text-gray-600'
                        }`}
                      >
                        דמות אישית על בסיס תמונה
                      </p>
                    </button>

                    <button
                      onClick={() => handleModelTypeSelect('animal')}
                      className={`rounded-2xl border-2 p-6 text-right transition-all ${
                        wizardState.modelType === 'animal'
                          ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-3">🐾</div>
                      <p className="text-lg font-bold">בעל חיים</p>
                      <p
                        className={`text-sm mt-1 ${
                          wizardState.modelType === 'animal'
                            ? 'text-gray-200'
                            : 'text-gray-600'
                        }`}
                      >
                        מודל מותאם של חיית מחמד
                      </p>
                    </button>
                  </div>
                </section>
              )}

              {activeStep === 'quantity' && (
                <section>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2">בחרו כמות דמויות</h3>
                  <p className="text-gray-600 mb-6">הגדירו אם המודל הוא של אדם יחיד או זוג.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => updateState('quantity', 'single')}
                      className={`rounded-2xl border-2 p-6 text-right transition-all ${
                        wizardState.quantity === 'single'
                          ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-3">🧍</div>
                      <p className="text-lg font-bold">יחיד</p>
                    </button>

                    <button
                      onClick={() => updateState('quantity', 'couple')}
                      className={`rounded-2xl border-2 p-6 text-right transition-all ${
                        wizardState.quantity === 'couple'
                          ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-3">🧑‍🤝‍🧑</div>
                      <p className="text-lg font-bold">זוג</p>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    בעתיד נתמוך במודלים עם יותר אנשים
                  </p>
                </section>
              )}

              {activeStep === 'uploadPhoto' && (
                <section>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2">העלאת תמונה</h3>
                  <p className="text-gray-600 mb-6">
                    העלו תמונה ברורה כדי שנוכל להתחיל את תהליך העיצוב.
                  </p>

                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={onDropFile}
                    className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
                      isDragOver
                        ? 'border-gray-900 bg-gray-100'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      id="personal-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onInputFileChange}
                    />

                    {wizardState.uploadedPhoto ? (
                      <div className="space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">
                          ✓
                        </div>
                        <p className="font-semibold text-green-700">התמונה הועלתה בהצלחה</p>
                        <div className="mx-auto h-32 w-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={wizardState.uploadedPhoto}
                            alt="Uploaded preview placeholder"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <button
                          onClick={resetUploadedPhoto}
                          className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-2"
                        >
                          העלאה מחדש
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-4xl">📷</div>
                        <p className="text-gray-700 font-semibold">
                          גררו לכאן תמונה או לחצו לבחירה מהמחשב
                        </p>
                        <label
                          htmlFor="personal-photo-upload"
                          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-white text-sm font-semibold hover:bg-black transition-colors"
                        >
                          בחירת תמונה
                        </label>
                        <p className="text-xs text-gray-500">
                          PNG / JPG / JPEG - לשלב זה זו העלאה מדומה
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeStep === 'characteristics' && (
                <section>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2">מאפיינים אישיים</h3>
                  <p className="text-gray-600 mb-6">
                    בחרו פרטים שיעזרו לנו להתאים את המודל בדיוק אליכם.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-3">צבע עיניים</p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {EYE_COLORS.map((color) => (
                          <label
                            key={color.label}
                            className={`rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${
                              wizardState.eyeColor === color.label
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="eyeColor"
                              value={color.label}
                              checked={wizardState.eyeColor === color.label}
                              onChange={() => updateState('eyeColor', color.label)}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full border border-gray-300 shadow-sm ${
                                  wizardState.eyeColor === color.label ? 'ring-2 ring-offset-1 ring-gray-900' : ''
                                }`}
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-sm font-medium text-gray-900">{color.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-3">צבע עור</p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {SKIN_COLORS.map((color) => (
                          <label
                            key={color.label}
                            className={`rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${
                              wizardState.skinColor === color.label
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="skinColor"
                              value={color.label}
                              checked={wizardState.skinColor === color.label}
                              onChange={() => updateState('skinColor', color.label)}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full border border-gray-300 shadow-sm ${
                                  wizardState.skinColor === color.label ? 'ring-2 ring-offset-1 ring-gray-900' : ''
                                }`}
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="text-sm font-medium text-gray-900">{color.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        פרטו העדפות אישיות (תסרוקת, לבוש, חזות ייחודית ועוד)
                      </label>
                      <textarea
                        rows={4}
                        value={wizardState.customPreferences}
                        onChange={(event) =>
                          updateState('customPreferences', event.target.value)
                        }
                        placeholder="לדוגמה: שיער קצר, חולצה כחולה, משקפיים, חיוך רחב..."
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all resize-none"
                      />
                    </div>
                  </div>
                </section>
              )}

              {activeStep === 'baseDedication' && (
                <section>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2">בסיס והקדשה</h3>
                  <p className="text-gray-600 mb-6">
                    המגע האחרון שהופך את המודל למיוחד ובלתי נשכח.
                  </p>

                  <div className="grid lg:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                      <p className="text-sm font-semibold text-gray-900 mb-3">תצוגת תמונה שנשלחה</p>
                      <div className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 h-[260px] sm:h-[320px] max-h-80 flex items-center justify-center">
                        {wizardState.uploadedPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={wizardState.uploadedPhoto}
                            alt="Uploaded preview"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <p className="text-sm text-gray-500">לא הועלתה תמונה</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                      <p className="text-sm font-semibold text-gray-900 mb-3">בחירת צבע מעמד</p>
                      <div className="flex flex-wrap gap-3 mb-6">
                        {BASE_COLORS.map((color) => {
                          const colorClass =
                            color === 'שחור'
                              ? 'bg-black'
                              : color === 'בז'
                                ? 'bg-[#dfccb4]'
                                : 'bg-white';
                          return (
                            <button
                              key={color}
                              onClick={() => updateState('baseColor', color)}
                              className={`rounded-xl border-2 px-3 py-2 text-sm font-medium flex items-center gap-2 transition-all ${
                                wizardState.baseColor === color
                                  ? 'border-gray-900 bg-gray-900 text-white'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span
                                className={`h-4 w-4 rounded-full border ${colorClass} ${
                                  color === 'לבן' ? 'border-gray-300' : 'border-transparent'
                                }`}
                              />
                              {color}
                            </button>
                          );
                        })}
                      </div>

                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        הקדשה אישית
                        <span className="text-xs text-primary font-medium mr-2">(תוספת ₪50)</span>
                      </label>
                      <input
                        type="text"
                        value={wizardState.dedicationText}
                        onChange={(event) =>
                          updateState('dedicationText', event.target.value.slice(0, 13))
                        }
                        maxLength={13}
                        placeholder="עד 13 תווים"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
                      />
                      <div className="mt-2 text-xs text-gray-500 text-left" dir="ltr">
                        {wizardState.dedicationText.length}/13
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        ההקדשה אופציונלית (עד 13 תווים).
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {activeStep === 'summary' && (
                <section>
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-2">סיכום והוספה לסל</h3>
                  <p className="text-gray-600 mb-6">
                    עברו על הפרטים שבחרתם לפני ההוספה לסל.
                  </p>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">סוג מודל</span>
                      <span className="font-semibold text-gray-900">
                        {wizardState.modelType === 'person' ? 'בן אדם' : 'בעל חיים'}
                      </span>
                    </div>
                    {wizardState.modelType === 'person' && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">כמות</span>
                        <span className="font-semibold text-gray-900">
                          {wizardState.quantity === 'single' ? 'יחיד' : 'זוג'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">תמונה</span>
                      <span className="font-semibold text-gray-900">
                        {wizardState.uploadedPhoto ? 'הועלתה בהצלחה' : 'לא הועלתה'}
                      </span>
                    </div>
                    {wizardState.modelType === 'person' && (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">צבע עיניים</span>
                          <span className="font-semibold text-gray-900">
                            {wizardState.eyeColor || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">צבע עור</span>
                          <span className="font-semibold text-gray-900">
                            {wizardState.skinColor || '-'}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">צבע בסיס</span>
                      <span className="font-semibold text-gray-900">{wizardState.baseColor}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">הקדשה</span>
                      <span className="font-semibold text-gray-900">
                        {wizardState.dedicationText || 'ללא הקדשה'}
                      </span>
                    </div>
                    {wizardState.customPreferences && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-gray-500 mb-1">העדפות אישיות</p>
                        <p className="text-gray-800">{wizardState.customPreferences}</p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">מחיר בסיס</span>
                        <span className="font-semibold text-gray-900">₪{basePrice}</span>
                      </div>
                      {dedicationAddon > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">הקדשה אישית</span>
                          <span className="font-semibold text-gray-900">+₪{dedicationAddon}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 pt-1">
                        <span className="text-gray-900 font-bold">סה&quot;כ</span>
                        <span className="text-xl font-extrabold text-primary">₪{totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 mt-6 pt-5 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
                    <button
                      onClick={() => {
                        console.log('Personal wizard final state:', wizardState);
                      }}
                      className="w-full rounded-2xl bg-gray-900 px-6 py-4 text-white font-bold hover:bg-black transition-colors shadow-lg shadow-gray-900/20"
                    >
                      הוסף לסל
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto shrink-0 border-t border-gray-100 bg-white px-5 sm:px-8 py-4 sm:py-5 sticky bottom-0 flex items-center justify-between">
          <button
            onClick={goToBack}
            disabled={isFirstStep}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            חזור
          </button>

          <div className="text-center">
            <p className="text-[11px] text-gray-500">סה&quot;כ נוכחי</p>
            <p className="text-lg font-extrabold text-primary" dir="ltr">₪{totalPrice}</p>
          </div>

          <button
            onClick={goToNext}
            disabled={!canGoNext || isLastStep}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            המשך
          </button>
        </div>
      </div>
    </div>
  );
}

