"use client";

import { useState } from "react";
import {
  Package,
  UserCircle,
  LogOut,
  Loader2,
  CheckCircle2,
  Clock,
  Printer,
  Truck,
} from "lucide-react";

type LoginStep = "phone" | "otp";
type ActiveTab = "orders" | "details";

const ORDER_STEPS = [
  { label: "התקבל", status: "done" },
  { label: "הכנת קבצים", status: "done" },
  { label: "בהדפסה (3D)", status: "current" },
  { label: "נשלח", status: "pending" },
] as const;

const stepIcons = [CheckCircle2, CheckCircle2, Printer, Truck] as const;

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("orders");

  const [firstName, setFirstName] = useState("רונית");
  const [lastName, setLastName] = useState("שקד");
  const [email, setEmail] = useState("ronit@example.com");
  const [detailsPhone, setDetailsPhone] = useState("050-1234567");
  const [address, setAddress] = useState("יונה וולך 18, הוד השרון");
  const [detailsSaved, setDetailsSaved] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLoginStep("otp");
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (otpCode === "000") {
      setIsLoggedIn(true);
    } else {
      setOtpError("קוד שגוי");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginStep("phone");
    setPhoneNumber("");
    setOtpCode("");
    setOtpError("");
  };

  const handleDetailsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsSaved(true);
    setTimeout(() => setDetailsSaved(false), 2000);
  };

  const inputCls =
    "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-black text-sm";

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-sm">
          {loginStep === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserCircle className="w-7 h-7 text-gray-500" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  התחברות לאזור האישי
                </h1>
                <p className="text-sm text-gray-500">הזינו את מספר הטלפון שלכם</p>
              </div>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="050-0000000"
                className={`${inputCls} text-left`}
                dir="ltr"
                autoFocus
              />

              <button
                type="submit"
                disabled={!phoneNumber.trim() || loading}
                className="w-full rounded-xl bg-black px-6 py-3.5 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "שולח קוד..." : "המשך"}
              </button>
            </form>
          )}

          {loginStep === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserCircle className="w-7 h-7 text-gray-500" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">הזן את הקוד</h1>
                <p className="text-sm text-gray-500">
                  שלחנו קוד אימות ל-
                  <span className="font-semibold text-slate-700" dir="ltr">
                    {phoneNumber}
                  </span>
                </p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 3));
                  setOtpError("");
                }}
                placeholder="000"
                className={`${inputCls} text-center tracking-[0.5em] text-xl font-bold`}
                dir="ltr"
                autoFocus
              />

              {otpError && (
                <p className="text-sm text-red-600 text-center font-medium">{otpError}</p>
              )}

              <button
                type="submit"
                disabled={otpCode.length < 3}
                className="w-full rounded-xl bg-black px-6 py-3.5 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                התחבר
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginStep("phone");
                  setOtpCode("");
                  setOtpError("");
                }}
                className="w-full text-sm text-gray-500 hover:text-black transition-colors"
              >
                שינוי מספר טלפון
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const sidebarItems: { key: ActiveTab | "logout"; label: string; icon: typeof Package }[] = [
    { key: "orders", label: "ההזמנות שלי", icon: Package },
    { key: "details", label: "פרטים אישיים", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
          האזור האישי
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-3">
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as ActiveTab)}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-medium transition-all border-b border-gray-100 last:border-b-0 ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-white text-slate-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.8} />
                התנתק
              </button>
            </div>
          </aside>

          {/* Content */}
          <section className="md:col-span-9">
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "details" && (
              <DetailsTab
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                email={email}
                setEmail={setEmail}
                phone={detailsPhone}
                setPhone={setDetailsPhone}
                address={address}
                setAddress={setAddress}
                onSave={handleDetailsSave}
                saved={detailsSaved}
                inputCls={inputCls}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">ההזמנות שלי</h2>

      {/* Order Card */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">הזמנה</p>
            <p className="text-lg font-bold text-slate-900">#MDL-8472</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>20-03-2026</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Package className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">מודלו סיטיז - תל אביב</p>
            <p className="text-sm text-gray-500 mt-0.5">כמות: 1</p>
          </div>
          <p className="text-lg font-extrabold text-slate-900 shrink-0">₪199</p>
        </div>

        {/* Progress Tracker */}
        <div className="relative">
          <div className="flex items-start justify-between">
            {ORDER_STEPS.map((step, i) => {
              const Icon = stepIcons[i];
              const isDone = step.status === "done";
              const isCurrent = step.status === "current";
              const isPending = step.status === "pending";

              return (
                <div key={step.label} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isCurrent
                          ? "bg-black border-black text-white animate-pulse"
                          : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isPending ? 1.5 : 2} />
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium text-center ${
                      isDone
                        ? "text-emerald-600"
                        : isCurrent
                          ? "text-black font-bold"
                          : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Connecting line */}
          <div className="absolute top-5 right-[12.5%] left-[12.5%] h-0.5 -translate-y-1/2 flex">
            <div className="flex-1 bg-emerald-500" />
            <div className="flex-1 bg-emerald-500" />
            <div className="flex-1 bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsTab({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  phone,
  setPhone,
  address,
  setAddress,
  onSave,
  saved,
  inputCls,
}: {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
  saved: boolean;
  inputCls: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">פרטים אישיים</h2>
      <form onSubmit={onSave} className="rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם פרטי</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">שם משפחה</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} text-left`} dir="ltr" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">טלפון</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} text-left`} dir="ltr" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">כתובת למשלוח</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-black px-8 py-3 text-white font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            {saved && <CheckCircle2 className="w-4 h-4" />}
            {saved ? "השינויים נשמרו" : "שמור שינויים"}
          </button>
        </div>
      </form>
    </div>
  );
}
