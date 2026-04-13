"use client";
import { use, useMemo, useRef, useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { getConceptGraph, type ConceptNode, type ConceptEdge } from "@/lib/api/aiCoach";
import { ArrowLeft, Loader2, Network, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// 간단한 force-directed layout (D3 force 없이 순수 구현)
// ─────────────────────────────────────────────────────────────────
interface SimNode extends ConceptNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

function useForceLayout(
  nodes: ConceptNode[],
  edges: ConceptEdge[],
  width: number,
  height: number
) {
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [settled, setSettled] = useState(false);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (nodes.length === 0) {
      setSimNodes([]);
      return;
    }

    // 초기 위치 — 원형 배치
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.35;
    const initial: SimNode[] = nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      return {
        ...n,
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 20,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        radius: 16 + (n.importance / 100) * 18,
      };
    });

    const edgeIndex = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!edgeIndex.has(e.source)) edgeIndex.set(e.source, new Set());
      edgeIndex.get(e.source)!.add(e.target);
    }

    frameRef.current = 0;
    setSettled(false);

    const tick = () => {
      frameRef.current++;
      const damping = 0.85;
      const repulsion = 10000;
      const attraction = 0.002;
      const centerPull = 0.0008;

      for (let i = 0; i < initial.length; i++) {
        const a = initial[i];
        // 중심 끌림
        a.vx += (cx - a.x) * centerPull;
        a.vy += (cy - a.y) * centerPull;
        // 반발
        for (let j = 0; j < initial.length; j++) {
          if (i === j) continue;
          const b = initial[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
        }
      }
      // 인력 (연결된 것끼리)
      for (const e of edges) {
        const a = initial.find((n) => n.id === e.source);
        const b = initial.find((n) => n.id === e.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        a.vx += dx * attraction;
        a.vy += dy * attraction;
        b.vx -= dx * attraction;
        b.vy -= dy * attraction;
      }
      // 적용
      let totalV = 0;
      for (const n of initial) {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        // 경계
        n.x = Math.max(n.radius, Math.min(width - n.radius, n.x));
        n.y = Math.max(n.radius, Math.min(height - n.radius, n.y));
        totalV += Math.abs(n.vx) + Math.abs(n.vy);
      }

      setSimNodes([...initial]);
      if (frameRef.current > 300 || totalV < 0.5) {
        setSettled(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, width, height]);

  return { simNodes, settled };
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────
export default function ConceptGraphPage({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const resolvedParams = use(params);
  const lectureId = Number(resolvedParams.lectureId);

  const { data, isLoading } = useQuery({
    queryKey: ["conceptGraph", lectureId],
    queryFn: () => getConceptGraph(lectureId),
    staleTime: 5 * 60 * 1000,
  });

  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 900, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDims({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  const { simNodes, settled } = useForceLayout(nodes, edges, dims.w / zoom, dims.h / zoom);

  const nodeMap = useMemo(() => {
    const m = new Map<string, SimNode>();
    for (const n of simNodes) m.set(n.id, n);
    return m;
  }, [simNodes]);

  // 노드 색상 — importance 기반
  const getColor = (imp: number) => {
    if (imp >= 80) return { fill: "rgb(124,58,237)", text: "#fff" }; // violet
    if (imp >= 60) return { fill: "rgb(59,130,246)", text: "#fff" }; // blue
    if (imp >= 40) return { fill: "rgb(16,185,129)", text: "#fff" }; // emerald
    return { fill: "rgb(148,163,184)", text: "#fff" }; // slate
  };

  return (
    <MainLayout>
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/learn/${lectureId}`}
              className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-violet-600">AI 개념 분석</p>
              <h1 className="text-lg font-black text-foreground">개념 지식 그래프</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
              className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
              className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center"
              title="초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {!settled && (
              <span className="text-xs font-bold text-muted-foreground animate-pulse ml-2">
                배치 중...
              </span>
            )}
          </div>
        </div>

        {/* 그래프 영역 */}
        <div ref={containerRef} className="flex-1 overflow-hidden bg-muted relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
              <p className="text-sm font-bold text-muted-foreground">
                AI 가 강의 자료에서 개념을 추출하는 중입니다...
              </p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Network className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-sm font-bold text-muted-foreground">
                분석할 강의 자료가 없거나 개념을 추출하지 못했어요
              </p>
            </div>
          ) : (
            <svg
              width={dims.w}
              height={dims.h}
              className="select-none"
            >
              <g transform={`scale(${zoom})`}>
                {/* 범례 */}
                <g transform="translate(20,20)">
                  {[
                    { label: "핵심 (80+)", color: "rgb(124,58,237)" },
                    { label: "주요 (60+)", color: "rgb(59,130,246)" },
                    { label: "보조 (40+)", color: "rgb(16,185,129)" },
                    { label: "기타", color: "rgb(148,163,184)" },
                  ].map((l, i) => (
                    <g key={i} transform={`translate(0,${i * 22})`}>
                      <circle cx={6} cy={6} r={5} fill={l.color} />
                      <text x={16} y={10} fontSize={11} fontWeight={700} fill="currentColor" className="text-muted-foreground">
                        {l.label}
                      </text>
                    </g>
                  ))}
                </g>

                {/* 엣지 — 곡선 + 라벨 배경 pill */}
                {edges.map((e, i) => {
                  const a = nodeMap.get(e.source);
                  const b = nodeMap.get(e.target);
                  if (!a || !b) return null;
                  const mx = (a.x + b.x) / 2;
                  const my = (a.y + b.y) / 2;
                  // 살짝 곡선 — 수직 오프셋으로 라벨과 선이 겹치지 않게
                  const dx = b.x - a.x;
                  const dy = b.y - a.y;
                  const perpX = -dy * 0.08;
                  const perpY = dx * 0.08;
                  const cx1 = mx + perpX;
                  const cy1 = my + perpY;
                  const labelLen = (e.label || "").length;
                  const pillW = Math.max(40, labelLen * 9 + 16);
                  return (
                    <g key={`e-${i}`}>
                      <path
                        d={`M ${a.x} ${a.y} Q ${cx1} ${cy1} ${b.x} ${b.y}`}
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity={0.12}
                        strokeWidth={1.5}
                        className="text-foreground"
                      />
                      {/* 라벨 배경 pill */}
                      <rect
                        x={cx1 - pillW / 2}
                        y={cy1 - 10}
                        width={pillW}
                        height={20}
                        rx={10}
                        fill="currentColor"
                        className="text-card"
                        opacity={0.9}
                      />
                      <rect
                        x={cx1 - pillW / 2}
                        y={cy1 - 10}
                        width={pillW}
                        height={20}
                        rx={10}
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity={0.1}
                        strokeWidth={1}
                        className="text-foreground"
                      />
                      <text
                        x={cx1}
                        y={cy1 + 4}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill="currentColor"
                        className="text-muted-foreground"
                      >
                        {e.label}
                      </text>
                    </g>
                  );
                })}

                {/* 노드 */}
                {simNodes.map((n) => {
                  const c = getColor(n.importance);
                  return (
                    <g key={n.id}>
                      {/* 그림자 */}
                      <circle
                        cx={n.x + 2}
                        cy={n.y + 2}
                        r={n.radius}
                        fill="black"
                        opacity={0.08}
                      />
                      {/* 메인 원 */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={n.radius}
                        fill={c.fill}
                        opacity={0.9}
                        stroke="white"
                        strokeWidth={2}
                        strokeOpacity={0.3}
                      />
                      {/* importance 숫자 */}
                      <text
                        x={n.x}
                        y={n.y + 5}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={800}
                        fill={c.text}
                      >
                        {n.importance}
                      </text>
                      {/* 라벨 — 배경 pill + 텍스트 */}
                      {(() => {
                        const labelLen = n.label.length;
                        const labelW = Math.max(50, labelLen * 11 + 16);
                        const ly = n.y + n.radius + 18;
                        return (
                          <>
                            <rect
                              x={n.x - labelW / 2}
                              y={ly - 12}
                              width={labelW}
                              height={22}
                              rx={11}
                              fill="currentColor"
                              className="text-card"
                              opacity={0.85}
                            />
                            <rect
                              x={n.x - labelW / 2}
                              y={ly - 12}
                              width={labelW}
                              height={22}
                              rx={11}
                              fill="none"
                              stroke="currentColor"
                              strokeOpacity={0.08}
                              strokeWidth={1}
                              className="text-foreground"
                            />
                            <text
                              x={n.x}
                              y={ly + 3}
                              textAnchor="middle"
                              fontSize={12}
                              fontWeight={800}
                              fill="currentColor"
                              className="text-foreground"
                            >
                              {n.label}
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
