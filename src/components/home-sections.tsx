import Image from "next/image";
import Link from "next/link";
import type { Banner, Category } from "@/data/home";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { Button } from "./ui";

export function Arrows({ activeRight = false }: { activeRight?: boolean }) {
  const base = "flex h-6 w-6 items-center justify-center rounded-sm";
  return (
    <div className="ml-auto flex gap-1.5">
      <button type="button" aria-label="Previous" className={`${base} bg-gray-200 text-gray-500 hover:bg-gray-300`}>
        <ChevronLeftIcon size={14} />
      </button>
      <button
        type="button"
        aria-label="Next"
        className={`${base} ${activeRight ? "bg-amber-400 text-gray-900" : "bg-gray-200 text-gray-500"} hover:bg-amber-400`}
      >
        <ChevronRightIcon size={14} />
      </button>
    </div>
  );
}

export function SectionTitle({ title, link, children }: { title: string; link?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <h2 className="text-lg font-bold whitespace-nowrap text-gray-900">{title}</h2>
      {link && (
        <a href="#" className="text-xs whitespace-nowrap text-gray-500 hover:text-amber-700">
          {link} ›
        </a>
      )}
      {children}
    </div>
  );
}

/** hero-banner: text gets its own column, photo fills the right side. */
export function HeroBanner({ banner, className = "" }: { banner: Banner; className?: string }) {
  return (
    <div className={`relative grid overflow-hidden sm:min-h-64 rounded-md bg-white sm:grid-cols-2 ${className}`}>
      <div className="relative z-10 flex flex-col justify-center p-5 sm:p-8">
        {banner.eyebrow && <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase">{banner.eyebrow}</p>}
        <h2 className="mt-2 text-2xl leading-tight font-bold text-gray-900 md:text-3xl">{banner.title}</h2>
        {banner.subtitle && <p className="mt-3 hidden text-sm leading-relaxed text-gray-600 sm:block">{banner.subtitle}</p>}
        <Button variant="dark" href={banner.href} className="mt-4 w-fit sm:mt-6">
          {banner.ctaLabel ?? "Shop Now"}
        </Button>
      </div>
      <div className="relative h-32 sm:h-auto sm:min-h-48">
        <Image src={banner.image} alt={banner.imageAlt} fill preload sizes="(min-width: 768px) 380px, 100vw" className="object-cover" />
      </div>
    </div>
  );
}

/** promo-banner: photo on top, offer on solid amber below. */
export function PromoBanner({ banner }: { banner: Banner }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md bg-amber-400">
      <div className="relative hidden h-36 sm:block">
        <Image src={banner.image} alt={banner.imageAlt} fill sizes="(min-width: 768px) 380px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-1 items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-2xl font-bold text-gray-900">{banner.title}</p>
          {banner.subtitle && <p className="mt-1 text-sm text-gray-800">{banner.subtitle}</p>}
        </div>
        <Button variant="light" href={banner.href} className="shrink-0">
          {banner.ctaLabel ?? "Shop Now"}
        </Button>
      </div>
    </div>
  );
}

export function HeroBanners({ hero, promo }: { hero?: Banner; promo?: Banner }) {
  if (!hero && !promo) return null;
  return (
    <section className="bg-gray-100 py-4 sm:py-8">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:gap-5 md:grid-cols-3">
        {hero && <HeroBanner banner={hero} className={promo ? "md:col-span-2" : "md:col-span-3"} />}
        {promo && <PromoBanner banner={promo} />}
      </div>
    </section>
  );
}

/** category-tile: opens the category's search results. */
export function CategoryTile({ c }: { c: Category }) {
  return (
    <Link href={`/search?category=${c.slug}`} className="group block text-center">
      <div className="relative aspect-square overflow-hidden rounded-full bg-gray-100 ring-amber-400 transition group-hover:ring-2 group-hover:ring-offset-2">
        <Image src={c.image} alt="" fill sizes="(min-width: 768px) 120px, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-110" />
      </div>
      <p className="mt-2.5 text-xs leading-tight font-semibold text-gray-800 group-hover:text-amber-700">{c.name}</p>
    </Link>
  );
}

export function BrowseCategories({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:pt-10">
      <SectionTitle title="Browse by Category" link="All Categories">
        <Arrows activeRight />
      </SectionTitle>
      <div className="grid grid-cols-4 gap-4 md:grid-cols-8">
        {categories.map((c) => (
          <CategoryTile key={c.slug} c={c} />
        ))}
      </div>
    </section>
  );
}

/** brand-card */
export function BrandCard({ b }: { b: Banner }) {
  return (
    <Link href={b.href} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-gray-100">
        <Image src={b.image} alt={b.imageAlt} fill sizes="(min-width: 768px) 270px, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <p className="mt-3 text-[10px] tracking-wider text-gray-500 uppercase">{b.brand}</p>
      <p className="text-xs font-semibold text-gray-900 group-hover:text-amber-700">{b.title}</p>
    </Link>
  );
}

export function FeaturedBrands({ brands }: { brands: Banner[] }) {
  if (!brands.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10">
      <SectionTitle title="Featured Brands" link="All Brands">
        <Arrows />
      </SectionTitle>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {brands.map((b) => (
          <BrandCard key={b.id} b={b} />
        ))}
      </div>
    </section>
  );
}

const mailIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const lockIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export function SignupCard() {
  const input =
    "w-full rounded border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-xs placeholder:text-gray-500 focus:border-amber-400";
  return (
    <aside className="mx-auto flex w-full max-w-sm flex-col items-center rounded-md bg-orange-50 p-6 text-center lg:max-w-none">
      <p className="text-2xl font-bold text-red-500">15% OFF</p>
      <p className="mt-2 text-sm text-gray-700">
        on your first order
        <br />
        when you join as a member
      </p>
      <div className="mt-6 w-full space-y-3 text-left">
        {[
          { icon: mailIcon, type: "email", label: "Email", ph: "youremail@mail.com", auto: "email" },
          { icon: lockIcon, type: "password", label: "Password", ph: "Password", auto: "new-password" },
          { icon: lockIcon, type: "password", label: "Re-type password", ph: "Re-type Password", auto: "new-password" },
        ].map((f) => (
          <label key={f.ph} className="relative block">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">{f.icon}</span>
            <input type={f.type} placeholder={f.ph} aria-label={f.label} autoComplete={f.auto} className={input} />
          </label>
        ))}
      </div>
      <Button className="mt-6">Register Now</Button>
    </aside>
  );
}