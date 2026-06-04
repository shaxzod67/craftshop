import { useState, useEffect } from 'react'
import { Form, Input, Button, Tabs, Typography, Divider, message, Space } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const { Title, Text } = Typography

export default function BuyerAuth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signInBuyer, signUpBuyer, profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  useEffect(() => {
    if (profile?.role === 'buyer') navigate('/')
  }, [profile])

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      await signInBuyer(values.email, values.password)
      message.success('Xush kelibsiz!')
      navigate('/')
    } catch (err) {
      message.error(err.message || 'Kirish xatoligi')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      await signUpBuyer(values)
      message.success('Ro\'yxatdan o\'tdingiz! Email tasdiqlang.')
      setActiveTab('login')
    } catch (err) {
      message.error(err.message || 'Ro\'yxat xatoligi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏺</div>
          <Title level={2} style={{ color: '#8B4513', margin: 0, letterSpacing: '-1px' }}>CraftShop</Title>
          <Text type="secondary">Hunarmandchilik bozori</Text>
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
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email kiriting' }]}>
                    <Input prefix={<MailOutlined />} placeholder="Email" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: 'Parol kiriting' }]}>
                    <Input.Password
                      prefix={<LockOutlined />} placeholder="Parol" size="large"
                      iconRender={v => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                      style={{ borderRadius: 10 }}
                    />
                  </Form.Item>
                  <Button
                    type="primary" htmlType="submit" block size="large"
                    loading={loading} style={{ borderRadius: 10, height: 48, fontSize: 16, marginTop: 8 }}
                  >
                    Kirish
                  </Button>
                </Form>
              )
            },
            {
              key: 'register',
              label: 'Ro\'yxat',
              children: (
                <Form form={registerForm} layout="vertical" onFinish={handleRegister} style={{ marginTop: 16 }}>
                  <Form.Item name="full_name" rules={[{ required: true, message: 'Ism kiriting' }]}>
                    <Input prefix={<UserOutlined />} placeholder="To'liq ism" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email kiriting' }]}>
                    <Input prefix={<MailOutlined />} placeholder="Email" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="Telefon (ixtiyoriy)" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Kamida 6 belgi' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="Parol" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Form.Item
                    name="confirm_password"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Parolni tasdiqlang' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) return Promise.resolve()
                          return Promise.reject('Parollar mos emas')
                        }
                      })
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Parolni tasdiqlang" size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                  <Button
                    type="primary" htmlType="submit" block size="large"
                    loading={loading} style={{ borderRadius: 10, height: 48, fontSize: 16 }}
                  >
                    Ro'yxatdan o'tish
                  </Button>
                </Form>
              )
            }
          ]}
        />

        <Divider style={{ margin: '20px 0 16px' }} />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>Sotuvchi sifatida? </Text>
          <Link to="/seller/auth" style={{ color: '#8B4513', fontWeight: 600, fontSize: 13 }}>
            Sotuvchi paneli
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/" style={{ color: '#999', fontSize: 12 }}>← Bosh sahifaga qaytish</Link>
        </div>
      </div>
    </div>
  )
}
