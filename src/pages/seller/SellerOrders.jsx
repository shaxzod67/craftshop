import { useState, useEffect } from 'react'
import { Table, Tag, Button, Select, Typography, Space, Modal, Descriptions, Image, message, Input, Badge } from 'antd'
import { EyeOutlined, SearchOutlined, TruckOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS = {
  pending: { color: 'orange', label: 'Kutilmoqda' },
  confirmed: { color: 'blue', label: 'Tasdiqlangan' },
  processing: { color: 'cyan', label: 'Jarayonda' },
  shipped: { color: 'geekblue', label: 'Yuborildi' },
  delivered: { color: 'green', label: 'Yetkazildi' },
  cancelled: { color: 'red', label: 'Bekor qilindi' },
}

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
}

export default function SellerOrders() {
  const { profile } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(null)

  useEffect(() => { fetchOrders() }, [profile])

  const fetchOrders = async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('order_items')
      .select(`
        *,
        order:orders(id, created_at, status, shipping_address, notes, payment_method, buyer:profiles(full_name, phone, email)),
        product:products(id, title, images)
      `)
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const handleUpdateStatus = async (itemId, newStatus) => {
    setUpdating(itemId)
    await supabase.from('order_items').update({ status: newStatus }).eq('id', itemId)
    setOrders(o => o.map(x => x.id === itemId ? { ...x, status: newStatus } : x))
    message.success(`Holat: ${STATUS[newStatus]?.label}`)
    setUpdating(null)
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch = !search || o.order?.buyer?.full_name?.toLowerCase().includes(search.toLowerCase()) || o.product?.title?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const statusCounts = Object.keys(STATUS).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  const columns = [
    {
      title: 'Mahsulot', key: 'product',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <img
            src={r.product?.images?.[0] || 'https://placehold.co/40x40/f5f0e8/8B4513?text=P'}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
          />
          <div>
            <Text style={{ fontSize: 13, fontWeight: 600 }}>{r.product?.title}</Text>
            <div><Text type="secondary" style={{ fontSize: 11 }}>{r.quantity} × {r.unit_price?.toLocaleString()} so'm</Text></div>
          </div>
        </div>
      )
    },
    {
      title: 'Xaridor',
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 13 }}>{r.order?.buyer?.full_name}</Text>
          <div><Text type="secondary" style={{ fontSize: 11 }}>{r.order?.buyer?.phone}</Text></div>
        </div>
      )
    },
    {
      title: 'Jami', dataIndex: 'total_price',
      render: v => <Text strong style={{ color: '#8B4513' }}>{v?.toLocaleString()} so'm</Text>
    },
    {
      title: 'Holat', dataIndex: 'status',
      render: (status) => <Tag color={STATUS[status]?.color}>{STATUS[status]?.label}</Tag>
    },
    {
      title: 'Amal', key: 'action',
      render: (_, r) => (
        <Space>
          {NEXT_STATUS[r.status] && (
            <Button
              type="primary" size="small"
              loading={updating === r.id}
              icon={r.status === 'confirmed' ? <TruckOutlined /> : null}
              onClick={() => handleUpdateStatus(r.id, NEXT_STATUS[r.status])}
              style={{ borderRadius: 6 }}
            >
              {STATUS[NEXT_STATUS[r.status]]?.label}
            </Button>
          )}
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelected(r)} />
        </Space>
      )
    },
    {
      title: 'Sana', render: (_, r) => (
        <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(r.order?.created_at).format('DD.MM.YY HH:mm')}</Text>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Buyurtmalar</Title>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'Barchasi' }, ...Object.entries(STATUS).map(([k, v]) => ({ key: k, label: v.label }))].map(s => (
          <Button
            key={s.key}
            type={filter === s.key ? 'primary' : 'default'}
            size="small"
            onClick={() => setFilter(s.key)}
            style={{ borderRadius: 20 }}
          >
            {s.label}
            {s.key !== 'all' && statusCounts[s.key] > 0 && (
              <Badge count={statusCounts[s.key]} size="small" style={{ marginLeft: 4, background: filter === s.key ? 'rgba(255,255,255,0.3)' : '#8B4513' }} />
            )}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Xaridor yoki mahsulot qidirish..."
        prefix={<SearchOutlined />}
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: 300, borderRadius: 8, marginBottom: 16 }}
      />

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', overflow: 'hidden' }}>
        <Table
          columns={columns} dataSource={filtered} rowKey="id"
          loading={loading} scroll={{ x: 800 }}
          pagination={{ pageSize: 15, showTotal: t => `${t} ta buyurtma` }}
        />
      </div>

      {/* Order detail modal */}
      <Modal
        open={!!selected} onCancel={() => setSelected(null)} footer={null}
        title="Buyurtma tafsiloti" width={520}
      >
        {selected && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, padding: 16, background: '#faf8f5', borderRadius: 10 }}>
              <img
                src={selected.product?.images?.[0] || 'https://placehold.co/64/f5f0e8/8B4513?text=P'}
                style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }}
              />
              <div>
                <Text strong style={{ display: 'block', fontSize: 15 }}>{selected.product?.title}</Text>
                <Text type="secondary">{selected.quantity} ta × {selected.unit_price?.toLocaleString()} so'm</Text>
                <div><Text strong style={{ color: '#8B4513', fontSize: 16 }}>{selected.total_price?.toLocaleString()} so'm</Text></div>
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Xaridor">{selected.order?.buyer?.full_name}</Descriptions.Item>
              <Descriptions.Item label="Telefon">{selected.order?.buyer?.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{selected.order?.buyer?.email}</Descriptions.Item>
              <Descriptions.Item label="Manzil">
                {selected.order?.shipping_address?.address}, {selected.order?.shipping_address?.city}
              </Descriptions.Item>
              <Descriptions.Item label="To'lov">{selected.order?.payment_method}</Descriptions.Item>
              <Descriptions.Item label="Izoh">{selected.order?.notes || '—'}</Descriptions.Item>
              <Descriptions.Item label="Sana">{dayjs(selected.order?.created_at).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Holat">
                <Tag color={STATUS[selected.status]?.color}>{STATUS[selected.status]?.label}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {NEXT_STATUS[selected.status] && (
              <Button
                type="primary" block size="large" style={{ marginTop: 16, borderRadius: 10 }}
                loading={updating === selected.id}
                onClick={() => { handleUpdateStatus(selected.id, NEXT_STATUS[selected.status]); setSelected(null) }}
              >
                {STATUS[NEXT_STATUS[selected.status]]?.label} ga o'tkazish
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
