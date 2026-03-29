import { Suspense } from 'react';
import { CouponsClient } from './CouponsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminCouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-fade-in">
          <div className="mb-6 h-10 w-48 skeleton rounded-lg" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <CouponsClient />
    </Suspense>
  );
}
