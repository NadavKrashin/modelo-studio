import { Suspense } from 'react';
import { OrderTracker } from '@/app/(storefront)/order/track/OrderTracker';

export default function OrderTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-pulse-soft text-muted">טוען...</div>
        </div>
      }
    >
      <OrderTracker />
    </Suspense>
  );
}

