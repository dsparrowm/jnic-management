export const CHART_COLORS = {
  gold: "var(--chart-gold)",
  navy: "var(--chart-navy)",
  info: "var(--chart-info)",
  success: "var(--chart-success)",
  warning: "var(--chart-warning)",
  grid: "#E5E7EB",
  axis: "#6B7280",
};

export const chartTooltipStyle = {
  borderRadius: 10,
  fontSize: 12,
  border: "1px solid var(--border-default)",
  boxShadow: "0 4px 12px rgba(17, 24, 39, 0.08)",
  background: "var(--bg-surface)",
};

export const chartGridProps = {
  strokeDasharray: "3 3" as const,
  stroke: CHART_COLORS.grid,
  vertical: false,
};

export const chartAxisProps = {
  stroke: CHART_COLORS.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

export const CHART_PALETTE = [
  CHART_COLORS.gold,
  CHART_COLORS.navy,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  "#7C3AED",
  "#0891B2",
  "#BE185D",
];
