import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Button, Space, Typography } from 'antd'
import {
  DashboardOutlined, UserOutlined, ShopOutlined, ShoppingOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'

const { Sider, Header, Content } = Layout

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/admin/users', icon: <UserOutlined />, label: 'Foydalanuvchilar' },
  { key: '/admin/products', icon: <ShopOutlined />, label: 'Mahsulotlar' },
  { key: '/admin/orders', icon: <ShoppingOutlined />, label: 'Buyurtmalar' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuthStore()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible collapsed={collapsed} trigger={null} width={220}
        style={{ background: '#141414', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 200 }}
      >
        <div style={{ padding: '20px 16px', color: 'white', fontSize: 16, fontWeight: 700, borderBottom: '1px solid #333' }}>
          {collapsed ? '🏺' : '🏺 Admin Panel'}
        </div>
        <Menu
          theme="dark" mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none', marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin 0.2s' }}>
        <Header style={{ background: 'white', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <div style={{ flex: 1 }} />
          <Space>
            <Avatar icon={<UserOutlined />} style={{ background: '#8B4513' }} />
            <Typography.Text>{profile?.full_name || 'Admin'}</Typography.Text>
            <Button type="text" icon={<LogoutOutlined />} danger onClick={() => { signOut(); navigate('/') }} />
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
