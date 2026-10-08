import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import type { ApiGroup, DatabaseStatus, DataSource, DevTool, Feature, Layer, OnboardingStatus } from "./types";

type StepState = "done" | "todo" | "problem";

type SetupStep = { title: string; command: string; state: StepState; detail: ReactNode };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-gray-800">{children}</code>;
}

const rowsIn = (db: DatabaseStatus, table: string) => db.tables.find((t) => t.table === table)?.rows ?? 0;
const rowsOf = (s: OnboardingStatus, table: string) => rowsIn(s.database, table);

/** Tables whose row count differs from src/data, as "products has 15 rows, src/data has 16". */
function countMismatches(s: OnboardingStatus) {
  return Object.entries(s.expectedRows)
    .filter(([table, want]) => rowsOf(s, table) !== want)
    .map(([table, want]) => `${table} has ${plural(rowsOf(s, table), "row")}, src/data has ${want}`);
}

/** What the database needs, in one sentence, with the command that fixes it. */
function databaseAdvice({ database: db }: OnboardingStatus): ReactNode {
  if (db.state === "missing")
    return (
      <>
        There is no database yet at <Code>{db.file}</Code>. Run <Code>npm run db:seed</Code>.
      </>
    );
  if (db.state === "empty")
    return (
      <>
        <Code>{db.file}</Code> has tables but no data. Run <Code>npm run db:seed</Code>.
      </>
    );
  if (db.state === "outdated")
    return (
      <>
        <Code>{db.file}</Code> was built for schema version {db.schemaVersion}; the code needs version {db.expectedSchemaVersion}. Stop the dev
        server, then run <Code>npm run db:reset</Code>.
      </>
    );
  return (
    <>
      <Code>{db.file}</Code> has {plural(rowsIn(db, "products"), "product")}.
    </>
  );
}

export function setupSteps(s: OnboardingStatus): SetupStep[] {
  const ready = s.database.state === "ready";
  const mismatches = ready ? countMismatches(s) : [];
  const ranAt = s.tests && new Date(s.tests.ranAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  return [
    {
      title: `Node.js ${s.node.required} or newer`,
      command: "node -v",
      state: s.node.ok ? "done" : "problem",
      detail: s.node.ok ? `You have ${s.node.version}.` : `You have ${s.node.version}; node:sqlite needs ${s.node.required} or newer. Upgrade Node.`,
    },
    {
      title: "Install the dependencies",
      command: "npm install",
      state: "done",
      detail: (
        <>
          Done: this page is running. If npm suggests <Code>npm audit fix --force</Code>, don&apos;t run it; it breaks linting.
        </>
      ),
    },
    { title: "Seed the database", command: s.database.state === "outdated" ? "npm run db:reset" : "npm run db:seed", state: ready ? "done" : "todo", detail: databaseAdvice(s) },
    {
      title: "Check the data",
      command: "npm run db:check",
      state: !ready ? "todo" : mismatches.length ? "problem" : "done",
      detail: !ready
        ? "After seeding: compares every row with src/data."
        : mismatches.length
          ? `${mismatches.join("; ")}. Run npm run db:seed to restore it, or db:check for the details.`
          : "Every table has the rows src/data expects. db:check also compares every value.",
    },
    {
      title: "Run the app",
      command: "npm run dev",
      state: "done",
      detail: ready ? "You're looking at it. The store is at /." : "You're looking at it, but store pages fail until the database is seeded.",
    },
    {
      title: "Run the tests",
      command: "npm run test:report",
      state: !s.tests ? "todo" : s.tests.failed ? "problem" : "done",
      detail: !s.tests ? (
        "Not run yet. Results show up at /test-report."
      ) : s.tests.failed ? (
        <>
          {s.tests.failed} of {s.tests.total} failed ({ranAt}).{" "}
          <Link href="/test-report" className="font-semibold text-amber-700 hover:underline">
            See the failures
          </Link>
        </>
      ) : (
        <>
          All {s.tests.total} passed ({ranAt}).{" "}
          <Link href="/test-report" className="font-semibold text-amber-700 hover:underline">
            Open the report
          </Link>
        </>
      ),
    },
  ];
}

function StepMarker({ state, n }: { state: StepState; n: number }) {
  if (state === "done")
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <CheckIcon size={16} aria-label="Done" role="img" />
      </span>
    );
  if (state === "problem")
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
        <CloseIcon size={16} aria-label="Needs attention" role="img" />
      </span>
    );
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 text-xs font-bold text-gray-600" aria-label="To do">
      {n}
    </span>
  );
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-md bg-white p-5 sm:p-6">
      <h2 id={id} className="text-lg font-bold text-gray-900">
        {title}
      </h2>
      {intro && <p className="mt-1 max-w-3xl text-sm text-gray-600">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Summary({ status, steps }: { status: OnboardingStatus; steps: SetupStep[] }) {
  const done = steps.filter((s) => s.state === "done").length;
  const ops = status.api.flatMap((g) => g.operations);
  const db = status.database;
  const tiles = [
    { label: "Setup", value: `${done} of ${steps.length}`, note: done === steps.length ? "all steps done" : "steps done, see below" },
    {
      label: "Database",
      value: db.state === "ready" ? `${rowsOf(status, "products")} products` : { missing: "Not created", empty: "Empty", outdated: "Outdated" }[db.state],
      note: db.state === "ready" ? `${plural(db.tables.length, "table")}, seeded` : "run the seed step",
    },
    {
      label: "Tests",
      value: status.tests ? (status.tests.failed ? `${status.tests.failed} failed` : `${status.tests.passed} passed`) : "Not run",
      note: status.tests?.linesPct != null ? `${status.tests.linesPct}% of backend lines covered` : "npm run test:report",
    },
    { label: "API", value: `${ops.filter((o) => o.built).length} of ${ops.length}`, note: "operations in openapi.yaml built" },
  ];
  return (
    <section aria-labelledby="welcome-title" className="rounded-md bg-white p-5 sm:p-6">
      <h2 id="welcome-title" className="text-xl font-bold text-gray-900">
        Welcome to Farmart
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        An online grocery store with its backend in the same Next.js app. Follow the setup steps, then use the flows below to see where each feature gets its
        data. Everything on this page is read live from your machine; reload after running a command.
      </p>
      {db.state !== "ready" && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong className="font-semibold">The store can&apos;t load yet.</strong> {databaseAdvice(status)}
        </p>
      )}
      <dl className="mt-5 flex flex-wrap gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200">
        {tiles.map((t) => (
          <div key={t.label} className="flex-1 basis-36 bg-white p-4">
            <dt className="text-xs font-semibold text-gray-600">{t.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{t.value}</dd>
            <dd className="text-xs text-gray-500">{t.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  return (
    <ol className="divide-y divide-gray-100">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4 py-3 first:pt-0 last:pb-0">
          <StepMarker state={step.state} n={i + 1} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <Code>{step.command}</Code>
            </div>
            <p className="mt-0.5 text-sm text-gray-600">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

type PipelineNode = { title: string; file: string; body: ReactNode; tone?: "live" | "warn" };

function Pipeline({ status }: { status: OnboardingStatus }) {
  const db = status.database;
  const e = status.expectedRows;
  const nodes: PipelineNode[] = [
    {
      title: "Seed data",
      file: "src/data/*.ts",
      body: `The source, in git. ${e.categories} categories, ${e.products} products, ${e.banners} banners. Edit data here, not in SQLite.`,
    },
    {
      title: "Seed",
      file: "scripts/seed/seed.ts",
      body: (
        <>
          Checks src/data, then writes it in one transaction. Run by <Code>npm run db:seed</Code>; <Code>db:check</Code> compares.
        </>
      ),
    },
    {
      title: "Database",
      file: db.file,
      tone: db.state === "ready" ? "live" : "warn",
      body:
        db.state === "ready" ? (
          <ul className="tabular-nums">
            {db.tables.map((t) => (
              <li key={t.table} className="flex justify-between gap-2">
                <span className="truncate">{t.table}</span>
                <span className="font-semibold text-gray-900">{t.rows}</span>
              </li>
            ))}
          </ul>
        ) : (
          databaseAdvice(status)
        ),
    },
    {
      title: "Backend",
      file: "src/server/",
      body: "Read-only queries in catalog.ts. It never seeds: getDb() refuses a missing or empty database.",
    },
    {
      title: "Pages and API",
      file: "src/app/",
      body: "Server Components call the backend directly (HTML, RSC payload). /api routes answer client code (JSON).",
    },
    { title: "Browser", file: "localhost:3000", body: "What you see, and what the Network panel shows." },
  ];
  return (
    <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {nodes.map((node, i) => (
        <li key={node.title} className="flex flex-col items-center gap-2 lg:flex-1 lg:flex-row">
          <div
            className={`w-full flex-1 self-stretch rounded-md border p-3 text-xs text-gray-600 ${
              node.tone === "live" ? "border-emerald-300 bg-emerald-50/40" : node.tone === "warn" ? "border-red-300 bg-red-50/40" : "border-gray-200"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">{node.title}</p>
            <p className="mb-2 truncate font-mono text-[11px] text-gray-500" title={node.file}>
              {node.file}
            </p>
            <div>{node.body}</div>
          </div>
          {i < nodes.length - 1 && <ChevronRightIcon size={18} className="shrink-0 rotate-90 text-gray-500 lg:rotate-0" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

const LAYERS: Record<Layer, string> = {
  browser: "Browser",
  client: "Client component",
  page: "Page",
  route: "API route",
  server: "Backend",
  database: "SQLite",
  source: "Seed data file",
  storage: "Browser storage",
};

const SOURCES: Record<DataSource, { label: string; className: string }> = {
  sqlite: { label: "SQLite", className: "bg-emerald-50 text-emerald-700" },
  mock: { label: "Seed files, not SQLite yet", className: "bg-gray-100 text-gray-700" },
  browser: { label: "Browser only", className: "bg-gray-100 text-gray-700" },
};

function FeatureCard({ feature }: { feature: Feature }) {
  const source = SOURCES[feature.source];
  const external = feature.href.startsWith("http");
  return (
    <article className="flex flex-col rounded-md border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold text-gray-900">{feature.title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${source.className}`}>{source.label}</span>
      </div>
      <p className="mt-1 text-sm text-gray-600">{feature.summary}</p>
      <ol className="mt-4 space-y-0">
        {feature.steps.map((step, i) => (
          <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
            {i < feature.steps.length - 1 && <span className="absolute top-5 bottom-0 left-[5px] w-px bg-gray-300" aria-hidden />}
            <span className={`mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${step.layer === "database" ? "border-emerald-600 bg-emerald-600" : "border-gray-400 bg-white"}`} aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">{LAYERS[step.layer]}</p>
              <p className="font-medium break-words text-gray-900">{step.title}</p>
              {step.file && <p className="font-mono text-[11px] break-all text-gray-500">{step.file}</p>}
              {step.note && <p className="text-xs text-gray-600">{step.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      <dl className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-600">
        <div>
          <dt className="inline font-semibold text-gray-700">Response: </dt>
          <dd className="inline">{feature.response}</dd>
        </div>
        {feature.tests && (
          <div>
            <dt className="inline font-semibold text-gray-700">Tests: </dt>
            <dd className="inline">{feature.tests}</dd>
          </div>
        )}
      </dl>
      <div className="mt-auto pt-3">
        {external ? (
          <a href={feature.href} className="text-sm font-semibold text-amber-700 hover:underline">
            {feature.hrefLabel} ›
          </a>
        ) : (
          <Link href={feature.href} className="text-sm font-semibold text-amber-700 hover:underline">
            {feature.hrefLabel} ›
          </Link>
        )}
      </div>
    </article>
  );
}

function ApiTable({ groups }: { groups: ApiGroup[] }) {
  return (
    <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
      {groups.map((g) => {
        const built = g.operations.filter((o) => o.built).length;
        return (
          <details key={g.tag} className="group" open={built > 0 && built < g.operations.length}>
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
              <ChevronRightIcon size={16} className="shrink-0 text-gray-500 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden />
              <span className="font-semibold text-gray-900">{g.tag}</span>
              <span className="hidden truncate text-xs text-gray-500 sm:inline">{g.about}</span>
              <span
                className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                  built === g.operations.length ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                {built} of {g.operations.length} built
              </span>
            </summary>
            <ul className="border-t border-gray-100 px-4 py-2">
              {g.operations.map((o) => (
                <li key={`${o.method} ${o.path}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1 text-sm">
                  <span className="w-14 shrink-0 font-mono text-[11px] font-semibold text-gray-700">{o.method}</span>
                  <span className="min-w-0 font-mono text-xs break-all text-gray-900">{o.path}</span>
                  <span className="text-xs text-gray-600">{o.summary}</span>
                  <span className={`ml-auto text-[11px] font-semibold ${o.built ? "text-emerald-700" : "text-gray-500"}`}>{o.built ? "Built" : "Planned"}</span>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function ToolLink({ tool }: { tool: DevTool }) {
  const body = (
    <>
      <span className="flex items-center gap-1 font-semibold text-gray-900 group-hover:text-amber-700">
        {tool.title}
        <ChevronRightIcon size={14} aria-hidden />
      </span>
      <span className="mt-0.5 block text-xs text-gray-600">{tool.about}</span>
      <span className="mt-1 block font-mono text-[11px] text-gray-500">reads {tool.reads}</span>
    </>
  );
  const className = "group block rounded-md border border-gray-200 p-3 hover:border-amber-400";
  return tool.external ? (
    <a href={tool.href} className={className}>
      {body}
    </a>
  ) : (
    <Link href={tool.href} className={className}>
      {body}
    </Link>
  );
}

export default function OnboardingView({
  status,
  features,
  devTools,
  commands,
}: {
  status: OnboardingStatus;
  features: Feature[];
  devTools: DevTool[];
  commands: { command: string; when: string }[];
}) {
  const steps = setupSteps(status);
  return (
    <div className="space-y-6">
      <Summary status={status} steps={steps} />

      <Section id="setup-title" title="1. Get set up" intro="In this order. Each step shows its live state; reload the page after running a command.">
        <SetupChecklist steps={steps} />
      </Section>

      <Section
        id="pipeline-title"
        title="2. How the data flows"
        intro={
          <>
            One direction only. The starting data lives in <Code>src/data</Code>; the seed copies it into SQLite; the app only reads SQLite. To change data for
            everyone, edit <Code>src/data</Code> and seed again.
          </>
        }
      >
        <Pipeline status={status} />
      </Section>

      <Section
        id="features-title"
        title="3. Every feature, end to end"
        intro="What happens from the click to the data, for each feature that exists today. Planned features are in the API section below."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      </Section>

      <Section
        id="api-title"
        title="4. API: built and planned"
        intro={
          <>
            Read from <Code>openapi.yaml</Code>, the contract written before the code. Built operations are tested against it; the rest are the backlog.
          </>
        }
      >
        <ApiTable groups={status.api} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="tools-title" title="Dev tools" intro="Each one reads a file in the repo, so it's always current.">
          <div className="grid gap-3 sm:grid-cols-2">
            {devTools.map((t) => (
              <ToolLink key={t.href} tool={t} />
            ))}
          </div>
        </Section>
        <Section id="commands-title" title="Everyday commands">
          <dl className="divide-y divide-gray-100">
            {commands.map((c) => (
              <div key={c.command} className="py-2 first:pt-0 last:pb-0">
                <dt>
                  <Code>{c.command}</Code>
                </dt>
                <dd className="mt-0.5 text-sm text-gray-600">{c.when}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </div>
  );
}
