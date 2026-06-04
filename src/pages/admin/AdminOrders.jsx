import { useState, useEffect } from 'react'
import { Table, Tag, Typography, Input, Select, Button, Modal, Descriptions, message } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS = {
  pending: { color: 'orange', label: 'Kutilmoqda' },
  confirmed: { color: 'blue', label: 'Tasdiqlangan' },
  processing: { color: 'cyan', label: 'Jarayonda' },
  shipped: { color: 'geekblue', label: 'Yuborildi' },
  delivered: { color: 'green', label: 'Yetkazildi' },
  cancelled: { color: 'red', label: 'Bekor qilindi' },
  refunded: { color: 'purple', label: 'Qaytarildi' },
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!buyer_id(full_name, phone),
        items:order_items(id, quantity, total_price, product:products(title))
      `)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const handleStatusChange = async (orderId, status) => {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(o => o.map(x => x.id === orderId ? { ...x, status } : x))
    message.success('Holat yangilandi')
  }

  const filtered = orders.filter(o => {
    const ms = !search || o.buyer?.full_name?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
    const mst = statusFilter === 'all' || o.status === statusFilter
    return ms && mst
  })

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_amount || 0), 0)

  const columns = [
    {
      title: 'ID', dataIndex: 'id', width: 100,
      render: v => <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>#{v.slice(0, 8).toUpperCase()}</Text>
    },
    {
      title: 'Xaridor', key: 'buyer',
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 13 }}>{r.buyer?.full_name}</Text>
          <div><Text type="secondary" style={{ fontSize: 11 }}>{r.buyer?.phone}</Text></div>
        </div>
      )
    },
    {
      title: 'Mahsulotlar', key: 'items',
      render: (_, r) => (
        <div>
          {r.items?.slice(0, 2).map((item, i) => (
            <Tag key={i} style={{ fontSize: 11, marginBottom: 2 }}>{item.product?.title?.slice(0, 20)}...</Tag>
          ))}
          {r.items?.length > 2 && <Tag>+{r.items.length - 2}</Tag>}
        </div>
      )
    },
    {
      title: 'Summa', dataIndex: 'total_amount',
      render: v => <Text strong style={{ color: '#8B4513' }}>{v?.toLocaleString()} so'm</Text>
    },
    {
      title: 'Holat', key: 'status',
      render: (_, r) => (
        <Select
          value={r.status} size="small" style={{ width: 140 }}
          onChange={val => handleStatusChange(r.id, val)}
          options={Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
        />
      )
    },
    {
      title: "To'lov", dataIndex: 'payment_status',
      render: v => <Tag color={v === 'paid' ? 'green' : 'orange'}>{v}</Tag>
    },
    {
      title: 'Sana', dataIndex: 'created_at',
      render: v => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).format('DD.MM.YY HH:mm')}</Text>
    },
    {
      title: '', key: 'action',
      render: (_, r) => <Button size="small" icon={<EyeOutlined />} onClick={() => setSelected(r)} />
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Buyurtmalar</Title>
        <div style={{ background: 'white', borderRadius: 10, padding: '8px 16px', border: '1px solid #e8e0d5' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Jami daromad: </Text>
          <Text strong style={{ color: '#52c41a' }}>{totalRevenue.toLocaleString()} so'm</Text>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'Barchasi', count: orders.length }, ...Object.entries(STATUS).map(([k, v]) => ({ key: k, label: v.label, count: orders.filter(o => o.status === k).length }))].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            style={{
              padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, border: '1px solid',
              background: statusFilter === s.key ? '#8B4513' : 'white',
              color: statusFilter === s.key ? 'white' : '#555',
              borderColor: statusFilter === s.key ? '#8B4513' : '#e8e0d5',
            }}
          >
            {s.label} ({s.count})
          </button>
        ))}
      </div>

      <Input
        placeholder="Xaridor yoki buyurtma ID..."
        prefix={<SearchOutlined />}
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: 300, borderRadius: 8, marginBottom: 16 }}
      />

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', overflow: 'hidden' }}>
        <Table
          columns={columns} dataSource={filtered} rowKey="id"
          loading={loading} scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showTotal: t => `${t} ta buyurtma` }}
        />
      </div>

      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} title="Buyurtma tafsiloti" width={560}>
        {selected && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="ID">{selected.id}</Descriptions.Item>
              <Descriptions.Item label="Xaridor">{selected.buyer?.full_name}</Descriptions.Item>
              <Descriptions.Item label="Telefon">{selected.buyer?.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Manzil">
                {selected.shipping_address?.address}, {selected.shipping_address?.city}
              </Descriptions.Item>
              <Descriptions.Item label="Summa">
                <Text strong style={{ color: '#8B4513' }}>{selected.total_amount?.toLocaleString()} so'm</Text>
              </Descriptions.Item>
              <Descriptions.Item label="To'lov usuli">{selected.payment_method}</Descriptions.Item>
              <Descriptions.Item label="Holat">
                <Tag color={STATUS[selected.status]?.color}>{STATUS[selected.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Izoh">{selected.notes || '—'}</Descriptions.Item>
              <Descriptions.Item label="Sana">{dayjs(selected.created_at).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Mahsulotlar:</Text>
              {selected.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  <Text>{item.product?.title}</Text>
                  <Text strong style={{ color: '#8B4513' }}>{item.total_price?.toLocaleString()} so'm</Text>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
