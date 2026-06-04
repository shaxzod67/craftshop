import { useState, useEffect } from 'react'
import { Row, Col, Table, Tag, Button, Typography, Avatar, Select } from 'antd'
import {
  ShoppingOutlined, DollarOutlined, ShopOutlined,
  EyeOutlined, ArrowUpOutlined, PlusOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS_COLORS = {
  pending: 'orange', confirmed: 'blue', processing: 'cyan',
  shipped: 'geekblue', delivered: 'green', cancelled: 'red'
}
const STATUS_LABELS = {
  pending: 'Kutilmoqda', confirmed: 'Tasdiqlangan', processing: 'Jarayonda',
  shipped: 'Yuborildi', delivered: 'Yetkazildi', cancelled: 'Bekor qilindi'
}

const salesData = Array.from({ length: 30 }, (_, i) => ({
  date: dayjs().subtract(29 - i, 'day').format('MM/DD'),
  sales: Math.floor(Math.random() * 500000) + 100000,
  orders: Math.floor(Math.random() * 15) + 2
}))

const categoryData = [
  { name: 'Keramika', value: 35 },
  { name: "To'qimachilik", value: 25 },
  { name: 'Zargarlik', value: 20 },
  { name: "Yog'och", value: 12 },
  { name: 'Boshqa', value: 8 },
]

export default function SellerDashboard() {
  const navigate = useNavigate()
  const { profile, sellerProfile } = useAuthStore()
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, views: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchDashboard()
  }, [profile])

  const fetchDashboard = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, view_count')
        .eq('seller_id', profile.id)

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, quantity, total_price, unit_price, status, created_at, product_id, order_id')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (orderItems && orderItems.length > 0) {
        const productIds = [...new Set(orderItems.map(i => i.product_id))]
        const orderIds = [...new Set(orderItems.map(i => i.order_id))]

        const [{ data: productsData }, { data: ordersData }] = await Promise.all([
          supabase.from('products').select('id, title, images').in('id', productIds),
          supabase.from('orders').select('id, created_at, status, buyer_id').in('id', orderIds),
        ])

        const buyerIds = [...new Set((ordersData || []).map(o => o.buyer_id))]
        const { data: buyersData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', buyerIds)

        const formatted = orderItems.map(item => {
          const product = (productsData || []).find(p => p.id === item.product_id)
          const order = (ordersData || []).find(o => o.id === item.order_id)
          const buyer = (buyersData || []).find(b => b.id === order?.buyer_id)
          return { ...item, product, order: { ...order, buyer } }
        })

        const totalRevenue = orderItems
          .filter(i => i.status === 'delivered')
          .reduce((s, i) => s + (i.total_price || 0), 0)

        const totalViews = (products || []).reduce((s, p) => s + (p.view_count || 0), 0)

        setStats({
          products: products?.length || 0,
          orders: orderItems.length,
          revenue: totalRevenue,
          views: totalViews,
        })
        setRecentOrders(formatted.slice(0, 8))
      } else {
        setStats({ products: products?.length || 0, orders: 0, revenue: 0, views: 0 })
      }
    } catch (err) {
      console.error('Dashboard xato:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShip = async (itemId) => {
    await supabase.from('order_items').update({ status: 'shipped' }).eq('id', itemId)
    fetchDashboard()
  }

  const statCards = [
    { title: 'Jami daromad', value: stats.revenue, suffix: " so'm", icon: <DollarOutlined />, color: '#52c41a', trend: 12.5 },
    { title: 'Buyurtmalar', value: stats.orders, icon: <ShoppingOutlined />, color: '#1677ff', trend: 8.3 },
    { title: 'Mahsulotlar', value: stats.products, icon: <ShopOutlined />, color: '#8B4513', trend: null },
    { title: "Ko'rishlar", value: stats.views, icon: <EyeOutlined />, color: '#722ed1', trend: 23.1 },
  ]

  const orderColumns = [
    {
      title: 'Xaridor',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" style={{ background: '#8B4513' }}>
            {row.order?.buyer?.full_name?.[0] || '?'}
          </Avatar>
          <Text style={{ fontSize: 13 }}>{row.order?.buyer?.full_name || "Noma'lum"}</Text>
        </div>
      )
    },
    {
      title: 'Mahsulot',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={row.product?.images?.[0] || 'https://placehold.co/32x32/f5f0e8/8B4513?text=P'}
            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6 }}
          />
          <Text style={{ fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.product?.title || "Noma'lum"}
          </Text>
        </div>
      )
    },
    { title: 'Miqdor', dataIndex: 'quantity', width: 70, render: v => <Text>{v} ta</Text> },
    { title: 'Summa', dataIndex: 'total_price', render: v => <Text strong style={{ color: '#8B4513' }}>{v?.toLocaleString()} so'm</Text> },
    { title: 'Holat', dataIndex: 'status', render: status => <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag> },
    {
      title: 'Sana',
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(row.order?.created_at || row.created_at).format('DD.MM.YY HH:mm')}
        </Text>
      )
    },
    {
      title: '',
      render: (_, row) => row.status === 'confirmed'
        ? <Button size="small" type="primary" onClick={() => handleShip(row.id)}>Yuborish</Button>
        : null
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Salom, {profile?.full_name?.split(' ')[0]}! 👋</Title>
          <Text type="secondary">{sellerProfile?.shop_name} · Bugun {dayjs().format('DD MMMM, YYYY')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/seller/products/new')} size="large" style={{ borderRadius: 10 }}>
          Mahsulot qo'shish
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map(card => (
          <Col xs={12} lg={6} key={card.title}>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{card.title}</Text>
                  <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4 }}>
                    {card.value?.toLocaleString()}{card.suffix}
                  </div>
                  {card.trend && (
                    <div style={{ marginTop: 4, color: '#52c41a', fontSize: 12 }}>
                      <ArrowUpOutlined /> {card.trend}% o'tgan oyga nisbatan
                    </div>
                  )}
                </div>
                <div style={{ background: card.color + '15', borderRadius: 10, padding: 10, fontSize: 22, color: card.color }}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>Oylik daromad</Title>
              <Select defaultValue="30" size="small" style={{ width: 100 }}>
                <Select.Option value="7">7 kun</Select.Option>
                <Select.Option value="30">30 kun</Select.Option>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B4513" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B4513" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={v => [`${v.toLocaleString()} so'm`, 'Daromad']} />
                <Area type="monotone" dataKey="sales" stroke="#8B4513" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="stat-card" style={{ height: '100%' }}>
            <Title level={5} style={{ marginBottom: 16 }}>Kategoriya bo'yicha</Title>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={v => [`${v}%`, '']} />
                <Bar dataKey="value" fill="#8B4513" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>So'ngi buyurtmalar</Title>
          <Button type="link" onClick={() => navigate('/seller/orders')} style={{ color: '#8B4513', padding: 0 }}>
            Barchasini ko'rish →
          </Button>
        </div>
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          size="small"
          loading={loading}
          scroll={{ x: 700 }}
          locale={{ emptyText: "Hali buyurtmalar yo'q" }}
        />
      </div>
    </div>
  )
}