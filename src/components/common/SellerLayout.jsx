import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Badge, Dropdown, Space, Typography, Button } from 'antd'
import {
  DashboardOutlined, ShopOutlined, ShoppingOutlined, BarChartOutlined,
  MessageOutlined, UserOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, BellOutlined, HomeOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/seller', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/seller/products', icon: <ShopOutlined />, label: 'Mahsulotlar' },
  { key: '/seller/orders', icon: <ShoppingOutlined />, label: 'Buyurtmalar' },
  { key: '/seller/analytics', icon: <BarChartOutlined />, label: 'Tahlil' },
  { key: '/seller/messages', icon: <MessageOutlined />, label: 'Xabarlar' },
  { key: '/seller/profile', icon: <UserOutlined />, label: 'Profil' },
]

export default function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, sellerProfile, signOut } = useAuthStore()

  const userMenu = [
    { key: 'home', icon: <HomeOutlined />, label: 'Saytga qaytish', onClick: () => navigate('/') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Chiqish', danger: true, onClick: () => { signOut(); navigate('/') } },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: 'linear-gradient(180deg, #1a0e08 0%, #2c1810 50%, #3d2416 100%)',
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          zIndex: 200,
          overflow: 'auto'
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          cursor: 'pointer'
        }} onClick={() => navigate('/seller')}>
          <span style={{ fontSize: 24 }}>🏺</span>
          {!collapsed && (
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>CraftShop</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 }}>Sotuvchi Panel</div>
            </div>
          )}
        </div>

        {/* Seller info */}
        {!collapsed && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Space>
              <Avatar icon={<UserOutlined />} style={{ background: '#8B4513' }} src={profile?.avatar_url} />
              <div>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sellerProfile?.shop_name || 'Do\'konim'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  {profile?.full_name}
                </div>
              </div>
            </Space>
          </div>
        )}

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/seller' ? '/seller' : Object.keys(Object.fromEntries(menuItems.map(m => [m.key, m]))).find(k => k !== '/seller' && location.pathname.startsWith(k)) || location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            marginTop: 8,
            border: 'none',
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin 0.2s' }}>
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex', alignItems: 'center',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          position: 'sticky', top: 0, zIndex: 100,
          gap: 16
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18 }}
          />

          <div style={{ flex: 1 }} />

          <Space size={8}>
            <Button type="text" shape="circle" icon={<Badge count={3} size="small"><BellOutlined style={{ fontSize: 18 }} /></Badge>} />
            <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ background: '#8B4513' }} src={profile?.avatar_url} size="small" />
                <Text style={{ fontSize: 13 }}>{profile?.full_name}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24, background: '#faf8f5', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
