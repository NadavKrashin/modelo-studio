import { Suspense } from 'react';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-fade-in space-y-6">
          <div className="h-8 w-36 skeleton rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
