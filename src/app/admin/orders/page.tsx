import { Suspense } from 'react';
import { OrdersClient } from './OrdersClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersClient />
    </Suspense>
  );
}

function OrdersSkeleton() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="h-10 w-48 skeleton rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 skeleton rounded-xl" />
        ))}
      </div>
    </div>
  );
}
