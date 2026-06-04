import { useState, useEffect } from 'react'
import { Typography, Tag, Button, Tabs, Empty, Spin, Modal, Descriptions, Rate, Input, message } from 'antd'
import { EyeOutlined, StarOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const STATUS = {
  pending: { color: 'orange', label: 'Kutilmoqda', icon: '⏳' },
  confirmed: { color: 'blue', label: 'Tasdiqlangan', icon: '✅' },
  processing: { color: 'cyan', label: 'Jarayonda', icon: '🔧' },
  shipped: { color: 'geekblue', label: 'Yuborildi', icon: '🚚' },
  delivered: { color: 'green', label: 'Yetkazildi', icon: '📦' },
  cancelled: { color: 'red', label: 'Bekor qilindi', icon: '❌' },
}

export default function BuyerOrders() {
  const { profile } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => { fetchOrders() }, [profile])

  const fetchOrders = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(id, title, images, price),
          seller:profiles!seller_id(full_name)
        )
      `)
      .eq('buyer_id', profile.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const handleReview = async () => {
    setReviewLoading(true)
    try {
      await supabase.from('reviews').upsert({
        product_id: reviewModal.product_id,
        buyer_id: profile.id,
        rating: reviewRating,
        comment: reviewText,
      })
      message.success('Sharh qoldirildi!')
      setReviewModal(null)
      setReviewText('')
      setReviewRating(5)
    } catch { message.error('Xatolik') }
    finally { setReviewLoading(false) }
  }

  const allOrders = orders
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'delivered')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  const OrderCard = ({ order }) => (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', marginBottom: 12, overflow: 'hidden' }}>
      {/* Order header */}
      <div style={{ padding: '12px 16px', background: '#faf8f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e0d5' }}>
        <div>
          <Text strong style={{ fontSize: 13 }}>Buyurtma #{order.id.slice(0, 8).toUpperCase()}</Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>{dayjs(order.created_at).format('DD.MM.YYYY HH:mm')}</Text>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag color={STATUS[order.status]?.color}>{STATUS[order.status]?.icon} {STATUS[order.status]?.label}</Tag>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelected(order)}>Tafsilot</Button>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '12px 16px' }}>
        {order.items?.slice(0, 3).map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
            <img
              src={item.product?.images?.[0] || 'https://placehold.co/40x40/f5f0e8/8B4513?text=P'}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
            />
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 13 }}>{item.product?.title}</Text>
              <div><Text type="secondary" style={{ fontSize: 11 }}>{item.quantity} ta · {item.seller?.full_name}</Text></div>
            </div>
            <Text style={{ color: '#8B4513', fontSize: 13, fontWeight: 600 }}>{item.total_price?.toLocaleString()} so'm</Text>
            {order.status === 'delivered' && (
              <Button
                size="small" icon={<StarOutlined />} type="link" style={{ color: '#c8a450' }}
                onClick={() => setReviewModal({ product_id: item.product_id, title: item.product?.title })}
              >
                Sharh
              </Button>
            )}
          </div>
        ))}
        {order.items?.length > 3 && (
          <Text type="secondary" style={{ fontSize: 12 }}>+{order.items.length - 3} ta mahsulot</Text>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0ece8' }}>
          <Text strong style={{ color: '#8B4513' }}>Jami: {order.total_amount?.toLocaleString()} so'm</Text>
        </div>
      </div>
    </div>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>Buyurtmalarim</Title>

      <Tabs
        items={[
          { key: 'all', label: `Barchasi (${allOrders.length})`, children: allOrders.length ? allOrders.map(o => <OrderCard key={o.id} order={o} />) : <Empty description="Buyurtmalar yo'q" /> },
          { key: 'active', label: `Faol (${activeOrders.length})`, children: activeOrders.length ? activeOrders.map(o => <OrderCard key={o.id} order={o} />) : <Empty description="Faol buyurtmalar yo'q" /> },
          { key: 'done', label: `Yetkazilgan (${completedOrders.length})`, children: completedOrders.length ? completedOrders.map(o => <OrderCard key={o.id} order={o} />) : <Empty description="Yetkazilgan buyurtmalar yo'q" /> },
          { key: 'cancelled', label: `Bekor qilingan (${cancelledOrders.length})`, children: cancelledOrders.length ? cancelledOrders.map(o => <OrderCard key={o.id} order={o} />) : <Empty description="Bekor qilingan buyurtmalar yo'q" /> },
        ]}
      />

      {/* Order detail modal */}
      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} title="Buyurtma tafsiloti" width={560}>
        {selected && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Holat"><Tag color={STATUS[selected.status]?.color}>{STATUS[selected.status]?.label}</Tag></Descriptions.Item>
            <Descriptions.Item label="Sana">{dayjs(selected.created_at).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Manzil">{selected.shipping_address?.address}, {selected.shipping_address?.city}</Descriptions.Item>
            <Descriptions.Item label="To'lov">{selected.payment_method} · {selected.payment_status}</Descriptions.Item>
            <Descriptions.Item label="Jami"><Text strong style={{ color: '#8B4513' }}>{selected.total_amount?.toLocaleString()} so'm</Text></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Review modal */}
      <Modal
        open={!!reviewModal} onCancel={() => setReviewModal(null)} title="Sharh qoldirish"
        onOk={handleReview} okText="Yuborish" confirmLoading={reviewLoading}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">{reviewModal?.title}</Text>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Rate value={reviewRating} onChange={setReviewRating} />
        </div>
        <Input.TextArea
          rows={4} placeholder="Mahsulot haqida fikringizni yozing..."
          value={reviewText} onChange={e => setReviewText(e.target.value)}
        />
      </Modal>
    </div>
  )
}
