import { useEffect } from 'react'
import { Button, Typography, Empty, InputNumber, Divider, Tag, Spin } from 'antd'
import { DeleteOutlined, ShoppingOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const { Title, Text } = Typography

export default function Cart() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { items, loading, fetchCart, updateQuantity, removeFromCart } = useCartStore()

  useEffect(() => {
    if (profile) fetchCart(profile.id)
  }, [profile])

  const subtotal = items.reduce((s, i) => s + (i.product?.discount_price || i.product?.price || 0) * i.quantity, 0)
  const shipping = subtotal > 0 ? 25000 : 0
  const total = subtotal + shipping

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <Title level={2} style={{ marginBottom: 8 }}>
        <ShoppingOutlined /> Savat
      </Title>
      <Text type="secondary" style={{ marginBottom: 28, display: 'block' }}>
        {items.length} ta mahsulot
      </Text>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Empty description="Savat bo'sh" />
          <Button type="primary" style={{ marginTop: 20, borderRadius: 10 }} onClick={() => navigate('/products')}>
            Xarid qilishni boshlash
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Items */}
          <div style={{ flex: 1, minWidth: 300 }}>
            {items.map(item => {
              const p = item.product
              const price = p?.discount_price || p?.price || 0
              const hasDiscount = p?.discount_price && p.discount_price < p?.price
              return (
                <div key={item.id} style={{
                  background: 'white', borderRadius: 12, border: '1px solid #e8e0d5',
                  padding: 16, marginBottom: 12, display: 'flex', gap: 16
                }}>
                  <img
                    src={p?.images?.[0] || 'https://placehold.co/80x80/f5f0e8/8B4513?text=P'}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/products/${item.product_id}`)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <Text
                        strong
                        style={{ fontSize: 14, cursor: 'pointer', flex: 1 }}
                        onClick={() => navigate(`/products/${item.product_id}`)}
                      >
                        {p?.title}
                      </Text>
                      <Button
                        type="text" danger size="small" shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromCart(profile.id, item.product_id)}
                      />
                    </div>
                    {p?.seller && <Text type="secondary" style={{ fontSize: 12 }}>Sotuvchi: {p.seller.full_name}</Text>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <div>
                        <Text strong style={{ color: '#8B4513', fontSize: 16 }}>{price.toLocaleString()} so'm</Text>
                        {hasDiscount && (
                          <Text delete type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>{p.price.toLocaleString()}</Text>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <InputNumber
                          min={1} max={p?.stock || 99}
                          value={item.quantity}
                          onChange={val => updateQuantity(profile.id, item.product_id, val)}
                          size="small"
                          style={{ width: 70 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          = {(price * item.quantity).toLocaleString()} so'm
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', padding: 20, position: 'sticky', top: 80 }}>
              <Title level={4} style={{ marginBottom: 16 }}>Hisob-kitob</Title>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">Mahsulotlar ({items.length})</Text>
                <Text>{subtotal.toLocaleString()} so'm</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">Yetkazib berish</Text>
                <Text>{shipping > 0 ? `${shipping.toLocaleString()} so'm` : 'Hisoblash'}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text strong style={{ fontSize: 16 }}>Jami</Text>
                <Text strong style={{ fontSize: 18, color: '#8B4513' }}>{total.toLocaleString()} so'm</Text>
              </div>
              <Button
                type="primary" block size="large"
                style={{ borderRadius: 10, height: 48, fontSize: 16 }}
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/checkout')}
              >
                Buyurtma berish
              </Button>
              <Button
                block style={{ marginTop: 10, borderRadius: 10 }}
                onClick={() => navigate('/products')}
              >
                Xarid davom ettirish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
