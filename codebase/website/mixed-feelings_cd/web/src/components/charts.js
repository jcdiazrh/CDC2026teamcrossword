import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

// Chart colors (validated for color-vision deficiency with the dataviz palette checker)
export const C = {
  you: '#E8452C',
  youFill: 'rgba(232, 69, 44, 0.18)',
  avg: '#6B4EFF',
  ink: '#1E1631',
  ink2: '#5B5470',
  grid: '#EDE3D6',
}

// Dark mode ("Feelings → Music"): same two roles, re-stepped for the dark surface (validated separately)
export const CD = {
  you: '#F2553A',
  youFill: 'rgba(242, 85, 58, 0.24)',
  avg: '#8F7CFF',
  ink: '#F4EDE4',
  ink2: '#B9B0C9',
  grid: 'rgba(244, 237, 228, 0.14)',
  point: '#211A33',
}
export const palette = (dark) => (dark ? CD : C)

const FONT = "'DM Sans Variable', system-ui, sans-serif"
const DISPLAY = "'Bricolage Grotesque Variable', 'DM Sans Variable', system-ui, sans-serif"

export function radarOptions({ max, step, tooltipLabel, tooltipTitle, startAngle = 0, showTicks = true, labelSize = 13, pointRadius = 5, dark = false, min = 0, tickFormat = null, tooltipFilter = null }) {
  const P = palette(dark)
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutBack' },
    interaction: { mode: 'nearest', intersect: false },
    layout: { padding: 4 },
    scales: {
      r: {
        startAngle,
        min,
        max,
        ticks: { stepSize: step, display: showTicks, ...(tickFormat && { callback: tickFormat }), backdropColor: 'transparent', color: P.ink2, font: { family: FONT, size: 10 }, z: 1 },
        grid: { color: P.grid, lineWidth: 1.5 },
        angleLines: { color: P.grid, lineWidth: 1.5 },
        pointLabels: { color: P.ink, font: { family: DISPLAY, size: labelSize, weight: 700 }, padding: labelSize < 13 ? 5 : 8 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dark ? '#0E0A17' : C.ink,
        titleFont: { family: DISPLAY, size: 14, weight: 700 },
        bodyFont: { family: FONT, size: 13 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        usePointStyle: true,
        ...(tooltipFilter && { filter: tooltipFilter }),
        callbacks: { label: tooltipLabel, ...(tooltipTitle && { title: tooltipTitle }) },
      },
    },
    elements: {
      line: { borderWidth: 2.5, tension: 0.08 },
      point: { radius: pointRadius, hoverRadius: 8, hitRadius: 18, borderWidth: 2, backgroundColor: dark ? CD.point : '#fff' },
    },
  }
}

/** Split long axis labels over two lines so the radar keeps its size on phones. */
export const wrapLabel = (s) => {
  if (s.length <= 9 || !s.includes(' ')) return s
  const words = s.split(' ')
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}
