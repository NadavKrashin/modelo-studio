/**
 * Renders Firestore-backed legal copy: one `<p>` per non-empty line (same typography as legacy static pages).
 */
export function LegalContentParagraphs({
  content,
  paragraphClassName,
}: {
  content: string;
  paragraphClassName: string;
}) {
  const lines = content.split('\n').filter((line) => line.trim().length > 0);

  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className={paragraphClassName}>
          {line}
        </p>
      ))}
    </>
  );
}
