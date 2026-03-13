export default function AboutPage() {
  return (
    <section className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 space-y-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
          About Modelo
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl">
          Modelo is a modern 3D printing service that makes it simple to turn digital ideas into
          high‑quality physical objects. We combine a curated catalog of 3D models with a tailored
          production workflow.
        </p>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl">
          With Modelo Studio you can browse ready‑to‑print designs, customize them, and order in a few clicks.
          With Modelo Personal (coming soon), you will be able to create fully bespoke figures based on
          photos, sketches, or concepts.
        </p>
      </div>
    </section>
  );
}

