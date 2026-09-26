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

const FONT = "'DM Sans Variable', system-ui, sans-serif"
const DISPLAY = "'Bricolage Grotesque Variable', 'DM Sans Variable', system-ui, sans-serif"

export function radarOptions({ max, step, tooltipLabel, tooltipTitle, startAngle = 0, showTicks = true, labelSize = 13, pointRadius = 5 }) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutBack' },
    interaction: { mode: 'nearest', intersect: false },
    layout: { padding: 4 },
    scales: {
      r: {
        startAngle,
        min: 0,
        max,
        ticks: { stepSize: step, display: showTicks, backdropColor: 'transparent', color: C.ink2, font: { family: FONT, size: 10 }, z: 1 },
        grid: { color: C.grid, lineWidth: 1.5 },
        angleLines: { color: C.grid, lineWidth: 1.5 },
        pointLabels: { color: C.ink, font: { family: DISPLAY, size: labelSize, weight: 700 }, padding: labelSize < 13 ? 5 : 8 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: C.ink,
        titleFont: { family: DISPLAY, size: 14, weight: 700 },
        bodyFont: { family: FONT, size: 13 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: { label: tooltipLabel, ...(tooltipTitle && { title: tooltipTitle }) },
      },
    },
    elements: {
      line: { borderWidth: 2.5, tension: 0.08 },
      point: { radius: pointRadius, hoverRadius: 8, hitRadius: 18, borderWidth: 2, backgroundColor: '#fff' },
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
