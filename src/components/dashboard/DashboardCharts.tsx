import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartItem, MonthlySalesItem } from '../../types/dashboard'
import './DashboardCharts.css'

const CHART_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6',
]

const BRAND_CHART_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#4f46e5',
  '#0d9488', '#ca8a04',
]

function formatAxisCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

function formatTooltipCurrency(value: number): string {
  return `₩${Math.round(value).toLocaleString('ko-KR')}`
}

interface ChartCardProps {
  title: string
  children: ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="chart-card">
      <h3 className="chart-card__title">{title}</h3>
      <div className="chart-card__body">{children}</div>
    </div>
  )
}

interface DashboardChartsProps {
  monthlySales: MonthlySalesItem[]
  salesByCategory: ChartItem[]
  salesByChannel: ChartItem[]
  salesByPayment: ChartItem[]
  salesByGrade: ChartItem[]
  orderStatusDistribution: ChartItem[]
  topBrands: ChartItem[]
  topRegions: ChartItem[]
}

function HorizontalBarChart({
  data,
  color = '#3b82f6',
  multiColor = false,
  colors = CHART_COLORS,
  yAxisWidth = 72,
  tooltipLabel = '',
}: {
  data: ChartItem[]
  color?: string
  multiColor?: boolean
  colors?: string[]
  yAxisWidth?: number
  tooltipLabel?: string
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 10)
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={formatAxisCurrency} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={yAxisWidth} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: number) => formatTooltipCurrency(v)}
          labelFormatter={(label) => (tooltipLabel ? `${tooltipLabel}: ${label}` : label)}
        />
        <Bar dataKey="value" fill={multiColor ? undefined : color} radius={[0, 4, 4, 0]}>
          {multiColor
            ? sorted.map((entry, i) => (
                <Cell key={entry.name} fill={colors[i % colors.length]} />
              ))
            : null}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function VerticalBarChart({ data }: { data: ChartItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => formatTooltipCurrency(v)} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DashboardCharts({
  monthlySales,
  salesByCategory,
  salesByChannel,
  salesByPayment,
  salesByGrade,
  orderStatusDistribution,
  topBrands,
  topRegions,
}: DashboardChartsProps) {
  return (
    <div className="charts-grid">
      <ChartCard title="월별 매출 추이">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlySales} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatTooltipCurrency(v)} labelFormatter={(l) => `${l}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              name="매출"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="카테고리별 매출">
        <VerticalBarChart data={salesByCategory.slice(0, 8)} />
      </ChartCard>

      <ChartCard title="채널별 매출">
        <HorizontalBarChart data={salesByChannel} color="#6366f1" />
      </ChartCard>

      <ChartCard title="결제수단별 매출">
        <VerticalBarChart data={salesByPayment} />
      </ChartCard>

      <ChartCard title="고객 등급별 매출">
        <VerticalBarChart data={salesByGrade} />
      </ChartCard>

      <ChartCard title="주문 상태 분포">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={orderStatusDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {orderStatusDistribution.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="브랜드별 매출 TOP">
        <HorizontalBarChart
          data={topBrands}
          multiColor
          colors={BRAND_CHART_COLORS}
          yAxisWidth={80}
          tooltipLabel="브랜드"
        />
      </ChartCard>

      <ChartCard title="지역별 매출 TOP">
        <HorizontalBarChart
          data={topRegions}
          multiColor
          colors={CHART_COLORS}
          yAxisWidth={56}
          tooltipLabel="지역"
        />
      </ChartCard>
    </div>
  )
}
