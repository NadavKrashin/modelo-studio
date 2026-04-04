import { PricingSettingsClient } from './PricingSettingsClient';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">הגדרות כלליות</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          מחירי בסיס גלובליים, משלוח, כיסוי אקרילי והנחות באנדל — נשמרים ב-Firestore במסמך{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">settings/pricing</code>.
        </p>
      </div>

      <PricingSettingsClient />
    </div>
  );
}
