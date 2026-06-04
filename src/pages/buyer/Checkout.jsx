import { useState } from 'react'
import { Form, Input, Select, Button, Typography, Steps, Radio, Divider, message, Result } from 'antd'
import { CheckCircleOutlined, HomeOutlined, CreditCardOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

const { Title, Text } = Typography

const REGIONS = [
  'Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg\'ona',
  'Qashqadaryo', 'Surxondaryo', 'Xorazm', 'Navoiy', 'Jizzax', 'Sirdaryo', 'Qoraqalpog\'iston'
]

export default function Checkout() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { items, clearCart } = useCartStore()
  const [step, setStep] = useState(0)
  const [addressForm] = Form.useForm()
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const subtotal = items.reduce((s, i) => s + (i.product?.discount_price || i.product?.price || 0) * i.quantity, 0)
  const shipping = 25000
  const total = subtotal + shipping

  const handleSubmit = async () => {
    try {
      await addressForm.validateFields()
    } catch { return }
    setLoading(true)
    try {
      const addr = addressForm.getFieldsValue()
      // Create order
      const { data: order, error } = await supabase.from('orders').insert({
        buyer_id: profile.id,
        total_amount: total,
        shipping_address: addr,
        payment_method: paymentMethod,
        status: 'pending',
        payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
      }).select().single()
      if (error) throw error

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        seller_id: item.product?.seller_id,
        quantity: item.quantity,
        unit_price: item.product?.discount_price || item.product?.price,
        total_price: (item.product?.discount_price || item.product?.price) * item.quantity,
        status: 'pending',
      }))
      await supabase.from('order_items').insert(orderItems)
      await clearCart(profile.id)
      setOrderId(order.id)
      setDone(true)
    } catch (e) {
      message.error(e.message || 'Buyurtma berishda xatolik')
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: '0 24px' }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Buyurtmangiz qabul qilindi! 🎉"
          subTitle={`Buyurtma raqami: #${orderId?.slice(0, 8).toUpperCase()}`}
          extra={[
            <Button type="primary" key="orders" onClick={() => navigate('/orders')} style={{ borderRadius: 10 }}>
              Buyurtmalarimni ko'rish
            </Button>,
            <Button key="home" onClick={() => navigate('/')} style={{ borderRadius: 10 }}>
              Bosh sahifaga qaytish
            </Button>,
          ]}
        />
      </div>
    )
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>Buyurtma rasmiylashitirish</Title>

      <Steps
        current={step}
        style={{ marginBottom: 32 }}
        items={[
          { title: 'Manzil', icon: <HomeOutlined /> },
          { title: 'To\'lov', icon: <CreditCardOutlined /> },
          { title: 'Tasdiqlash', icon: <ShoppingOutlined /> },
        ]}
      />

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Main form */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {step === 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24 }}>
              <Title level={4} style={{ marginBottom: 20 }}>Yetkazib berish manzili</Title>
              <Form form={addressForm} layout="vertical">
                <Form.Item name="full_name" label="To'liq ism" initialValue={profile?.full_name} rules={[{ required: true }]}>
                  <Input size="large" />
                </Form.Item>
                <Form.Item name="phone" label="Telefon" initialValue={profile?.phone} rules={[{ required: true, message: 'Telefon raqam kiriting' }]}>
                  <Input size="large" placeholder="+998 90 123 45 67" />
                </Form.Item>
                <Form.Item name="city" label="Shahar/Viloyat" rules={[{ required: true }]}>
                  <Select size="large" options={REGIONS.map(r => ({ value: r, label: r }))} placeholder="Tanlang" />
                </Form.Item>
                <Form.Item name="address" label="Ko'cha, uy raqami" rules={[{ required: true, message: 'Manzil kiriting' }]}>
                  <Input size="large" placeholder="Ko'cha nomi, uy/kvartira raqami" />
                </Form.Item>
                <Form.Item name="notes" label="Izoh (ixtiyoriy)">
                  <Input.TextArea rows={2} placeholder="Yetkazib beruvchiga qo'shimcha ma'lumot..." />
                </Form.Item>
              </Form>
              <Button type="primary" block size="large" style={{ borderRadius: 10, height: 48 }} onClick={() => setStep(1)}>
                Davom etish →
              </Button>
            </div>
          )}

          {step === 1 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24 }}>
              <Title level={4} style={{ marginBottom: 20 }}>To'lov usuli</Title>
              <Radio.Group value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { value: 'cash', label: 'Naqd pul', desc: 'Yetkazib berganda to\'lang', icon: '💵' },
                    { value: 'card', label: 'Bank kartasi', desc: 'Payme / Click / Uzcard', icon: '💳' },
                    { value: 'transfer', label: 'Bank o\'tkazmasi', desc: 'Hisobdan hisob', icon: '🏦' },
                  ].map(pm => (
                    <Radio.Button
                      key={pm.value} value={pm.value}
                      style={{
                        height: 'auto', padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12,
                        borderColor: paymentMethod === pm.value ? '#8B4513' : '#e8e0d5',
                        background: paymentMethod === pm.value ? '#faf3ee' : 'white',
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{pm.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{pm.label}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{pm.desc}</div>
                      </div>
                    </Radio.Button>
                  ))}
                </div>
              </Radio.Group>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Button size="large" style={{ borderRadius: 10 }} onClick={() => setStep(0)}>← Orqaga</Button>
                <Button type="primary" size="large" style={{ flex: 1, borderRadius: 10, height: 48 }} onClick={() => setStep(2)}>
                  Davom etish →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', padding: 24 }}>
              <Title level={4} style={{ marginBottom: 20 }}>Buyurtmani tasdiqlash</Title>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: 12, background: '#faf8f5', borderRadius: 10 }}>
                  <img
                    src={item.product?.images?.[0] || 'https://placehold.co/48/f5f0e8/8B4513?text=P'}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: 600 }}>{item.product?.title}</Text>
                    <div><Text type="secondary" style={{ fontSize: 12 }}>{item.quantity} × {(item.product?.discount_price || item.product?.price)?.toLocaleString()} so'm</Text></div>
                  </div>
                  <Text strong style={{ color: '#8B4513' }}>
                    {((item.product?.discount_price || item.product?.price) * item.quantity).toLocaleString()} so'm
                  </Text>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <Button size="large" style={{ borderRadius: 10 }} onClick={() => setStep(1)}>← Orqaga</Button>
                <Button
                  type="primary" size="large" style={{ flex: 1, borderRadius: 10, height: 48, background: '#52c41a', borderColor: '#52c41a' }}
                  loading={loading}
                  onClick={handleSubmit}
                >
                  ✓ Buyurtma berish
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', padding: 20, position: 'sticky', top: 80 }}>
            <Title level={5} style={{ marginBottom: 16 }}>Buyurtma xulosasi</Title>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">Mahsulotlar</Text>
              <Text>{subtotal.toLocaleString()} so'm</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">Yetkazib berish</Text>
              <Text>{shipping.toLocaleString()} so'm</Text>
            </div>
            <Divider style={{ margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 15 }}>Jami</Text>
              <Text strong style={{ fontSize: 17, color: '#8B4513' }}>{total.toLocaleString()} so'm</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
