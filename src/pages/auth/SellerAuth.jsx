import { useState, useEffect } from 'react'
import { Form, Input, Button, Tabs, Typography, Divider, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, ShopOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const { Title, Text } = Typography

export default function SellerAuth() {
  const navigate = useNavigate()
  const { signInSeller, signUpSeller, profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  useEffect(() => {
    if (profile?.role === 'seller') navigate('/seller')
  }, [profile])

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      await signInSeller(values.email, values.password)
      message.success('Xush kelibsiz!')
      navigate('/seller')
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      await signUpSeller(values)
      message.success('Ariza qabul qilindi! Email tasdiqlang.')
      setActiveTab('login')
    } catch (err) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ background: 'linear-gradient(135deg, #1a0e08 0%, #3d2416 50%, #5c3520 100%)' }}>
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛍️</div>
          <Title level={2} style={{ color: '#8B4513', margin: 0 }}>Sotuvchi Paneli</Title>
          <Text type="secondary">CraftShop — O'z do'koningizni oching</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: 'Kirish',
              children: (
                <Form form={loginForm} layout="vertical" onFinish={handleLogin} style={{ marginTop: 16 }}>
                  <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} placeholder="Email" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Parol" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={loading}
                    style={{ borderRadius: 10, height: 48, fontSize: 16 }}>
                    Kirish
                  </Button>
                </Form>
              )
            },
            {
              key: 'register',
              label: 'Do\'kon ochish',
              children: (
                <Form form={registerForm} layout="vertical" onFinish={handleRegister} style={{ marginTop: 16 }}>
                  <Form.Item name="full_name" rules={[{ required: true }]}>
                    <Input prefix={<UserOutlined />} placeholder="To'liq ism" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="shop_name" rules={[{ required: true, message: 'Do\'kon nomi kiriting' }]}>
                    <Input prefix={<ShopOutlined />} placeholder="Do'kon nomi" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="shop_description">
                    <Input.TextArea placeholder="Do'kon haqida (ixtiyoriy)" rows={2} style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} placeholder="Email" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="Telefon" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6 }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Parol" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block size="large" loading={loading}
                    style={{ borderRadius: 10, height: 48, fontSize: 16 }}>
                    Do'kon ochish
                  </Button>
                  <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
                    Ariza ko'rib chiqilgandan so'ng tasdiqlash emaili yuboriladi
                  </Text>
                </Form>
              )
            }
          ]}
        />

        <Divider style={{ margin: '20px 0 16px' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>Xaridor sifatida? </Text>
          <Link to="/auth" style={{ color: '#8B4513', fontWeight: 600, fontSize: 13 }}>Xaridor kirishi</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/" style={{ color: '#999', fontSize: 12 }}>← Bosh sahifaga qaytish</Link>
        </div>
      </div>
    </div>
  )
}
