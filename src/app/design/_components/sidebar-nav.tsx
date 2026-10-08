"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; title: string; section: string };

export default function SidebarNav({ items, sections }: { items: Item[]; sections: string[] }) {
  const pathname = usePathname();
  const link = (href: string, title: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`block rounded px-2 py-1.5 text-sm ${
          active ? "bg-amber-50 font-semibold text-amber-700" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {title}
      </Link>
    );
  };

  return (
    <nav aria-label="Design system" className="space-y-5">
      {link("/design", "Overview")}
      {sections.map((s) => (
        <div key={s}>
          <p className="mb-1 px-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">{s}</p>
          <ul>
            {items
              .filter((i) => i.section === s)
              .map((i) => (
                <li key={i.href}>{link(i.href, i.title)}</li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
