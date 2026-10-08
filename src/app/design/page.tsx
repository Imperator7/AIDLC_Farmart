import type { Metadata } from "next";
import Link from "next/link";
import { loadDesign } from "@/lib/design-md";
import { Md } from "./_components/parts";
import { pages, sections } from "./_components/registry";

export const metadata: Metadata = {
  title: "Design System - Farmart",
  description: "Living reference of the Farmart design system, generated from DESIGN.md.",
};

export default async function DesignOverview() {
  const d = await loadDesign();

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-700">{d.tokens.description}</p>
        <div className="mt-6 max-w-3xl space-y-3 text-sm leading-relaxed text-gray-600">
          {d.overview.map((p, i) => (
            <p key={i}>
              <Md text={p} />
            </p>
          ))}
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {d.keyCharacteristics.map((k, i) => (
            <li key={i} className="rounded-md border-l-4 border-amber-400 bg-gray-50 p-3 text-sm text-gray-700">
              <Md text={k} />
            </li>
          ))}
        </ul>
      </section>

      {sections.map((s) => (
        <section key={s}>
          <h2 className="mb-4 text-sm font-bold tracking-wide text-gray-500 uppercase">{s}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pages
              .filter((p) => p.section === s)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/design/${p.slug}`}
                  className="group rounded-md border border-gray-200 p-4 transition hover:border-amber-400 hover:shadow-lg"
                >
                  <p className="font-semibold text-gray-900 group-hover:text-amber-700">{p.title} →</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{p.summary}</p>
                  {p.keys && <p className="mt-2 font-mono text-[10px] text-gray-400">{p.keys.join(" · ")}</p>}
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
