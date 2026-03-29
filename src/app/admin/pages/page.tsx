import fs from 'fs';
import path from 'path';
import { SiteContentPagesClient } from './SiteContentPagesClient';

export default function AdminContentPagesPage() {
  const termsDefault = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/content/terms-default.txt'),
    'utf8',
  );
  const accessibilityDefault = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/content/accessibility-default.txt'),
    'utf8',
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">עמודי תוכן</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          עריכת תקנון ומדיניות פרטיות והצהרת נגישות — נשמר ב-Firestore (אוסף site-content).
        </p>
      </div>
      <SiteContentPagesClient
        termsDefault={termsDefault}
        accessibilityDefault={accessibilityDefault}
      />
    </div>
  );
}
