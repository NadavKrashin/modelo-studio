"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  LogOut,
  Loader2,
  CheckCircle2,
  Clock,
  Printer,
  Truck,
  Search,
} from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types/order";
import { ORDER_STATUS_LABELS, DELIVERY_METHOD_LABELS } from "@/lib/types/order";

const STATUS_FLOW: OrderStatus[] = [
  "received",
  "pending_approval",
  "in_production",
  "printed",
  "shipped",
  "completed",
];

const STATUS_STEP_CONFIG: {
  status: OrderStatus;
  label: string;
  icon: typeof CheckCircle2;
}[] = [
  { status: "received", label: "התקבלה", icon: CheckCircle2 },
  { status: "in_production", label: "בייצור", icon: Clock },
  { status: "printed", label: "הודפסה", icon: Printer },
  { status: "shipped", label: "נשלחה", icon: Truck },
  { status: "completed", label: "הושלמה", icon: CheckCircle2 },
];

function formatPrice(n: number) {
  return `₪${n.toLocaleString("he-IL")}`;
}

function getStepState(
  orderStatus: OrderStatus,
  stepStatus: OrderStatus,
): "done" | "current" | "pending" {
  const orderIdx = STATUS_FLOW.indexOf(orderStatus);
  const stepIdx = STATUS_FLOW.indexOf(stepStatus);
  if (stepIdx < orderIdx) return "done";
  if (stepIdx === orderIdx) return "current";
  return "pending";
}

export default function ProfilePage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch("/api/client/order");
        if (res.ok) {
          const data: Order = await res.json();
          if (!cancelled) {
            setOrder(data);
            setIsLoggedIn(true);
          }
        }
      } catch {
        // Not authenticated — show login
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), phoneNumber: phoneNumber.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setLoginError(data.error || "שגיאה בהתחברות");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOrder(data.order);
      setIsLoggedIn(true);
      router.refresh();
    } catch {
      setLoginError("שגיאת רשת. נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/client/logout", { method: "POST" });
    setOrder(null);
    setIsLoggedIn(false);
    setOrderId("");
    setPhoneNumber("");
    router.refresh();
  }

  async function refreshOrder() {
    try {
      const res = await fetch("/api/client/order");
      if (res.ok) {
        const data: Order = await res.json();
        setOrder(data);
      }
    } catch {
      // Silently fail on refresh
    }
  }

  const inputCls =
    "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-black text-sm";

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen bg-white flex items-center justify-center px-4"
        dir="rtl"
      >
        <div className="w-full max-w-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Search
                  className="w-7 h-7 text-gray-500"
                  strokeWidth={1.5}
                />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                מעקב הזמנה
              </h1>
              <p className="text-sm text-gray-500">
                הזינו את מספר ההזמנה ומספר הטלפון שהשתמשתם בו בעת ביצוע ההזמנה
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="order-id"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  מספר הזמנה
                </label>
                <input
                  id="order-id"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="MDL-A7K9B2F"
                  className={`${inputCls} text-left font-mono`}
                  dir="ltr"
                  autoFocus
                  autoComplete="off"
                />
              </div>

              <div>
                <label
                  htmlFor="phone-number"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  מספר טלפון
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="050-0000000"
                  className={`${inputCls} text-left`}
                  dir="ltr"
                  autoComplete="tel"
                />
              </div>
            </div>

            {loginError && (
              <p className="text-sm text-red-600 text-center font-medium">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={!orderId.trim() || !phoneNumber.trim() || loading}
              className="w-full rounded-xl bg-black px-6 py-3.5 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "מחפש..." : "צפה בהזמנה"}
            </button>

            <Link
              href="/"
              className="block text-center text-sm text-gray-500 hover:text-black transition-colors"
            >
              חזרה לעמוד הראשי
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            מעקב הזמנה
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
            התנתק
          </button>
        </div>

        {order ? (
          <OrderTracker order={order} onRefresh={refreshOrder} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function OrderTracker({
  order,
  onRefresh,
}: {
  order: Order;
  onRefresh: () => void;
}) {
  const visibleSteps = STATUS_STEP_CONFIG;

  return (
    <div className="space-y-6">
      {/* Order Header Card */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <p className="text-sm text-gray-500">הזמנה</p>
            <p className="text-lg font-bold text-slate-900" dir="ltr">
              {order.orderNumber}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                order.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : order.status === "shipped"
                    ? "bg-cyan-100 text-cyan-700"
                    : order.status === "in_production"
                      ? "bg-blue-100 text-blue-700"
                      : order.status === "pending_approval"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
              }`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
            <button
              onClick={onRefresh}
              className="text-xs text-gray-400 hover:text-black transition-colors"
              title="רענן"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleDateString("he-IL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Progress Tracker */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 mb-6 uppercase tracking-wider">
          מצב הזמנה
        </h2>
        <div className="relative">
          <div className="flex items-start justify-between">
            {visibleSteps.map((step) => {
              const Icon = step.icon;
              const state = getStepState(order.status, step.status);
              const isDone = state === "done";
              const isCurrent = state === "current";

              return (
                <div
                  key={step.status}
                  className="flex flex-col items-center flex-1 relative z-10"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isCurrent
                          ? "bg-black border-black text-white animate-pulse"
                          : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={state === "pending" ? 1.5 : 2}
                    />
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
          <div className="absolute top-5 right-[10%] left-[10%] h-0.5 -translate-y-1/2 flex">
            {visibleSteps.slice(0, -1).map((step, i) => {
              const state = getStepState(order.status, step.status);
              return (
                <div
                  key={i}
                  className={`flex-1 ${
                    state === "done" || state === "current"
                      ? "bg-emerald-500"
                      : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
          פריטים
        </h2>
        <div className="space-y-4">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
            >
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <Package
                  className="w-6 h-6 text-gray-400"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">
                  {item.kind === "studio_model"
                    ? item.localizedModelName || item.modelName
                    : item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  כמות: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-extrabold text-slate-900 shrink-0">
                {formatPrice(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
          סיכום
        </h2>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">סכום ביניים</span>
            <span className="text-foreground">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount && order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>הנחה{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">משלוח</span>
            <span className="text-foreground">
              {order.shippingCost > 0 ? formatPrice(order.shippingCost) : "חינם"}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2.5">
            <span className="font-bold text-slate-900">סה&quot;כ</span>
            <span className="font-extrabold text-lg text-slate-900">
              {formatPrice(order.total)}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-gray-500">אופן קבלה</span>
            <span className="text-foreground">
              {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
          פרטי לקוח
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 text-xs">שם</span>
            <p className="font-medium text-slate-900">
              {order.customer.fullName}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">טלפון</span>
            <p className="font-medium text-slate-900" dir="ltr">
              {order.customer.phone}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">אימייל</span>
            <p className="font-medium text-slate-900" dir="ltr">
              {order.customer.email}
            </p>
          </div>
          {order.customer.city && (
            <div>
              <span className="text-gray-500 text-xs">עיר</span>
              <p className="font-medium text-slate-900">
                {order.customer.city}
              </p>
            </div>
          )}
          {order.customer.address && (
            <div className="sm:col-span-2">
              <span className="text-gray-500 text-xs">כתובת</span>
              <p className="font-medium text-slate-900">
                {order.customer.address}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
            היסטוריית סטטוס
          </h2>
          <div className="space-y-0">
            {order.statusHistory.map((entry, i) => (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                      i === order.statusHistory.length - 1
                        ? "bg-black ring-4 ring-gray-100"
                        : "bg-gray-300"
                    }`}
                  />
                  {i < order.statusHistory.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-xs font-semibold text-slate-900">
                    {ORDER_STATUS_LABELS[entry.status]}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {new Date(entry.timestamp).toLocaleString("he-IL")}
                  </p>
                  {entry.note && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
