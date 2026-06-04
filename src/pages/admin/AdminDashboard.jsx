import { useState, useEffect } from 'react'
import { Row, Col, Typography, Table, Tag, Avatar, Statistic, Select } from 'antd'
import {
  UserOutlined, ShopOutlined, ShoppingOutlined, DollarOutlined,
  ArrowUpOutlined, TeamOutlined
} from '@ant-design/icons'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const salesData = Array.from({ length: 14 }, (_, i) => ({
  date: dayjs().subtract(13 - i, 'day').format('MM/DD'),
  buyers: Math.floor(Math.random() * 30) + 10,
  sellers: Math.floor(Math.random() * 8) + 1,
  orders: Math.floor(Math.random() * 50) + 15,
  revenue: Math.floor(Math.random() * 5000000) + 1000000,
}))

const categoryStats = [
  { name: 'Keramika', value: 32, color: '#8B4513' },
  { name: "To'qimachilik", value: 24, color: '#c8a450' },
  { name: 'Zargarlik', value: 19, color: '#d2691e' },
  { name: "Yog'och", value: 15, color: '#a0522d' },
  { name: 'Boshqa', value: 10, color: '#e0c9a6' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState({ buyers: 0, sellers: 0, products: 0, orders: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [profiles, products, orders] = await Promise.all([
      supabase.from('profiles').select('id, role, full_name, created_at, avatar_url'),
      supabase.from('products').select('id', { count: 'exact' }),
      supabase.from('orders').select('id', { count: 'exact' }),
    ])
    const buyers = (profiles.data || []).filter(p => p.role === 'buyer').length
    const sellers = (profiles.data || []).filter(p => p.role === 'seller').length
    setStats({ buyers, sellers, products: products.count || 0, orders: orders.count || 0 })
    setRecentUsers((profiles.data || []).slice(-10).reverse())
    setLoading(false)
  }

  const statCards = [
    { title: 'Xaridorlar', value: stats.buyers, icon: <UserOutlined />, color: '#1677ff', trend: '+12%' },
    { title: 'Sotuvchilar', value: stats.sellers, icon: <ShopOutlined />, color: '#8B4513', trend: '+5%' },
    { title: 'Mahsulotlar', value: stats.products, icon: <TeamOutlined />, color: '#722ed1', trend: '+18%' },
    { title: 'Buyurtmalar', value: stats.orders, icon: <ShoppingOutlined />, color: '#52c41a', trend: '+23%' },
  ]

  const userColumns = [
    {
      title: 'Foydalanuvchi', key: 'user',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar size={32} icon={<UserOutlined />} src={r.avatar_url}
            style={{ background: r.role === 'seller' ? '#8B4513' : '#1677ff' }} />
          <Text style={{ fontSize: 13 }}>{r.full_name || 'Noma\'lum'}</Text>
        </div>
      )
    },
    { title: 'Rol', dataIndex: 'role', render: v => <Tag color={v === 'seller' ? 'orange' : v === 'admin' ? 'red' : 'blue'}>{v}</Tag> },
    { title: "Qo'shildi", dataIndex: 'created_at', render: v => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).format('DD.MM.YY')}</Text> },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
        <Text type="secondary">Bugun: {dayjs().format('DD MMMM YYYY')}</Text>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <Col xs={12} md={6} key={s.title}>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{s.title}</Text>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</div>
                  <div style={{ color: '#52c41a', fontSize: 12, marginTop: 4 }}>
                    <ArrowUpOutlined /> {s.trend} bu oy
                  </div>
                </div>
                <div style={{ background: s.color + '15', borderRadius: 10, padding: 10, fontSize: 22, color: s.color, height: 'fit-content' }}>
                  {s.icon}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Charts row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <div className="stat-card">
            <Title level={5} style={{ marginBottom: 16 }}>Faollik (oxirgi 14 kun)</Title>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="buyerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B4513" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B4513" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="buyers" name="Xaridorlar" stroke="#1677ff" fill="url(#buyerGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="orders" name="Buyurtmalar" stroke="#8B4513" fill="url(#orderGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="stat-card">
            <Title level={5} style={{ marginBottom: 16 }}>Kategoriyalar</Title>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                  {categoryStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`]} />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      {/* Revenue bar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <div className="stat-card">
            <Title level={5} style={{ marginBottom: 16 }}>Kunlik daromad</Title>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={v => [`${v.toLocaleString()} so'm`, 'Daromad']} />
                <Bar dataKey="revenue" name="Daromad" fill="#8B4513" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        <Col xs={24} lg={10}>
          <div className="stat-card">
            <Title level={5} style={{ marginBottom: 12 }}>So'ngi foydalanuvchilar</Title>
            <Table
              columns={userColumns} dataSource={recentUsers}
              rowKey="id" pagination={false} size="small" loading={loading}
              scroll={{ y: 180 }}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}
