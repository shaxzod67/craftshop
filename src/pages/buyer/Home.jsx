import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Typography, Tag, Rate, Spin, Empty, Badge } from 'antd'
import { ShoppingCartOutlined, HeartOutlined, HeartFilled, ArrowRightOutlined, FireOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { message } from 'antd'

const { Title, Text, Paragraph } = Typography

const CATEGORIES = [
  { slug: 'ceramics', name: 'Keramika', icon: '🏺' },
  { slug: 'textiles', name: 'To\'qimachilik', icon: '🧵' },
  { slug: 'woodwork', name: 'Yog\'och', icon: '🪵' },
  { slug: 'embroidery', name: 'Kashtachilik', icon: '🪡' },
  { slug: 'jewelry', name: 'Zargarlik', icon: '💍' },
  { slug: 'paintings', name: 'Rassomchilik', icon: '🎨' },
  { slug: 'leather', name: 'Charm', icon: '👜' },
  { slug: 'metalwork', name: 'Metallarga ishlov', icon: '⚒️' },
  { slug: 'calligraphy', name: 'Xattotlik', icon: '✍️' },
  { slug: 'miniature', name: 'Miniatyura', icon: '🖼️' },
]

function ProductCard({ product }) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { addToCart, items } = useCartStore()
  const [wishlisted, setWishlisted] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)

  const inCart = items.some(i => i.product_id === product.id)
  const hasDiscount = product.discount_price && product.discount_price < product.price
  const img = product.images?.[0] || 'https://placehold.co/300x300/f5f0e8/8B4513?text=🏺'

  const handleAddToCart = async (e) => {
    e.stopPropagation()
    if (!profile) { navigate('/auth'); return }
    setCartLoading(true)
    try {
      await addToCart(profile.id, product.id)
      message.success('Savatga qo\'shildi!')
    } catch { message.error('Xatolik yuz berdi') }
    finally { setCartLoading(false) }
  }

  return (
    <div
      className="craft-card"
      style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={img} alt={product.title}
          className="product-card-img"
          onError={e => { e.target.src = 'https://placehold.co/300x300/f5f0e8/8B4513?text=🏺' }}
          style={{ transition: 'transform 0.3s' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        {hasDiscount && (
          <Tag color="red" style={{ position: 'absolute', top: 8, left: 8, fontWeight: 700 }}>
            -{Math.round((1 - product.discount_price / product.price) * 100)}%
          </Tag>
        )}
        <button
          className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); setWishlisted(!wishlisted) }}
        >
          {wishlisted
            ? <HeartFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
            : <HeartOutlined style={{ fontSize: 14 }} />
          }
        </button>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <Text style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.title}
        </Text>
        {product.rating > 0 && (
          <div style={{ marginBottom: 4 }}>
            <Rate disabled defaultValue={product.rating} allowHalf style={{ fontSize: 11 }} />
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>({product.review_count})</Text>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            {hasDiscount ? (
              <div>
                <Text strong style={{ color: '#8B4513', fontSize: 16 }}>
                  {product.discount_price?.toLocaleString()} so'm
                </Text>
                <Text delete type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                  {product.price?.toLocaleString()}
                </Text>
              </div>
            ) : (
              <Text strong style={{ color: '#8B4513', fontSize: 16 }}>
                {product.price?.toLocaleString()} so'm
              </Text>
            )}
          </div>
          <Button
            type={inCart ? 'default' : 'primary'}
            shape="circle"
            icon={<ShoppingCartOutlined />}
            size="small"
            loading={cartLoading}
            onClick={handleAddToCart}
          />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newProducts, setNewProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const [featured, recent] = await Promise.all([
      supabase.from('products').select('*').eq('is_featured', true).eq('is_active', true).limit(8),
      supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(12),
    ])
    setFeaturedProducts(featured.data || [])
    setNewProducts(recent.data || [])
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
      {/* Hero Banner */}
      <div className="hero-banner" style={{ margin: '24px 0' }}>
        <Row gutter={48} align="middle">
          <Col xs={24} md={14}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
              O'zbek Hunarmandligi
            </div>
            <Title level={1} style={{ color: 'white', margin: 0, fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1.2 }}>
              Authentic Craft.<br />
              <span style={{ color: '#c8a450' }}>Directly from Artisans.</span>
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 16, maxWidth: 400 }}>
              Minglab hunarmandlar asarlarini kashf eting — keramika, kashtachilik, zargarlik va boshqalar.
            </Paragraph>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <Button size="large" onClick={() => navigate('/products')}
                style={{ borderRadius: 10, background: '#c8a450', border: 'none', color: 'white', fontWeight: 600, height: 48 }}>
                Mahsulotlar <ArrowRightOutlined />
              </Button>
              <Button size="large" ghost onClick={() => navigate('/seller/auth')}
                style={{ borderRadius: 10, height: 48, borderColor: 'rgba(255,255,255,0.4)' }}>
                Sotuvchi bo'lish
              </Button>
            </div>
          </Col>
          <Col xs={0} md={10} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 120, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>🏺</div>
          </Col>
        </Row>
      </div>

      {/* Stats row */}
      <Row gutter={16} style={{ marginBottom: 32 }}>
        {[
          { value: '500+', label: 'Hunarmand', icon: '👨‍🎨' },
          { value: '5,000+', label: 'Mahsulot', icon: '🛍️' },
          { value: '10,000+', label: 'Xaridor', icon: '👥' },
          { value: '50+', label: 'Shahar', icon: '📍' },
        ].map(s => (
          <Col xs={12} sm={6} key={s.label}>
            <div style={{ background: 'white', borderRadius: 12, padding: '16px', textAlign: 'center', border: '1px solid #e8e0d5' }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#8B4513' }}>{s.value}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Categories */}
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 16 }}>Kategoriyalar</Title>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              className={`category-tag ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => {
                const next = activeCategory === cat.slug ? null : cat.slug
                setActiveCategory(next)
                navigate(`/products?category=${cat.slug}`)
              }}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0 }}>
            <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Tanlangan mahsulotlar
          </Title>
          <Button type="link" onClick={() => navigate('/products?featured=true')} style={{ color: '#8B4513' }}>
            Barchasini ko'rish <ArrowRightOutlined />
          </Button>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div> : (
          featuredProducts.length === 0
            ? <Empty description="Hali mahsulotlar yo'q" />
            : <Row gutter={[16, 16]}>
                {featuredProducts.map(p => (
                  <Col xs={12} sm={8} md={6} key={p.id}>
                    <ProductCard product={p} />
                  </Col>
                ))}
              </Row>
        )}
      </div>

      {/* New Arrivals */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0 }}>
            <StarOutlined style={{ color: '#c8a450', marginRight: 8 }} />
            Yangi mahsulotlar
          </Title>
          <Button type="link" onClick={() => navigate('/products')} style={{ color: '#8B4513' }}>
            Barchasini ko'rish <ArrowRightOutlined />
          </Button>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> : (
          <Row gutter={[16, 16]}>
            {newProducts.map(p => (
              <Col xs={12} sm={8} md={6} lg={4} key={p.id}>
                <ProductCard product={p} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Seller CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f0e8, #ead5b8)',
        borderRadius: 16, padding: '40px 48px', textAlign: 'center',
        marginBottom: 48, border: '1px solid #e8d5bb'
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
        <Title level={2} style={{ color: '#8B4513', margin: 0 }}>Hunarmand sifatida savdo qiling</Title>
        <Paragraph type="secondary" style={{ maxWidth: 500, margin: '12px auto 24px' }}>
          CraftShop platformasiga qo'shiling, o'z asarlaringizni minglab xaridorlarga yetkazing
        </Paragraph>
        <Button type="primary" size="large" onClick={() => navigate('/seller/auth')}
          style={{ borderRadius: 10, height: 48, fontSize: 16, paddingInline: 32 }}>
          Do'kon ochish — Bepul!
        </Button>
      </div>
    </div>
  )
}
