import { useState, useEffect } from 'react'
import { Row, Col, Avatar, Typography, Rate, Tag, Spin, Empty, Button, Tabs, message } from 'antd'
import { ShopOutlined, ShoppingCartOutlined, MessageOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const { Title, Text, Paragraph } = Typography

export default function ShopPage() {
  const { sellerId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { addToCart } = useCartStore()
  const [seller, setSeller] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchShop() }, [sellerId])

  const fetchShop = async () => {
    const [sellerData, productsData] = await Promise.all([
      supabase.from('profiles').select('*, shop:seller_profiles(*)').eq('id', sellerId).single(),
      supabase.from('products').select('*').eq('seller_id', sellerId).eq('is_active', true).order('created_at', { ascending: false }),
    ])
    setSeller(sellerData.data)
    setProducts(productsData.data || [])
    setLoading(false)
  }

  const handleAddToCart = async (productId, e) => {
    e.stopPropagation()
    if (!profile) { navigate('/auth'); return }
    try {
      await addToCart(profile.id, productId)
      message.success('Savatga qo\'shildi!')
    } catch { message.error('Xatolik') }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  if (!seller) return null

  const shop = seller.shop

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Shop banner */}
      <div style={{
        background: shop?.shop_banner_url ? `url(${shop.shop_banner_url})` : 'linear-gradient(135deg, #2c1810, #8B4513)',
        backgroundSize: 'cover', height: 200, position: 'relative'
      }} />

      <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Shop header */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginTop: -40, marginBottom: 24, flexWrap: 'wrap' }}>
          <Avatar
            size={80} icon={<ShopOutlined />} src={shop?.shop_logo_url}
            style={{ background: '#8B4513', border: '4px solid white', flexShrink: 0 }}
          />
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <Title level={2} style={{ margin: 0 }}>{shop?.shop_name || seller.full_name}</Title>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {shop?.rating > 0 && (
                <>
                  <Rate disabled value={shop.rating} allowHalf style={{ fontSize: 14 }} />
                  <Text>{Number(shop.rating).toFixed(1)}</Text>
                </>
              )}
              {shop?.is_verified && <Tag color="green">✓ Tasdiqlangan sotuvchi</Tag>}
              <Text type="secondary">{products.length} ta mahsulot</Text>
              {shop?.total_sales > 0 && <Text type="secondary">{shop.total_sales} sotuv</Text>}
            </div>
          </div>
          {profile && profile.id !== sellerId && (
            <Button icon={<MessageOutlined />} style={{ borderRadius: 10 }}>
              Xabar yuborish
            </Button>
          )}
        </div>

        {shop?.shop_description && (
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>{shop.shop_description}</Paragraph>
        )}

        {/* Products */}
        <Tabs items={[{
          key: 'products',
          label: `Mahsulotlar (${products.length})`,
          children: products.length === 0 ? (
            <Empty description="Mahsulotlar yo'q" />
          ) : (
            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              {products.map(p => (
                <Col xs={12} sm={8} md={6} key={p.id}>
                  <div className="craft-card" style={{ cursor: 'pointer', overflow: 'hidden' }}
                    onClick={() => navigate(`/products/${p.id}`)}>
                    <img
                      src={p.images?.[0] || 'https://placehold.co/280x280/f5f0e8/8B4513?text=🏺'}
                      className="product-card-img"
                    />
                    <div style={{ padding: '10px 12px' }}>
                      <Text style={{ fontSize: 13, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                        {p.title}
                      </Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: '#8B4513' }}>
                          {(p.discount_price || p.price)?.toLocaleString()} so'm
                        </Text>
                        <Button
                          type="primary" size="small" shape="circle"
                          icon={<ShoppingCartOutlined />}
                          onClick={e => handleAddToCart(p.id, e)}
                          disabled={p.stock === 0}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )
        }]} />
      </div>
    </div>
  )
}
