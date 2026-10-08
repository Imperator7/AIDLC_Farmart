import type { ColorDoc } from "@/lib/design-md";

/** Minimal inline markdown: `code`, **bold**, *em* and {token.refs}. */
export function Md({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\{[a-z]+\.[a-z0-9-]+\})/).map((part, i) =>
        part.startsWith("{") ? (
          <code key={i} className="rounded bg-amber-50 px-1 py-0.5 font-mono text-[0.85em] text-amber-700">
            {part.slice(1, -1)}
          </code>
        ) : part.startsWith("`") ? (
          <code key={i} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-gray-800">
            {part.slice(1, -1)}
          </code>
        ) : part.startsWith("**") ? (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        ) : part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <em key={i}>{part.slice(1, -1)}</em>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Block-level markdown for a DESIGN.md section: ### headings, paragraphs, lists and tables. */
export function MdBlocks({ md }: { md: string }) {
  // A lead-in line directly followed by a list ("Every overlay must:\n1. …") becomes two blocks.
  const blocks = md
    .trim()
    .split(/\n\s*\n/)
    .flatMap((b) => {
      const at = b.search(/\n(- |\d+\. )/);
      return at > 0 && !/^(- |\d+\. |\|)/.test(b) ? [b.slice(0, at), b.slice(at + 1)] : [b];
    });
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        if (block.startsWith("### ")) {
          return (
            <h3 key={i} className="pt-6 text-lg font-bold text-gray-900">
              {block.slice(4)}
            </h3>
          );
        }
        if (lines.every((l) => l.startsWith("|"))) {
          const rows = lines.filter((l) => !/^\|[-\s|]+\|$/.test(l)).map((l) => l.slice(1, -1).split("|").map((c) => c.trim()));
          const [head, ...body] = rows;
          return (
            <div key={i} className="overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    {head.map((h, j) => (
                      <th key={j} className="p-3 font-semibold">
                        <Md text={h} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 align-top">
                  {body.map((r, j) => (
                    <tr key={j}>
                      {r.map((c, k) => (
                        <td key={k} className={`p-3 text-xs leading-relaxed ${k === 0 ? "font-semibold whitespace-nowrap text-gray-900" : "text-gray-600"}`}>
                          <Md text={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (lines.every((l) => /^(- |\d+\. )/.test(l))) {
          const ordered = /^\d+\. /.test(lines[0]);
          const Tag = ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={`space-y-2 pl-5 text-sm leading-relaxed text-gray-700 ${ordered ? "list-decimal" : "list-disc"}`}>
              {lines.map((l, j) => (
                <li key={j}>
                  <Md text={l.replace(/^(- |\d+\. )/, "")} />
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i} className="max-w-3xl text-sm leading-relaxed text-gray-700">
            <Md text={lines.join(" ")} />
          </p>
        );
      })}
    </div>
  );
}

function isDark(color: string) {
  const m = color.match(/^#([0-9a-f]{6})$/i);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 150;
}

export function Swatch({ c }: { c: ColorDoc }) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="flex h-20 items-end p-2" style={{ background: c.value }}>
        <span className={`font-mono text-[11px] ${isDark(c.value) ? "text-white" : "text-gray-900"}`}>{c.value}</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900">{c.label ?? c.key}</p>
        <p className="font-mono text-[11px] text-gray-500">
          colors.{c.key}
          {c.tailwind && <span className="text-gray-400"> · {c.tailwind}</span>}
        </p>
        {c.doc && (
          <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
            <Md text={c.doc} />
          </p>
        )}
      </div>
    </div>
  );
}

export function Specimen({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md border border-gray-200 bg-gray-100 p-6">{children}</div>;
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-10 text-sm font-bold tracking-wide text-gray-500 uppercase first:mt-0">{children}</h2>;
}

/** Spec card for one DESIGN.md component: prose + token props. */
export function ComponentDoc({ name, doc, props }: { name: string; doc?: string; props?: Record<string, string> }) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <p className="font-mono text-xs font-bold text-gray-900">{name}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
        <Md text={doc ?? "No prose entry in DESIGN.md."} />
      </p>
      {props && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(props).map(([prop, val]) => (
            <span key={prop} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
              {prop}: {String(val)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Overlay anatomy diagrams ---------- */

function Region({ label, note, className = "", children }: { label: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative outline-1 outline-offset-[-1px] outline-amber-500 outline-dashed ${className}`}>
      <span className="absolute -top-2 left-2 z-10 rounded-sm bg-amber-500 px-1 text-[9px] leading-4 font-bold text-white uppercase">
        {label}
        {note && <span className="font-normal normal-case opacity-90"> · {note}</span>}
      </span>
      {children}
    </div>
  );
}

const Line = ({ w = "w-full", className = "" }: { w?: string; className?: string }) => <div className={`h-1.5 rounded-full bg-gray-200 ${w} ${className}`} />;

function FakePage() {
  return (
    <div className="absolute inset-0 space-y-3 p-4">
      <div className="h-6 rounded bg-white" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-14 rounded bg-white" />
        ))}
      </div>
    </div>
  );
}

function Scrim() {
  return (
    <div className="absolute inset-0 bg-black/40">
      <span className="absolute top-2 left-2 rounded-sm bg-gray-900 px-1 text-[9px] leading-4 font-bold text-white uppercase">Scrim · colors.scrim</span>
    </div>
  );
}

export function OverlayAnatomy({ kind }: { kind: "dialog" | "drawer" }) {
  return (
    <figure>
      <div className="relative h-80 overflow-hidden rounded-md bg-gray-100">
        <FakePage />
        <Scrim />
        {kind === "dialog" ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <Region label="Container" note="400px · rounded.md · p 24" className="w-72 rounded-md bg-white p-4 pt-5 shadow-2xl">
              <Region label="Header" note="section-title" className="px-2 pt-3 pb-2">
                <p className="text-sm font-bold text-gray-900">Clear your cart?</p>
              </Region>
              <Region label="Body" note="body-md" className="mt-3 space-y-1.5 px-2 pt-3 pb-2">
                <Line />
                <Line w="w-2/3" />
              </Region>
              <Region label="Footer" note="ghost + danger" className="mt-3 flex justify-end gap-2 px-2 pt-3 pb-2">
                <span className="rounded border border-gray-200 px-2.5 py-1 text-[10px] font-bold">Cancel</span>
                <span className="rounded bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white">Clear cart</span>
              </Region>
            </Region>
          </div>
        ) : (
          <Region label="Container" note="448px · full height" className="absolute top-3 right-0 bottom-0 flex w-60 flex-col bg-white pt-3 shadow-2xl">
            <Region label="Header" note="title + count + ×" className="mx-2 mt-1 flex items-center justify-between px-2 pt-3 pb-2">
              <p className="text-xs font-bold text-gray-900">
                Your Cart <span className="font-normal text-gray-400">(4)</span>
              </p>
              <span className="text-gray-400">×</span>
            </Region>
            <div className="mx-2 mt-2 px-2 py-1.5">
              <Line className="bg-emerald-200" />
            </div>
            <Region label="Body" note="only scroll area" className="mx-2 mt-2 flex-1 space-y-2.5 overflow-hidden px-2 pt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="h-8 w-8 shrink-0 rounded bg-gray-200" />
                  <div className="flex-1 space-y-1">
                    <Line />
                    <Line w="w-1/2" />
                  </div>
                </div>
              ))}
            </Region>
            <Region label="Footer" note="summary + actions" className="m-2 mt-3 space-y-1.5 bg-gray-50 px-2 pt-4 pb-2">
              <Line w="w-3/4" />
              <Line w="w-1/2" />
              <div className="h-5 rounded bg-amber-400" />
            </Region>
          </Region>
        )}
      </div>
      <figcaption className="mt-2 text-xs text-gray-500">
        {kind === "dialog" ? "dialog: centered, one decision" : "cart-drawer: right edge, a workspace"}
      </figcaption>
    </figure>
  );
}
