"use client";

import Image from "next/image";
import Link from "next/link";

const PRODUCTS = [
  {
    id: "cube-15",
    slug: "cube",
    title: "מודלו סיטיז - קובייה 15x15 ס״מ",
    price: 199,
    image: "/images/cities/tel-aviv.jpeg",
    dims: "15 × 15 ס״מ",
  },
  {
    id: "mini-cube-10",
    slug: "minicube",
    title: "מיני קובייה 10x10 ס״מ",
    price: 159,
    image: "/images/cities/london.jpeg",
    dims: "10 × 10 ס״מ",
  },
] as const;

export default function CitiesProductsPage() {
  return (
    <div className="bg-white min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            בחרו את הפורמט שלכם
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            כל פורמט מיוצר בהדפסת 3D מדויקת וממוסגר בעבודת יד.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={`/cities/${product.slug}`}
              className="group block"
            >
              <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 relative">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-5">
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-black transition-colors">
                  {product.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{product.dims}</p>
                <p className="text-2xl font-extrabold text-black mt-2">
                  ₪{product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
