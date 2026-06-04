import { useState, useEffect } from 'react'
import { Row, Col, Select, Slider, Input, Typography, Spin, Empty, Pagination, Tag, Rate, Button } from 'antd'
import { SearchOutlined, FilterOutlined, ShoppingCartOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { message } from 'antd'

const { Title, Text } = Typography

function ProductCard({ product }) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { addToCart, items } = useCartStore()
  const [wishlisted, setWishlisted] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const inCart = items.some(i => i.product_id === product.id)
  const hasDiscount = product.discount_price && product.discount_price < product.price
  const img = product.images?.[0] || 'https://placehold.co/280x280/f5f0e8/8B4513?text=🏺'

  const handleAddToCart = async (e) => {
    e.stopPropagation()
    if (!profile) { navigate('/auth'); return }
    setCartLoading(true)
    try {
      await addToCart(profile.id, product.id)
      message.success('Savatga qo\'shildi!')
    } catch { message.error('Xatolik') }
    finally { setCartLoading(false) }
  }

  const handleWishlist = async (e) => {
    e.stopPropagation()
    if (!profile) { navigate('/auth'); return }
    setWishlisted(!wishlisted)
    if (!wishlisted) {
      await supabase.from('wishlists').upsert({ buyer_id: profile.id, product_id: product.id })
    } else {
      await supabase.from('wishlists').delete().eq('buyer_id', profile.id).eq('product_id', product.id)
    }
  }

  return (
    <div className="craft-card" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
      onClick={() => navigate(`/products/${product.id}`)}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={img} alt={product.title} className="product-card-img"
          onError={e => { e.target.src = 'https://placehold.co/280x280/f5f0e8/8B4513?text=🏺' }}
        />
        {hasDiscount && (
          <Tag color="red" style={{ position: 'absolute', top: 8, left: 8, fontWeight: 700 }}>
            -{Math.round((1 - product.discount_price / product.price) * 100)}%
          </Tag>
        )}
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag color="red">Tugadi</Tag>
          </div>
        )}
        <button className={`wishlist-btn ${wishlisted ? 'active' : ''}`} onClick={handleWishlist}>
          {wishlisted ? <HeartFilled style={{ color: '#ff4d4f', fontSize: 14 }} /> : <HeartOutlined style={{ fontSize: 14 }} />}
        </button>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <Text style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.title}
        </Text>
        {product.category_name && <Tag style={{ fontSize: 10, marginBottom: 6 }}>{product.category_name}</Tag>}
        {product.rating > 0 && (
          <div style={{ marginBottom: 6 }}>
            <Rate disabled defaultValue={product.rating} allowHalf style={{ fontSize: 10 }} />
            <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>({product.review_count})</Text>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            {hasDiscount ? (
              <div>
                <Text strong style={{ color: '#8B4513', fontSize: 15 }}>{product.discount_price?.toLocaleString()} so'm</Text>
                <Text delete type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{product.price?.toLocaleString()}</Text>
              </div>
            ) : (
              <Text strong style={{ color: '#8B4513', fontSize: 15 }}>{product.price?.toLocaleString()} so'm</Text>
            )}
          </div>
          <Button
            type={inCart ? 'default' : 'primary'} shape="circle"
            icon={<ShoppingCartOutlined />} size="small"
            loading={cartLoading} onClick={handleAddToCart}
            disabled={product.stock === 0}
          />
        </div>
      </div>
    </div>
  )
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const search = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const sortBy = searchParams.get('sort') || 'newest'
  const [priceRange, setPriceRange] = useState([0, 5000000])
  const PAGE_SIZE = 20

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
    setPage(1)
  }, [searchParams, priceRange])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, category:categories(name)', { count: 'exact' })
      .eq('is_active', true)
      .gte('price', priceRange[0])
      .lte('price', priceRange[1])

    if (search) query = query.ilike('title', `%${search}%`)
    if (category) query = query.eq('category_id', category)
    if (searchParams.get('featured') === 'true') query = query.eq('is_featured', true)

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
    else if (sortBy === 'price_asc') query = query.order('price', { ascending: true })
    else if (sortBy === 'price_desc') query = query.order('price', { ascending: false })
    else if (sortBy === 'rating') query = query.order('rating', { ascending: false })
    else if (sortBy === 'popular') query = query.order('view_count', { ascending: false })

    query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    const { data, count } = await query
    // Flatten category name
    setProducts((data || []).map(p => ({ ...p, category_name: p.category?.name })))
    setTotal(count || 0)
    setLoading(false)
  }

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    setSearchParams(p)
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <Title level={3} style={{ margin: 0 }}>Mahsulotlar</Title>
        <Text type="secondary" style={{ fontSize: 14 }}>({total} ta topildi)</Text>
      </div>

      <Row gutter={24}>
        {/* Sidebar filters */}
        <Col xs={24} md={5}>
          <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e8e0d5', marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}><FilterOutlined /> Filtrlar</Text>

            <Input
              placeholder="Qidirish..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={e => updateParam('q', e.target.value)}
              style={{ marginBottom: 16, borderRadius: 8 }}
              allowClear
            />

            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Kategoriya</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              <button
                className={`category-tag ${!category ? 'active' : ''}`}
                onClick={() => updateParam('category', '')}
                style={{ justifyContent: 'flex-start' }}
              >
                Barchasi
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-tag ${category === cat.id ? 'active' : ''}`}
                  onClick={() => updateParam('category', cat.id)}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Narx diapazoni</Text>
            <Slider
              range min={0} max={5000000} step={50000}
              value={priceRange} onChange={setPriceRange}
              tooltip={{ formatter: v => `${v.toLocaleString()} so'm` }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginTop: 4 }}>
              <span>{priceRange[0].toLocaleString()}</span>
              <span>{priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </Col>

        {/* Products grid */}
        <Col xs={24} md={19}>
          {/* Sort bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Select
              value={sortBy}
              onChange={v => updateParam('sort', v)}
              style={{ width: 200 }}
              options={[
                { value: 'newest', label: 'Eng yangi' },
                { value: 'price_asc', label: 'Narx: pastdan' },
                { value: 'price_desc', label: 'Narx: balanddan' },
                { value: 'rating', label: 'Reyting bo\'yicha' },
                { value: 'popular', label: 'Mashhurlar' },
              ]}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
          ) : products.length === 0 ? (
            <Empty description="Mahsulotlar topilmadi" />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {products.map(p => (
                  <Col xs={12} sm={8} lg={6} key={p.id}>
                    <ProductCard product={p} />
                  </Col>
                ))}
              </Row>
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <Pagination
                  current={page} total={total} pageSize={PAGE_SIZE}
                  onChange={p => { setPage(p); window.scrollTo(0, 0) }}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </Col>
      </Row>
    </div>
  )
}
