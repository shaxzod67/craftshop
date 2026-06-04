import { useState, useEffect } from 'react'
import { Row, Col, Typography, Button, Empty, Spin, message } from 'antd'
import { HeartFilled, ShoppingCartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const { Title, Text } = Typography

export default function Wishlist() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { addToCart } = useCartStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchWishlist() }, [profile])

  const fetchWishlist = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('wishlists')
      .select('*, product:products(id, title, price, discount_price, images, stock, rating)')
      .eq('buyer_id', profile.id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  const handleRemove = async (productId) => {
    await supabase.from('wishlists').delete().eq('buyer_id', profile.id).eq('product_id', productId)
    setItems(i => i.filter(x => x.product_id !== productId))
    message.success('Sevimlilardan o\'chirildi')
  }

  const handleAddToCart = async (item) => {
    try {
      await addToCart(profile.id, item.product_id)
      message.success('Savatga qo\'shildi!')
    } catch { message.error('Xatolik') }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <HeartFilled style={{ color: '#ff4d4f', marginRight: 8 }} />
        Sevimlilar
      </Title>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Empty description="Sevimlilar ro'yxati bo'sh" />
          <Button type="primary" style={{ marginTop: 20, borderRadius: 10 }} onClick={() => navigate('/products')}>
            Mahsulotlarni ko'rish
          </Button>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {items.map(item => {
            const p = item.product
            const price = p?.discount_price || p?.price
            return (
              <Col xs={12} sm={8} md={6} key={item.id}>
                <div className="craft-card" style={{ overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/products/${item.product_id}`)}>
                    <img
                      src={p?.images?.[0] || 'https://placehold.co/280x280/f5f0e8/8B4513?text=🏺'}
                      className="product-card-img"
                    />
                    <button
                      className="wishlist-btn active"
                      onClick={e => { e.stopPropagation(); handleRemove(item.product_id) }}
                    >
                      <HeartFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                    </button>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <Text style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p?.title}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ color: '#8B4513' }}>{price?.toLocaleString()} so'm</Text>
                      <Button
                        type="primary" size="small" shape="circle"
                        icon={<ShoppingCartOutlined />}
                        disabled={p?.stock === 0}
                        onClick={() => handleAddToCart(item)}
                      />
                    </div>
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}
