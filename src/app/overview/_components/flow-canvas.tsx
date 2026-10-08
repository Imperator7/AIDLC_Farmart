"use client";

import {
  Background,
  ConnectionMode,
  Controls,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ProjectSummary from "./project-summary";
import { wireframes } from "./wireframes";
import { linkStyles, type FlowEdge, type FlowNode, type LabelNode, type ScreenData, type ScreenKind, type ScreenNode, type SummaryNode } from "./flow-graph";

const kindStyles: Record<ScreenKind, { badge: string; ring: string; label: string; mini: string }> = {
  page: { badge: "bg-gray-900 text-white", ring: "border-gray-300", label: "Page", mini: "#111827" },
  overlay: { badge: "bg-amber-400 text-gray-900", ring: "border-amber-300", label: "Overlay", mini: "#f59e0b" },
  planned: { badge: "bg-gray-100 text-gray-500", ring: "border-dashed border-gray-300", label: "Not built", mini: "#d1d5db" },
  tool: { badge: "bg-sky-100 text-sky-800", ring: "border-sky-200", label: "Dev tool", mini: "#7dd3fc" },
};

// Every side has a handle; ConnectionMode.Loose lets edges start or end on any of them.
const sides = [
  { id: "t", position: Position.Top },
  { id: "r", position: Position.Right },
  { id: "b", position: Position.Bottom },
  { id: "l", position: Position.Left },
];

/** A real screenshot of the screen, cropped from the top in a 16:10 frame. */
function Shot({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-gray-200 bg-gray-50">
      <Image src={src} alt={`Screenshot: ${alt}`} fill sizes={sizes} className="object-cover object-top" />
    </div>
  );
}

/** The card's link to the real screen. External tools open in a new tab. */
function OpenLink({ data, className }: { data: ScreenData; className: string }) {
  if (!data.href) return null;
  const label = `${data.hrefLabel ?? `Open ${data.route ?? data.title}`} →`;
  // nodrag/nopan: clicking the link must not start a drag or pan on the canvas.
  const cls = `nodrag nopan ${className}`;
  return data.href.startsWith("http") ? (
    <a href={data.href} target="_blank" rel="noreferrer" className={cls}>
      {label}
    </a>
  ) : (
    <Link href={data.href} className={cls}>
      {label}
    </Link>
  );
}

function ScreenCard({ id, data, selected }: NodeProps<ScreenNode>) {
  const k = kindStyles[data.kind];
  const Wireframe = wireframes[id];
  return (
    <div
      className={`w-[260px] rounded-lg border bg-white text-left shadow-sm transition-shadow ${k.ring} ${
        data.kind === "planned" ? "bg-gray-50" : ""
      } ${selected ? "shadow-lg ring-2 ring-amber-400" : ""}`}
    >
      {sides.map((s) => (
        <Handle key={s.id} id={s.id} type="source" position={s.position} className="!h-2 !w-2 !border-white !bg-gray-300" />
      ))}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${k.badge}`}>{k.label}</span>
        {data.count !== undefined && <span className="text-[11px] font-semibold text-gray-500">× {data.count} pages</span>}
      </div>
      <div className="px-3 py-2.5">
        <p className={`font-bold ${data.kind === "planned" ? "text-gray-500" : "text-gray-900"}`}>{data.title}</p>
        {data.route && <p className="font-mono text-[11px] text-amber-700">{data.route}</p>}
        <div className="mt-2">{data.shot ? <Shot src={data.shot} alt={data.title} sizes="520px" /> : Wireframe && <Wireframe />}</div>
        <p className="mt-2 text-xs text-gray-500">{data.summary}</p>
      </div>
      {data.href ? (
        <OpenLink
          data={data}
          className="flex items-center justify-center rounded-b-lg border-t border-gray-100 py-2 text-xs font-semibold text-sky-700 hover:bg-amber-50 hover:text-amber-700"
        />
      ) : (
        <p className="rounded-b-lg border-t border-dashed border-gray-200 py-2 text-center text-xs text-gray-400">Not built yet</p>
      )}
    </div>
  );
}

function GroupLabel({ data }: NodeProps<LabelNode>) {
  return (
    <div className="pointer-events-none">
      <p className="text-lg font-bold text-gray-900">{data.title}</p>
      <p className="text-xs text-gray-500">{data.note}</p>
    </div>
  );
}

function SummaryCard({ data }: NodeProps<SummaryNode>) {
  return (
    <ProjectSummary stats={data.stats}>
      <Legend inline />
    </ProjectSummary>
  );
}

const nodeTypes = { screen: ScreenCard, label: GroupLabel, summary: SummaryCard };

function Details({ id, data, nodes, edges, onClose }: { id: string; data: ScreenData; nodes: FlowNode[]; edges: FlowEdge[]; onClose: () => void }) {
  const title = (nodeId: string) => {
    const n = nodes.find((x) => x.id === nodeId);
    return n && n.type !== "summary" ? n.data.title : nodeId;
  };
  const outgoing = edges.filter((e) => e.source === id);
  const incoming = edges.filter((e) => e.target === id);

  return (
    <aside
      className="max-h-[calc(100%-2rem)] w-[340px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-lg"
      aria-label={`${data.title} details`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900">{data.title}</p>
          {data.file && <p className="font-mono text-[11px] break-all text-gray-500">{data.file}</p>}
        </div>
        <button type="button" aria-label="Close details" onClick={onClose} className="text-xl leading-none text-gray-400 hover:text-gray-900">
          ×
        </button>
      </div>
      {data.shot && (
        <a href={data.shot} target="_blank" rel="noreferrer" className="mt-3 block" title="Open full screenshot">
          <Shot src={data.shot} alt={data.title} sizes="680px" />
        </a>
      )}
      <p className="mt-3 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">On this screen</p>
      <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
        {data.parts.map((part) => (
          <li key={part} className="flex gap-1.5">
            <span className="text-gray-300">•</span>
            {part}
          </li>
        ))}
      </ul>
      {[
        { heading: "Leads to", list: outgoing, other: (e: FlowEdge) => e.target },
        { heading: "Reached from", list: incoming, other: (e: FlowEdge) => e.source },
      ].map(({ heading, list, other }) =>
        list.length > 0 ? (
          <div key={heading} className="mt-3">
            <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">{heading}</p>
            <ul className="mt-1 space-y-1">
              {list.map((e) => (
                <li key={e.id} className="flex items-baseline gap-2">
                  <span className="mt-1 h-0.5 w-3 shrink-0" style={{ background: linkStyles[e.data!.kind].color }} />
                  <span>
                    <b className="text-gray-900">{title(other(e))}</b> <span className="text-gray-500">via {String(e.label)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      <OpenLink data={data} className="mt-4 inline-flex rounded-md bg-amber-400 px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-amber-500" />
    </aside>
  );
}

/** Inline inside the Project overview card; a floating panel only when the map has no summary card (e.g. in Storybook). */
function Legend({ inline }: { inline?: boolean }) {
  return (
    <div className={inline ? "text-[11px] text-gray-600" : "hidden rounded-lg border border-gray-200 bg-white/95 p-3 text-[11px] text-gray-600 shadow-sm sm:block"}>
      <p className={inline ? "mb-1.5 font-semibold tracking-wide text-gray-400 uppercase" : "mb-1.5 font-semibold text-gray-900"}>Legend</p>
      <ul className={inline ? "grid grid-cols-2 gap-x-4 gap-y-1" : "space-y-1"}>
        {Object.entries(linkStyles).map(([key, s]) => (
          <li key={key} className="flex items-center gap-2">
            <svg width="28" height="6" aria-hidden>
              <line x1="0" y1="3" x2="28" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
            </svg>
            {s.label}
          </li>
        ))}
        {Object.entries(kindStyles).map(([key, k]) => (
          <li key={key} className="flex items-center gap-2">
            <span className={`w-7 rounded px-1 text-center text-[9px] font-bold ${k.badge}`}>{k.label[0]}</span>
            {k.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FlowCanvas({ initialNodes, initialEdges }: { initialNodes: FlowNode[]; initialEdges: FlowEdge[] }) {
  const [nodes, , onNodesChange] = useNodesState<FlowNode>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState<FlowEdge>(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = nodes.find((n): n is ScreenNode => n.id === selectedId && n.type === "screen");
  const hasSummary = nodes.some((n) => n.type === "summary");

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, n) => n.type === "screen" && setSelectedId(n.id)}
      onPaneClick={() => setSelectedId(null)}
      connectionMode={ConnectionMode.Loose}
      nodesConnectable={false}
      edgesFocusable={false}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      minZoom={0.2}
    >
      <Background gap={24} color="#e5e7eb" />
      <Controls position="bottom-right" showInteractive={false} />
      <MiniMap pannable zoomable nodeColor={(n) => (n.type === "screen" ? kindStyles[(n.data as ScreenData).kind].mini : n.type === "summary" ? "#e5e7eb" : "transparent")} style={{ marginRight: 56 }} className="!hidden md:!block" />
      {!hasSummary && (
        <Panel position="top-left">
          <Legend />
        </Panel>
      )}
      {selected && (
        <Panel position="top-right">
          <Details id={selected.id} data={selected.data} nodes={nodes} edges={edges} onClose={() => setSelectedId(null)} />
        </Panel>
      )}
    </ReactFlow>
  );
}
