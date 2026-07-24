import type { ReactElement } from "react";
import {
  computeBarChartLayout,
  computeCycleLayout,
  computePieLayout,
  computeTimelineLayout,
  type DiagramSpecification,
} from "@pedagoos/pedagogy";

/**
 * Rendu SVG déterministe d'une DiagramSpecification (ADR-0016). Composant pur
 * (aucun état, aucun réseau) : la géométrie vient de packages/pedagogy, ce
 * composant ne fait que dessiner. Accessible : role="img" + <title>/<desc>.
 * Les couleurs passent par les tokens Tailwind (jamais l'information par la
 * couleur seule — les libellés sont toujours présents).
 */
export function DiagramView({
  spec,
  className,
}: {
  spec: DiagramSpecification;
  className?: string;
}): ReactElement {
  const titleId = `diag-t-${spec.id ?? spec.title.replace(/\s+/g, "-")}`;
  const descId = `${titleId}-d`;
  const body = renderBody(spec);

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${body.width} ${body.height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="h-auto w-full text-foreground"
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={titleId}>{spec.title}</title>
        <desc id={descId}>{spec.accessibilityDescription}</desc>
        {body.el}
      </svg>
    </figure>
  );
}

interface Rendered {
  width: number;
  height: number;
  el: ReactElement;
}

function renderBody(spec: DiagramSpecification): Rendered {
  switch (spec.type) {
    case "bar_chart":
      return renderBarChart(spec);
    case "pie_chart":
      return renderPie(spec);
    case "timeline":
      return renderTimeline(spec);
    case "cycle":
      return renderCycle(spec);
    default:
      // process / flowchart / hierarchy / cause_effect / mind_map / autres :
      // flux vertical de boîtes reliées (lisible, générique).
      return renderFlow(spec);
  }
}

function renderBarChart(spec: DiagramSpecification): Rendered {
  const l = computeBarChartLayout(spec.nodes);
  return {
    width: l.width,
    height: l.height,
    el: (
      <g>
        <line
          x1={0}
          y1={l.baselineY}
          x2={l.width}
          y2={l.baselineY}
          className="stroke-border"
          strokeWidth={1}
        />
        {l.bars.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              rx={2}
              className="fill-primary"
              opacity={0.85}
            />
            <text
              x={b.x + b.width / 2}
              y={b.y - 4}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={11}
            >
              {b.value}
            </text>
            <text
              x={b.x + b.width / 2}
              y={l.baselineY + 14}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {b.label}
            </text>
          </g>
        ))}
      </g>
    ),
  };
}

function renderPie(spec: DiagramSpecification): Rendered {
  const l = computePieLayout(spec.nodes);
  const legendX = l.width + 12;
  return {
    width: l.width + 170,
    height: l.height,
    el: (
      <g>
        {l.segments.map((s, i) => (
          <path
            key={i}
            d={s.path}
            className="fill-primary"
            opacity={0.3 + (0.6 * (i + 1)) / l.segments.length}
          />
        ))}
        {l.segments.map((s, i) => (
          <g key={`lg-${i}`} transform={`translate(${legendX}, ${20 + i * 20})`}>
            <rect
              width={12}
              height={12}
              rx={2}
              className="fill-primary"
              opacity={0.3 + (0.6 * (i + 1)) / l.segments.length}
            />
            <text x={18} y={11} className="fill-foreground" fontSize={11}>
              {s.label} — {Math.round(s.percent)}%
            </text>
          </g>
        ))}
      </g>
    ),
  };
}

function renderTimeline(spec: DiagramSpecification): Rendered {
  const l = computeTimelineLayout(spec.nodes);
  return {
    width: l.width,
    height: l.height,
    el: (
      <g>
        <line
          x1={20}
          y1={l.axisY}
          x2={l.width - 20}
          y2={l.axisY}
          className="stroke-border"
          strokeWidth={2}
        />
        {l.points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={6} className="fill-primary" />
            <text
              x={p.x}
              y={i % 2 === 0 ? p.y - 14 : p.y + 22}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={11}
            >
              {p.label}
            </text>
          </g>
        ))}
      </g>
    ),
  };
}

function renderCycle(spec: DiagramSpecification): Rendered {
  const l = computeCycleLayout(spec.nodes);
  return {
    width: l.width,
    height: l.height,
    el: (
      <g>
        {l.nodes.map((n, i) => {
          const next = l.nodes[(i + 1) % l.nodes.length];
          return (
            <line
              key={`e-${i}`}
              x1={n.x}
              y1={n.y}
              x2={next!.x}
              y2={next!.y}
              className="stroke-border"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
          );
        })}
        <defs>
          <marker
            id="arrow"
            markerWidth={8}
            markerHeight={8}
            refX={6}
            refY={3}
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" className="fill-muted-foreground" />
          </marker>
        </defs>
        {l.nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={26}
              className="fill-secondary stroke-border"
              strokeWidth={1}
            />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={10}
            >
              {truncate(n.label, 12)}
            </text>
          </g>
        ))}
      </g>
    ),
  };
}

function renderFlow(spec: DiagramSpecification): Rendered {
  const boxW = 220;
  const boxH = 44;
  const gap = 28;
  const width = boxW + 40;
  const height = 20 + spec.nodes.length * (boxH + gap);
  return {
    width,
    height: Math.max(height, 80),
    el: (
      <g>
        {spec.nodes.map((n, i) => {
          const y = 10 + i * (boxH + gap);
          const cx = width / 2;
          return (
            <g key={n.id}>
              {i > 0 && (
                <line
                  x1={cx}
                  y1={y - gap}
                  x2={cx}
                  y2={y}
                  className="stroke-border"
                  strokeWidth={1.5}
                  markerEnd="url(#arrow-f)"
                />
              )}
              <rect
                x={(width - boxW) / 2}
                y={y}
                width={boxW}
                height={boxH}
                rx={6}
                className="fill-secondary stroke-border"
                strokeWidth={1}
              />
              <text
                x={cx}
                y={y + boxH / 2 + 4}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={12}
              >
                {truncate(n.label, 32)}
              </text>
            </g>
          );
        })}
        <defs>
          <marker
            id="arrow-f"
            markerWidth={8}
            markerHeight={8}
            refX={6}
            refY={3}
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" className="fill-muted-foreground" />
          </marker>
        </defs>
      </g>
    ),
  };
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
