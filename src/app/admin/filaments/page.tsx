import { Suspense } from 'react';
import { FilamentsClient } from './FilamentsClient';
import { getFilamentService } from '@/lib/services/container';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminFilamentsPage() {
  const service = getFilamentService();
  const filaments = await service.getAllFilaments();

  return (
    <Suspense fallback={<div className="animate-fade-in"><div className="h-10 w-48 skeleton rounded-lg mb-6" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}</div></div>}>
      <FilamentsClient initialFilaments={JSON.parse(JSON.stringify(filaments))} />
    </Suspense>
  );
}
