"use client";

import Image from "next/image";
import { useState } from "react";
import { DiscountBadge } from "./ui";

/** product-gallery (DESIGN.md): 1:1 photo well; thumbnail row only when there's more than one photo. */
export default function ProductGallery({ images, alt, discount = 0 }: { images: string[]; alt: string; discount?: number }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-md bg-gray-50">
        {discount > 0 && <DiscountBadge percent={discount} className="absolute top-4 left-4 z-10" />}
        <Image
          src={images[active]}
          alt={alt}
          fill
          preload
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 overflow-hidden rounded-md bg-gray-50 transition ${
                i === active ? "ring-2 ring-amber-400 ring-offset-2" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
