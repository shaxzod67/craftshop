import { useState, useEffect } from 'react'
import { Table, Tag, Typography, Input, Select, Switch, Button, Popconfirm, message, Image } from 'antd'
import { SearchOutlined, DeleteOutlined, StarOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [categories, setCategories] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [prods, cats] = await Promise.all([
      supabase.from('products').select('*, category:categories(name), seller:profiles!seller_id(full_name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
    ])
    setProducts(prods.data || [])
    setCategories(cats.data || [])
    setLoading(false)
  }

  const handleToggle = async (id, field, value) => {
    await supabase.from('products').update({ [field]: value }).eq('id', id)
    setProducts(p => p.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  const handleDelete = async (id) => {
    await supabase.from('products').delete().eq('id', id)
    setProducts(p => p.filter(x => x.id !== id))
    message.success("Mahsulot o'chirildi")
  }

  const filtered = products.filter(p => {
    const ms = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.seller?.full_name?.toLowerCase().includes(search.toLowerCase())
    const mc = catFilter === 'all' || p.category_id === catFilter
    return ms && mc
  })

  const columns = [
    {
      title: 'Mahsulot', key: 'product', width: 280,
      render: (_, p) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Image
            src={p.images?.[0] || 'https://placehold.co/40x40/f5f0e8/8B4513?text=P'}
            width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover' }} preview={false}
            fallback="https://placehold.co/40x40"
          />
          <div>
            <Text style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</Text>
            <div><Text type="secondary" style={{ fontSize: 11 }}>by {p.seller?.full_name}</Text></div>
          </div>
        </div>
      )
    },
    { title: 'Kategoriya', render: (_, p) => <Tag>{p.category?.name || '—'}</Tag> },
    { title: 'Narx', render: (_, p) => <Text strong style={{ color: '#8B4513' }}>{p.price?.toLocaleString()} so'm</Text> },
    { title: 'Stok', dataIndex: 'stock', render: v => <Tag color={v > 0 ? 'green' : 'red'}>{v} ta</Tag> },
    { title: 'Ko\'rishlar', dataIndex: 'view_count', render: v => <Text type="secondary">{v || 0}</Text> },
    {
      title: 'Faol', dataIndex: 'is_active',
      render: (v, r) => <Switch checked={v} size="small" onChange={val => handleToggle(r.id, 'is_active', val)} />
    },
    {
      title: 'Featured', dataIndex: 'is_featured',
      render: (v, r) => <Switch checked={v} size="small" onChange={val => handleToggle(r.id, 'is_featured', val)} />
    },
    {
      title: 'Sana', dataIndex: 'created_at',
      render: v => <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(v).format('DD.MM.YY')}</Text>
    },
    {
      title: '', key: 'action',
      render: (_, r) => (
        <Popconfirm title="O'chirishni tasdiqlaysizmi?" onConfirm={() => handleDelete(r.id)} okText="Ha" cancelText="Yo'q">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Mahsulotlar ({products.length})</Title>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="Mahsulot yoki sotuvchi..." prefix={<SearchOutlined />}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 280, borderRadius: 8 }}
        />
        <Select
          value={catFilter} onChange={setCatFilter} style={{ width: 160 }}
          options={[{ value: 'all', label: 'Barcha kategoriya' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
        />
        <Select defaultValue="all" style={{ width: 140 }}
          options={[{ value: 'all', label: 'Barchasi' }, { value: 'active', label: 'Faol' }, { value: 'inactive', label: 'Yopiq' }]}
        />
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', overflow: 'hidden' }}>
        <Table
          columns={columns} dataSource={filtered} rowKey="id"
          loading={loading} scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showTotal: t => `${t} ta mahsulot` }}
        />
      </div>
    </div>
  )
}
