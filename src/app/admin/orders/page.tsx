import { Suspense } from 'react';
import { OrdersClient } from './OrdersClient';
import { getOrderService, getFilamentService } from '@/lib/services/container';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOrdersPage() {
  const orderService = getOrderService();
  const filamentService = getFilamentService();
  const result = await orderService.listOrders({ page: 1, pageSize: 100 });
  const filamentOptions = await filamentService.getAllFilamentOptions();

  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersClient
        initialOrders={JSON.parse(JSON.stringify(result.items))}
        filamentOptions={filamentOptions}
      />
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
