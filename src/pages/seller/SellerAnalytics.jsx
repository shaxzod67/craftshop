import { useState } from 'react'
import { Row, Col, Typography, Select, Card } from 'antd'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// Generate mock analytics data
const generateSalesData = (days) => Array.from({ length: days }, (_, i) => ({
  date: dayjs().subtract(days - 1 - i, 'day').format(days <= 7 ? 'ddd' : 'MM/DD'),
  revenue: Math.floor(Math.random() * 800000) + 200000,
  orders: Math.floor(Math.random() * 20) + 3,
  views: Math.floor(Math.random() * 300) + 50,
}))

const CATEGORY_DATA = [
  { name: 'Keramika', value: 38, color: '#8B4513' },
  { name: 'To\'qimachilik', value: 22, color: '#c8a450' },
  { name: 'Zargarlik', value: 18, color: '#d2691e' },
  { name: 'Yog\'och', value: 14, color: '#a0522d' },
  { name: 'Boshqa', value: 8, color: '#e8d5bb' },
]

const TOP_PRODUCTS = [
  { name: 'Keramika kosa to\'plami', orders: 45, revenue: 6750000 },
  { name: 'Ipak duppisi', orders: 38, revenue: 3800000 },
  { name: 'Kumush uzuk', orders: 30, revenue: 4500000 },
  { name: 'Yog\'och o\'ymakor lagan', orders: 22, revenue: 3300000 },
  { name: 'Kashtachilik ko\'ylak', orders: 18, revenue: 5400000 },
]

export default function SellerAnalytics() {
  const [period, setPeriod] = useState('30')
  const data = generateSalesData(parseInt(period))

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = data.reduce((s, d) => s + d.orders, 0)
  const totalViews = data.reduce((s, d) => s + d.views, 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'white', border: '1px solid #e8e0d5', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color }}>
              {p.name}: {p.name === 'Daromad' ? `${p.value.toLocaleString()} so'm` : p.value}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Tahlil</Title>
        <Select value={period} onChange={setPeriod} style={{ width: 140 }}>
          <Select.Option value="7">Oxirgi 7 kun</Select.Option>
          <Select.Option value="30">Oxirgi 30 kun</Select.Option>
          <Select.Option value="90">Oxirgi 90 kun</Select.Option>
        </Select>
      </div>

      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Daromad', value: `${totalRevenue.toLocaleString()} so'm`, icon: '💰', color: '#52c41a' },
          { label: 'Buyurtmalar', value: totalOrders, icon: '📦', color: '#1677ff' },
          { label: 'Ko\'rishlar', value: totalViews, icon: '👁️', color: '#722ed1' },
          { label: "O'rtacha chek", value: `${Math.round(totalRevenue / (totalOrders || 1)).toLocaleString()} so'm`, icon: '🧾', color: '#8B4513' },
        ].map(s => (
          <Col xs={12} md={6} key={s.label}>
            <div className="stat-card">
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Revenue chart */}
      <div className="stat-card" style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 16 }}>Daromad dinamikasi</Title>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B4513" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8B4513" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Daromad" stroke="#8B4513" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Orders + views */}
        <Col xs={24} lg={14}>
          <div className="stat-card">
            <Title level={5} style={{ marginBottom: 16 }}>Buyurtmalar va Ko'rishlar</Title>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="orders" name="Buyurtmalar" stroke="#8B4513" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="views" name="Ko'rishlar" stroke="#c8a450" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Pie chart */}
        <Col xs={24} lg={10}>
          <div className="stat-card">
            <Title level={5} style={{ marginBottom: 16 }}>Kategoriya taqsimoti</Title>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={CATEGORY_DATA} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  dataKey="value" nameKey="name"
                >
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      {/* Top products */}
      <div className="stat-card">
        <Title level={5} style={{ marginBottom: 16 }}>Top mahsulotlar</Title>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={TOP_PRODUCTS} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
            <Tooltip formatter={v => [`${v.toLocaleString()} so'm`, 'Daromad']} />
            <Bar dataKey="revenue" name="Daromad" fill="#8B4513" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
