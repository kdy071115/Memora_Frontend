"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

interface LineChartItem {
  name: string;
  score: number;
}

interface RadarChartItem {
  subject: string;
  A: number;
  fullMark: number;
}

export function AnalysisLineChart({ data }: { data: LineChartItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 8, strokeWidth: 0, fill: "#6366f1" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 긴 한글 라벨이 가장자리에서 잘리지 않도록 일정 길이 이상은 줄임표 처리
function truncateLabel(value: string, max = 14): string {
  if (!value) return value;
  return value.length > max ? value.slice(0, max) + "…" : value;
}

// PolarAngleAxis 의 tick 을 커스터마이즈해 좌/우/상/하 위치별로 textAnchor 를 조정,
// 두 줄로 분리해서 더 긴 라벨도 자연스럽게 보이게 함.
function PolarTick({ x, y, payload, cx }: any) {
  const value: string = payload?.value ?? "";
  const truncated = truncateLabel(value, 18);
  // dash(-) 기준으로 두 줄 분리 — 없으면 한 줄
  const parts = truncated.includes(" - ") ? truncated.split(" - ") : [truncated];

  // 위치에 따라 anchor 결정
  const dx = x - cx;
  let textAnchor: "start" | "middle" | "end" = "middle";
  if (dx > 12) textAnchor = "start";
  else if (dx < -12) textAnchor = "end";

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill="#64748b"
      fontSize={12}
      fontWeight="bold"
    >
      {parts.map((p, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 14}>
          {p}
        </tspan>
      ))}
    </text>
  );
}

export function AnalysisRadarChart({ data }: { data: RadarChartItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="62%"
        data={data}
        margin={{ top: 24, right: 60, bottom: 24, left: 60 }}
      >
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" tick={<PolarTick />} />
        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
        <Radar name="나의 역량" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.4} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
