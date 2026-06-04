import { useState, useEffect } from 'react'
import { Table, Tag, Avatar, Typography, Input, Select, Button, Popconfirm, message, Modal, Descriptions } from 'antd'
import { UserOutlined, SearchOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, shop:seller_profiles(shop_name, rating, total_sales, is_verified)')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const handleRoleChange = async (userId, newRole) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x))
    message.success('Rol yangilandi')
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const columns = [
    {
      title: 'Foydalanuvchi', key: 'user',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar size={36} icon={<UserOutlined />} src={r.avatar_url}
            style={{ background: r.role === 'seller' ? '#8B4513' : '#1677ff', flexShrink: 0 }} />
          <div>
            <Text style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>{r.full_name || 'Noma\'lum'}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{r.city || '—'}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Rol', dataIndex: 'role', width: 130,
      render: (v, r) => (
        <Select
          value={v} size="small" style={{ width: 110 }}
          onChange={val => handleRoleChange(r.id, val)}
          options={[
            { value: 'buyer', label: 'Xaridor' },
            { value: 'seller', label: 'Sotuvchi' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
      )
    },
    {
      title: "Do'kon", key: 'shop',
      render: (_, r) => r.shop ? (
        <div>
          <Text style={{ fontSize: 13 }}>{r.shop.shop_name}</Text>
          {r.shop.is_verified && <Tag color="green" style={{ marginLeft: 6, fontSize: 10 }}>✓</Tag>}
        </div>
      ) : <Text type="secondary">—</Text>
    },
    {
      title: 'Telefon', dataIndex: 'phone',
      render: v => <Text style={{ fontSize: 13 }}>{v || '—'}</Text>
    },
    {
      title: "Qo'shildi", dataIndex: 'created_at',
      render: v => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).format('DD.MM.YYYY')}</Text>
    },
    {
      title: '', key: 'actions',
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelected(r)}>Ko'rish</Button>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Foydalanuvchilar ({users.length})</Title>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Jami', value: users.length, color: '#555' },
          { label: 'Xaridorlar', value: users.filter(u => u.role === 'buyer').length, color: '#1677ff' },
          { label: 'Sotuvchilar', value: users.filter(u => u.role === 'seller').length, color: '#8B4513' },
          { label: 'Adminlar', value: users.filter(u => u.role === 'admin').length, color: '#722ed1' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '10px 16px', border: '1px solid #e8e0d5', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="Ism bo'yicha qidirish..."
          prefix={<SearchOutlined />}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 280, borderRadius: 8 }}
        />
        <Select
          value={roleFilter} onChange={setRoleFilter} style={{ width: 140 }}
          options={[
            { value: 'all', label: 'Barcha rollar' },
            { value: 'buyer', label: 'Xaridorlar' },
            { value: 'seller', label: 'Sotuvchilar' },
            { value: 'admin', label: 'Adminlar' },
          ]}
        />
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', overflow: 'hidden' }}>
        <Table
          columns={columns} dataSource={filtered} rowKey="id"
          loading={loading} scroll={{ x: 750 }}
          pagination={{ pageSize: 15, showTotal: t => `${t} ta foydalanuvchi` }}
        />
      </div>

      {/* User detail modal */}
      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} title="Foydalanuvchi tafsiloti">
        {selected && (
          <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <Avatar size={64} icon={<UserOutlined />} src={selected.avatar_url}
                style={{ background: selected.role === 'seller' ? '#8B4513' : '#1677ff' }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>{selected.full_name}</Text>
                <div><Tag color={selected.role === 'seller' ? 'orange' : 'blue'}>{selected.role}</Tag></div>
              </div>
            </div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="ID">{selected.id.slice(0, 12)}...</Descriptions.Item>
              <Descriptions.Item label="Telefon">{selected.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Shahar">{selected.city || '—'}</Descriptions.Item>
              <Descriptions.Item label="Manzil">{selected.address || '—'}</Descriptions.Item>
              {selected.shop && <>
                <Descriptions.Item label="Do'kon">{selected.shop.shop_name}</Descriptions.Item>
                <Descriptions.Item label="Reyting">⭐ {Number(selected.shop.rating || 0).toFixed(1)}</Descriptions.Item>
                <Descriptions.Item label="Jami sotuv">{selected.shop.total_sales || 0}</Descriptions.Item>
                <Descriptions.Item label="Holat">{selected.shop.is_verified ? '✅ Tasdiqlangan' : '⏳ Kutilmoqda'}</Descriptions.Item>
              </>}
              <Descriptions.Item label="Ro'yxatdan o'tgan">{dayjs(selected.created_at).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
            </Descriptions>
            {selected.shop && !selected.shop.is_verified && (
              <Button
                type="primary" block style={{ marginTop: 16, borderRadius: 10, background: '#52c41a', borderColor: '#52c41a' }}
                onClick={async () => {
                  await supabase.from('seller_profiles').update({ is_verified: true }).eq('id', selected.id)
                  message.success('Sotuvchi tasdiqlandi!')
                  setSelected(null)
                  fetchUsers()
                }}
              >
                ✓ Sotuvchini tasdiqlash
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
