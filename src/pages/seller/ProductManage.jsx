import { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Typography, Input, Select, Switch, Popconfirm, Image, message, Row, Col, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function ProductManage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchProducts() }, [profile])

  const fetchProducts = async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const handleToggleActive = async (id, value) => {
    await supabase.from('products').update({ is_active: value }).eq('id', id)
    setProducts(p => p.map(x => x.id === id ? { ...x, is_active: value } : x))
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { message.error('O\'chirish xatoligi'); return }
    setProducts(p => p.filter(x => x.id !== id))
    message.success('Mahsulot o\'chirildi')
  }

  const filtered = products.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? p.is_active : !p.is_active
    return matchSearch && matchStatus
  })

  const columns = [
    {
      title: 'Mahsulot', key: 'product', width: 280,
      render: (_, p) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Image
            src={p.images?.[0] || 'https://placehold.co/48x48/f5f0e8/8B4513?text=P'}
            width={48} height={48}
            style={{ borderRadius: 8, objectFit: 'cover' }}
            preview={false}
            fallback="https://placehold.co/48x48/f5f0e8/8B4513?text=P"
          />
          <div>
            <Text style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>{p.title}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{p.category?.name}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Narx', key: 'price',
      render: (_, p) => (
        <div>
          <Text strong style={{ color: '#8B4513' }}>{p.price?.toLocaleString()} so'm</Text>
          {p.discount_price && (
            <div><Text delete type="secondary" style={{ fontSize: 11 }}>{p.discount_price?.toLocaleString()}</Text></div>
          )}
        </div>
      )
    },
    {
      title: 'Stok', dataIndex: 'stock',
      render: v => <Tag color={v > 10 ? 'green' : v > 0 ? 'orange' : 'red'}>{v} ta</Tag>
    },
    {
      title: 'Ko\'rishlar', dataIndex: 'view_count',
      render: v => <Text type="secondary"><EyeOutlined /> {v || 0}</Text>
    },
    {
      title: 'Reyting', dataIndex: 'rating',
      render: (v, p) => v > 0 ? <Text>⭐ {Number(v).toFixed(1)} ({p.review_count})</Text> : <Text type="secondary">—</Text>
    },
    {
      title: 'Featured', dataIndex: 'is_featured',
      render: (v, p) => (
        <Switch
          checked={v} size="small"
          onChange={val => { supabase.from('products').update({ is_featured: val }).eq('id', p.id); setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_featured: val } : x)) }}
        />
      )
    },
    {
      title: 'Holat', dataIndex: 'is_active',
      render: (v, p) => <Switch checked={v} size="small" onChange={val => handleToggleActive(p.id, val)} checkedChildren="Faol" unCheckedChildren="Yopiq" />
    },
    {
      title: 'Sana', dataIndex: 'created_at',
      render: v => <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(v).format('DD.MM.YY')}</Text>
    },
    {
      title: '', key: 'actions',
      render: (_, p) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/seller/products/edit/${p.id}`)} />
          <Popconfirm title="O'chirishni tasdiqlaysizmi?" onConfirm={() => handleDelete(p.id)} okText="Ha" cancelText="Yo'q">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ]

  const activeCount = products.filter(p => p.is_active).length
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0)
  const avgRating = products.filter(p => p.rating > 0).reduce((s, p, _, a) => s + p.rating / a.length, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Mahsulotlar</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/seller/products/new')} style={{ borderRadius: 10 }}>
          Yangi mahsulot
        </Button>
      </div>

      {/* Quick stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { title: 'Jami', value: products.length },
          { title: 'Faol', value: activeCount },
          { title: 'Umumiy stok', value: totalStock },
          { title: 'O\'rtacha reyting', value: avgRating > 0 ? `⭐ ${avgRating.toFixed(1)}` : '—' },
        ].map(s => (
          <Col xs={12} md={6} key={s.title}>
            <div style={{ background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e8e0d5', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#8B4513' }}>{s.value}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.title}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="Mahsulot qidirish..."
          prefix={<SearchOutlined />}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 280, borderRadius: 8 }}
        />
        <Select
          value={statusFilter} onChange={setStatusFilter}
          style={{ width: 140 }}
          options={[
            { value: 'all', label: 'Barchasi' },
            { value: 'active', label: 'Faol' },
            { value: 'inactive', label: 'Yopiq' },
          ]}
        />
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (total) => `${total} ta mahsulot` }}
        />
      </div>
    </div>
  )
}
