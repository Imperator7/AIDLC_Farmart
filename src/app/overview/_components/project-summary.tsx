import Link from "next/link";
import type { ReactNode } from "react";

export type ProjectStats = {
  routes: { route: string; title: string; area: "Store" | "Dev tool"; pages: number; href: string }[];
  pagesTotal: number;
  storePages: number;
  products: number;
  categories: number;
  brands: number;
  overlays: number;
  planned: string[];
  components: number;
  colors: number;
  knownGaps: number;
  stories: number;
  storyFiles: number;
  stack: { name: string; version: string }[];
};

// nodrag/nopan: the summary lives inside the React Flow canvas, so links must not start a drag or pan.
const linkCls = "nodrag nopan";

function Stat({ value, label, note, href }: { value: number; label: string; note: string; href?: string }) {
  const body = (
    <>
      <p className="text-2xl leading-none font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs font-semibold text-gray-900">{label}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{note}</p>
    </>
  );
  const cls = "block rounded-md border border-gray-200 bg-white p-3";
  return href ? (
    <Link href={href} className={`${linkCls} ${cls} hover:border-amber-400`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** "Project overview": key counts, every route and the stack. Rendered as a card on the /overview canvas. */
export default function ProjectSummary({ stats: s, children }: { stats: ProjectStats; children?: ReactNode }) {
  return (
    <section aria-labelledby="project-overview" className="w-[560px] rounded-lg border border-gray-300 bg-gray-50 p-5 text-left shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="project-overview" className="text-lg font-bold text-gray-900">
          Project overview
        </h2>
        <p className="text-[11px] text-gray-400">Counted from the source at build time</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat value={s.pagesTotal} label="Pages" note={`${s.routes.length} routes · ${s.storePages} in the store`} />
        <Stat value={s.products} label="Products" note={`${s.categories} categories · ${s.brands} brands`} href={s.routes[1].href} />
        <Stat value={s.overlays} label="Overlays" note="Cart drawer, dialog, mobile menu" />
        <Stat value={s.planned.length} label="Not built yet" note={s.planned.join(", ")} />
        <Stat value={s.components} label="Design components" note={`${s.colors} color tokens · ${s.knownGaps} known gaps`} href="/design" />
        <Stat value={s.stories} label="Stories" note={`${s.storyFiles} files · each runs as a test`} />
      </div>

      <table className="mt-4 w-full overflow-hidden rounded-md bg-white text-left text-xs ring-1 ring-gray-200">
        <caption className="sr-only">Routes</caption>
        <thead className="bg-gray-100 text-[11px] text-gray-500">
          <tr>
            <th className="px-3 py-1.5 font-semibold">Route</th>
            <th className="px-3 py-1.5 font-semibold">Screen</th>
            <th className="px-3 py-1.5 text-right font-semibold">Pages</th>
            <th className="px-3 py-1.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {s.routes.map((r) => (
            <tr key={r.route}>
              <td className="px-3 py-1.5 font-mono text-[11px] text-amber-700">{r.route}</td>
              <td className="px-3 py-1.5 text-gray-900">
                {r.title} <span className="text-[10px] text-gray-400">· {r.area}</span>
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.pages}</td>
              <td className="px-3 py-1.5 text-right">
                <Link href={r.href} className={`${linkCls} font-semibold text-sky-700 hover:underline`}>
                  Open →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-gray-200 bg-gray-100 font-semibold">
          <tr>
            <td className="px-3 py-1.5" colSpan={2}>
              Total (plus a 404 page)
            </td>
            <td className="px-3 py-1.5 text-right tabular-nums">{s.pagesTotal}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      <p className="mt-4 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Stack</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {s.stack.map((t) => (
          <li key={t.name} className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-gray-700">
            {t.name} <span className="font-mono text-gray-900">{t.version}</span>
          </li>
        ))}
      </ul>

      {children && <div className="mt-4 border-t border-gray-200 pt-3">{children}</div>}
    </section>
  );
}
