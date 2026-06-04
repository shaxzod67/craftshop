import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Badge, Button, Avatar, Dropdown, Input, Space } from 'antd'
import {
  ShoppingCartOutlined, HeartOutlined, UserOutlined, SearchOutlined,
  LogoutOutlined, OrderedListOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const { Header, Content, Footer } = Layout

export default function BuyerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const { items } = useCartStore()
  const [search, setSearch] = useState('')

  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/products?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  const userMenu = profile ? [
    { key: 'profile', icon: <UserOutlined />, label: <Link to="/profile">Profil</Link> },
    { key: 'orders', icon: <OrderedListOutlined />, label: <Link to="/orders">Buyurtmalarim</Link> },
    { key: 'wishlist', icon: <HeartOutlined />, label: <Link to="/wishlist">Sevimlilar</Link> },
    { type: 'divider' },
    {
      key: 'logout', icon: <LogoutOutlined />, danger: true,
      label: 'Chiqish', onClick: () => { signOut(); navigate('/') }
    },
  ] : []

  return (
    <Layout style={{ minHeight: '100vh', background: '#faf8f5' }}>
      <Header style={{
        background: 'white',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
        boxShadow: '0 1px 8px rgba(139,69,19,0.08)',
        display: 'flex', alignItems: 'center', gap: 24, height: 64
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 26 }}>🏺</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#8B4513', letterSpacing: '-0.5px' }}>
            CraftShop
          </span>
        </Link>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 4, flex: 0 }}>
          <Button
            type={location.pathname === '/' ? 'primary' : 'text'}
            onClick={() => navigate('/')}
            style={{ borderRadius: 8 }}
          >
            Bosh sahifa
          </Button>
          <Button
            type={location.pathname.startsWith('/products') ? 'primary' : 'text'}
            onClick={() => navigate('/products')}
            style={{ borderRadius: 8 }}
          >
            Mahsulotlar
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Mahsulot qidirish..."
          prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          style={{ maxWidth: 400, borderRadius: 20, flex: 1 }}
        />

        {/* Actions */}
        <Space size={8} style={{ marginLeft: 'auto' }}>
          {profile ? (
            <>
              {/* ✅ Button o'rniga div — Badge click ni to'smoqda edi */}
              <div
                onClick={() => navigate('/cart')}
                style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center' }}
              >
                <Badge count={cartCount} size="small">
                  <ShoppingCartOutlined style={{ fontSize: 22, color: '#444' }} />
                </Badge>
              </div>

              <div
                onClick={() => navigate('/wishlist')}
                style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center' }}
              >
                <HeartOutlined style={{ fontSize: 22, color: '#444' }} />
              </div>

              <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
                <Avatar
                  src={profile.avatar_url}
                  icon={<UserOutlined />}
                  style={{ cursor: 'pointer', background: '#8B4513' }}
                />
              </Dropdown>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/auth')}>Kirish</Button>
              <Button type="primary" onClick={() => navigate('/auth?tab=register')}>Ro'yxatdan o'tish</Button>
            </>
          )}
        </Space>
      </Header>

      <Content style={{ flex: 1 }}>
        <Outlet />
      </Content>

      <Footer style={{
        background: '#2c1810', color: 'rgba(255,255,255,0.7)',
        padding: '40px 48px 24px', marginTop: 48
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🏺 CraftShop</div>
            <p style={{ fontSize: 13, lineHeight: 1.8 }}>
              O'zbek hunarmandlarining asarlarini dunyo bilan bog'laydigan platforma
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'white', marginBottom: 12 }}>Havolalar</div>
            {['Bosh sahifa', 'Mahsulotlar', 'Sotuvchilar'].map(item => (
              <div key={item} style={{ marginBottom: 8, fontSize: 13, cursor: 'pointer' }}>{item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'white', marginBottom: 12 }}>Aloqa</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              📧 info@craftshop.uz<br />
              📞 +998 71 123 45 67<br />
              📍 Toshkent, O'zbekiston
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}>
          © 2025 CraftShop. Barcha huquqlar himoyalangan.
        </div>
      </Footer>
    </Layout>
  )
}