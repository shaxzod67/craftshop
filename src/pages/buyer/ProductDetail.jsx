import { useState, useEffect } from 'react'
import { Row, Col, Button, Typography, Rate, Tag, Divider, Tabs, Avatar, Spin, Image, InputNumber, message, Breadcrumb } from 'antd'
import { ShoppingCartOutlined, HeartOutlined, HeartFilled, ShareAltOutlined, MessageOutlined, ShopOutlined } from '@ant-design/icons'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { addToCart, items } = useCartStore()
  const [product, setProduct] = useState(null)
  const [seller, setSeller] = useState(null)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const inCart = items.some(i => i.product_id === id)

  useEffect(() => { fetchProduct() }, [id])

  const fetchProduct = async () => {
    setLoading(true)

    // ✅ .catch() o'rniga try/catch
    try {
      await supabase.rpc('increment', { table_name: 'products', column_name: 'view_count', row_id: id })
    } catch {}

    const { data: prod } = await supabase
      .from('products')
      .select('*, category:categories(name, slug)')
      .eq('id', id)
      .single()

    if (!prod) { navigate('/products'); return }
    setProduct(prod)

    const [sellerData, reviewData, relatedData] = await Promise.all([
      supabase.from('profiles').select('*, seller_profile:seller_profiles(*)').eq('id', prod.seller_id).single(),
      supabase.from('reviews').select('*, buyer:profiles(full_name, avatar_url)').eq('product_id', id).order('created_at', { ascending: false }).limit(10),
      supabase.from('products').select('*').eq('category_id', prod.category_id).neq('id', id).limit(6),
    ])
    setSeller(sellerData.data)
    setReviews(reviewData.data || [])
    setRelated(relatedData.data || [])

    if (profile) {
      const { data: wl } = await supabase
        .from('wishlists')
        .select('id')
        .eq('buyer_id', profile.id)
        .eq('product_id', id)
        .single()
      setWishlisted(!!wl)
    }
    setLoading(false)
  }

  const handleAddToCart = async () => {
    if (!profile) { navigate('/auth'); return }
    setCartLoading(true)
    try {
      await addToCart(profile.id, id, qty)
      message.success(`${qty} ta savatga qo'shildi!`)
    } catch {
      message.error('Xatolik')
    } finally {
      setCartLoading(false)
    }
  }

  const handleWishlist = async () => {
    if (!profile) { navigate('/auth'); return }
    const next = !wishlisted
    setWishlisted(next)
    if (next) await supabase.from('wishlists').upsert({ buyer_id: profile.id, product_id: id })
    else await supabase.from('wishlists').delete().eq('buyer_id', profile.id).eq('product_id', id)
  }

  const handleBuyNow = async () => {
    if (!profile) { navigate('/auth'); return }
    await addToCart(profile.id, id, qty)
    navigate('/checkout')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  if (!product) return null

  const hasDiscount = product.discount_price && product.discount_price < product.price
  const discount = hasDiscount ? Math.round((1 - product.discount_price / product.price) * 100) : 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 20 }} items={[
        { title: <Link to="/">Bosh sahifa</Link> },
        { title: <Link to="/products">Mahsulotlar</Link> },
        { title: product.category?.name || 'Kategoriya', href: `/products?category=${product.category?.slug}` },
        { title: product.title },
      ]} />

      <Row gutter={[32, 32]}>
        {/* Images */}
        <Col xs={24} md={11}>
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12, background: '#f5f0e8', aspectRatio: '1' }}>
              <Image
                src={product.images?.[activeImg] || 'https://placehold.co/500x500/f5f0e8/8B4513?text=🏺'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallback="https://placehold.co/500x500/f5f0e8/8B4513?text=🏺"
              />
            </div>
            {product.images?.length > 1 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 64, height: 64, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: activeImg === i ? '2px solid #8B4513' : '2px solid transparent',
                      transition: 'border 0.2s'
                    }}
                  >
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>

        {/* Info */}
        <Col xs={24} md={13}>
          <div>
            {product.category && <Tag style={{ marginBottom: 12 }}>{product.category.name}</Tag>}
            {product.is_featured && <Tag color="gold" style={{ marginBottom: 12 }}>⭐ Tanlangan</Tag>}

            <Title level={2} style={{ margin: '0 0 12px', lineHeight: 1.3 }}>{product.title}</Title>

            {/* Rating */}
            {product.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Rate disabled value={product.rating} allowHalf style={{ fontSize: 16 }} />
                <Text style={{ color: '#8B4513', fontWeight: 600 }}>{Number(product.rating).toFixed(1)}</Text>
                <Text type="secondary">({product.review_count} sharh)</Text>
                <Text type="secondary">·</Text>
                <Text type="secondary"><ShoppingCartOutlined /> {product.view_count || 0} ko'rildi</Text>
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom: 20, padding: '16px 20px', background: '#faf8f5', borderRadius: 12 }}>
              {hasDiscount ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <Text style={{ fontSize: 32, fontWeight: 800, color: '#8B4513' }}>
                    {product.discount_price?.toLocaleString()} so'm
                  </Text>
                  <Text delete type="secondary" style={{ fontSize: 18 }}>{product.price?.toLocaleString()} so'm</Text>
                  <Tag color="red" style={{ fontSize: 13, fontWeight: 700 }}>-{discount}%</Tag>
                </div>
              ) : (
                <Text style={{ fontSize: 32, fontWeight: 800, color: '#8B4513' }}>
                  {product.price?.toLocaleString()} so'm
                </Text>
              )}
              <div style={{ marginTop: 8 }}>
                <Tag color={product.stock > 0 ? 'green' : 'red'}>
                  {product.stock > 0 ? `✓ Mavjud: ${product.stock} ta` : '✗ Tugagan'}
                </Tag>
                {product.material && <Tag>{product.material}</Tag>}
                {product.dimensions && <Tag>{product.dimensions}</Tag>}
              </div>
            </div>

            {/* Qty + Add to cart */}
            {product.stock > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <Text>Miqdor:</Text>
                  <InputNumber min={1} max={product.stock} value={qty} onChange={v => setQty(v || 1)} style={{ width: 90 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Jami: {((hasDiscount ? product.discount_price : product.price) * qty).toLocaleString()} so'm
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    type="primary" size="large" style={{ flex: 1, borderRadius: 10, height: 48 }}
                    icon={<ShoppingCartOutlined />} loading={cartLoading}
                    onClick={handleAddToCart}
                  >
                    {inCart ? 'Savatda bor' : 'Savatga qo\'shish'}
                  </Button>
                  <Button
                    size="large"
                    style={{ flex: 1, borderRadius: 10, height: 48, background: '#2c1810', color: 'white', border: 'none' }}
                    onClick={handleBuyNow}
                  >
                    Hozir sotib olish
                  </Button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <Button
                icon={wishlisted ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={handleWishlist}
              >
                {wishlisted ? 'Sevimlilardan o\'chirish' : 'Sevimlilarga qo\'shish'}
              </Button>
              <Button icon={<ShareAltOutlined />}>Ulashish</Button>
            </div>

            {/* Seller */}
            {seller && (
              <div
                style={{ border: '1px solid #e8e0d5', borderRadius: 12, padding: 16, cursor: 'pointer' }}
                onClick={() => navigate(`/shop/${seller.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar size={44} icon={<ShopOutlined />} src={seller.seller_profile?.shop_logo_url} style={{ background: '#8B4513' }} />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block' }}>{seller.seller_profile?.shop_name || seller.full_name}</Text>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {seller.seller_profile?.rating > 0 && (
                        <Text type="secondary" style={{ fontSize: 12 }}>⭐ {Number(seller.seller_profile.rating).toFixed(1)}</Text>
                      )}
                      {seller.seller_profile?.is_verified && <Tag color="green" style={{ fontSize: 10 }}>✓ Tasdiqlangan</Tag>}
                    </div>
                  </div>
                  <Button
                    size="small"
                    icon={<MessageOutlined />}
                    onClick={e => { e.stopPropagation(); navigate(`/shop/${seller.id}`) }}
                  >
                    Aloqa
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Tabs: description + reviews */}
      <div style={{ marginTop: 40 }}>
        <Tabs
          items={[
            {
              key: 'desc', label: 'Tavsif',
              children: (
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8e0d5' }}>
                  <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>
                    {product.description || 'Tavsif mavjud emas'}
                  </Paragraph>
                  {product.tags?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      {product.tags.map(t => <Tag key={t}>{t}</Tag>)}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'reviews', label: `Sharhlar (${reviews.length})`,
              children: (
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8e0d5' }}>
                  {reviews.length === 0 ? (
                    <Text type="secondary">Hali sharhlar yo'q</Text>
                  ) : (
                    reviews.map(r => (
                      <div key={r.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0ece8' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <Avatar icon={<span>{r.buyer?.full_name?.[0]}</span>} style={{ background: '#8B4513' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text strong style={{ fontSize: 14 }}>{r.buyer?.full_name}</Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(r.created_at).format('DD.MM.YYYY')}</Text>
                            </div>
                            <Rate disabled value={r.rating} style={{ fontSize: 12, marginBottom: 6 }} />
                            <Text style={{ fontSize: 13 }}>{r.comment}</Text>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <Title level={4} style={{ marginBottom: 20 }}>O'xshash mahsulotlar</Title>
          <Row gutter={[16, 16]}>
            {related.map(p => (
              <Col xs={12} sm={8} md={4} key={p.id}>
                <div
                  className="craft-card"
                  style={{ cursor: 'pointer', overflow: 'hidden' }}
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  <img
                    src={p.images?.[0] || 'https://placehold.co/200x200/f5f0e8/8B4513?text=P'}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '8px 10px' }}>
                    <Text style={{ fontSize: 12, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </Text>
                    <Text style={{ color: '#8B4513', fontSize: 13, fontWeight: 700 }}>
                      {p.price?.toLocaleString()} so'm
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  )
}