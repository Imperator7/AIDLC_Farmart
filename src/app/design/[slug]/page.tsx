import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDesign } from "@/lib/design-md";
import { ComponentDoc, Md, MdBlocks, OverlayAnatomy, Specimen, SubTitle, Swatch } from "../_components/parts";
import { overlaySlugs, pageBySlug, pages, type DesignPageDef } from "../_components/registry";

// Only the pages in the registry exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/design/[slug]">): Promise<Metadata> {
  const page = pageBySlug((await params).slug);
  return { title: `${page?.title ?? "Design"} - Farmart Design System`, description: page?.summary };
}

type Design = Awaited<ReturnType<typeof loadDesign>>;

const elevationClass: Record<string, string> = {
  Flat: "",
  Lifted: "border-2 border-gray-200 shadow-md",
  Hover: "shadow-lg",
  Dropdown: "shadow-lg",
  Overlay: "shadow-2xl",
};

function Foundation({ page, d }: { page: DesignPageDef; d: Design }) {
  const { tokens } = d;
  switch (page.kind) {
    case "colors":
      return (
        <div>
          {d.colorGroups.map((g) => (
            <div key={g.title}>
              <SubTitle>{g.title}</SubTitle>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {g.colors.map((c) => (
                  <Swatch key={c.key} c={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case "typography":
      return (
        <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {Object.entries(tokens.typography).map(([role, t]) => (
            <div key={role} className="grid gap-2 p-4 md:grid-cols-[220px_1fr] md:items-center">
              <div>
                <p className="font-mono text-xs font-semibold text-gray-900">typography.{role}</p>
                <p className="font-mono text-[11px] text-gray-500">
                  {t.fontSize} / {t.fontWeight} / {t.lineHeight}
                  {t.letterSpacing !== 0 && ` / ${t.letterSpacing}`}
                </p>
                {d.typeUsage[role] && <p className="mt-1 text-[11px] text-gray-500">{d.typeUsage[role]}</p>}
              </div>
              <p
                className="truncate text-gray-900"
                style={{
                  fontSize: t.fontSize,
                  fontWeight: t.fontWeight,
                  lineHeight: t.lineHeight,
                  letterSpacing: t.letterSpacing,
                  textTransform: t.textTransform as React.CSSProperties["textTransform"],
                }}
              >
                {role === "price" ? "$29.50" : "Fresh groceries, delivered today"}
              </p>
            </div>
          ))}
        </div>
      );

    case "shape":
      return (
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SubTitle>rounded</SubTitle>
            <div className="flex flex-wrap gap-4">
              {Object.entries(tokens.rounded).map(([k, v]) => (
                <div key={k} className="text-center">
                  <div className="h-16 w-16 border-2 border-amber-400 bg-amber-50" style={{ borderRadius: v }} />
                  <p className="mt-1.5 font-mono text-[11px] text-gray-700">{k}</p>
                  <p className="font-mono text-[11px] text-gray-400">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SubTitle>spacing</SubTitle>
            <div className="space-y-2">
              {Object.entries(tokens.spacing).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-20 font-mono text-[11px] text-gray-700">{k}</span>
                  <span className="h-3 rounded-sm bg-amber-400" style={{ width: `min(${v}, 100%)` }} />
                  <span className="font-mono text-[11px] text-gray-400">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "elevation":
      return (
        <div className="grid gap-5 rounded-md bg-gray-100 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {d.elevation.map(([tier, style, usedFor]) => (
            <div key={tier} className={`rounded-md bg-white p-4 ${elevationClass[tier] ?? ""}`}>
              <p className="text-sm font-bold text-gray-900">{tier}</p>
              <p className="mt-1 text-[11px] text-gray-500">
                <Md text={style} />
              </p>
              <p className="mt-2 text-xs text-gray-600">
                <Md text={usedFor} />
              </p>
            </div>
          ))}
        </div>
      );

    case "overlays":
      return (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Link href="/design/dialog" className="group">
              <OverlayAnatomy kind="dialog" />
              <p className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-amber-700">Dialog page →</p>
            </Link>
            <Link href="/design/cart-drawer" className="group">
              <OverlayAnatomy kind="drawer" />
              <p className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-amber-700">Cart drawer page →</p>
            </Link>
          </div>
          <MdBlocks md={d.overlaysMd} />
        </div>
      );

    case "responsive":
      return (
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Width</th>
                <th className="p-3">Key changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {d.breakpoints.map(([name, width, changes]) => (
                <tr key={name}>
                  <td className="p-3 font-semibold text-gray-900">{name}</td>
                  <td className="p-3 font-mono text-xs whitespace-nowrap text-gray-600">{width}</td>
                  <td className="p-3 text-xs text-gray-600">
                    <Md text={changes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "gaps":
      return (
        <ul className="space-y-2">
          {d.knownGaps.map((g, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-amber-500">•</span>
              <span>
                <Md text={g} />
              </span>
            </li>
          ))}
        </ul>
      );
  }
}

function ComponentPage({ page, d }: { page: DesignPageDef; d: Design }) {
  return (
    <div className="space-y-8">
      {overlaySlugs.includes(page.slug) && (
        <p className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-gray-700">
          This is an <strong>overlay</strong>. Its anatomy and behavior follow the shared{" "}
          <Link href="/design/overlays" className="font-semibold text-amber-700 underline">
            Overlays pattern
          </Link>
          , which covers when to use it, header/body/footer rules, Escape and focus.
        </p>
      )}
      {page.intro && (
        <section>
          <SubTitle>Anatomy</SubTitle>
          <div className="max-w-xl">{page.intro}</div>
        </section>
      )}
      <section>
        <SubTitle>Live example</SubTitle>
        <Specimen>{page.specimen}</Specimen>
      </section>
      <section>
        <SubTitle>Spec</SubTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          {page.keys!.map((k) => (
            <ComponentDoc key={k} name={k} doc={d.componentDocs[k]} props={d.tokens.components[k]} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function DesignTopicPage({ params }: PageProps<"/design/[slug]">) {
  const { slug } = await params;
  const page = pageBySlug(slug);
  if (!page) notFound();
  const d = await loadDesign();

  const i = pages.indexOf(page);
  const prev = pages[i - 1];
  const next = pages[i + 1];

  return (
    <article>
      <p className="text-xs font-bold tracking-wider text-amber-600 uppercase">{page.section}</p>
      <h1 className="mt-1 text-3xl font-bold text-gray-900">{page.title}</h1>
      <p className="mt-2 mb-8 max-w-3xl text-sm text-gray-500">{page.summary}</p>

      {page.keys ? <ComponentPage page={page} d={d} /> : <Foundation page={page} d={d} />}

      <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 text-sm" aria-label="Previous and next">
        {prev ? (
          <Link href={`/design/${prev.slug}`} className="rounded-md border border-gray-200 p-3 hover:border-amber-400">
            <span className="text-xs text-gray-400">← Previous</span>
            <span className="block font-semibold text-gray-900">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/design/${next.slug}`} className="rounded-md border border-gray-200 p-3 text-right hover:border-amber-400">
            <span className="text-xs text-gray-400">Next →</span>
            <span className="block font-semibold text-gray-900">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
