import { useState } from 'react'
import { Form, Input, Button, Upload, Avatar, Typography, Tabs, Row, Col, message, Divider } from 'antd'
import { UserOutlined, ShopOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'
import { uploadImage } from '../../lib/supabase'

const { Title, Text } = Typography

export default function SellerProfile() {
  const { profile, sellerProfile, updateProfile, updateSellerProfile } = useAuthStore()
  const [profileForm] = Form.useForm()
  const [shopForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const handleProfileSave = async (values) => {
    setLoading(true)
    try {
      await updateProfile(values)
      message.success('Profil yangilandi!')
    } catch (e) { message.error(e.message) }
    finally { setLoading(false) }
  }

  const handleShopSave = async (values) => {
    setLoading(true)
    try {
      await updateSellerProfile(values)
      message.success('Do\'kon ma\'lumotlari yangilandi!')
    } catch (e) { message.error(e.message) }
    finally { setLoading(false) }
  }

  const handleAvatarUpload = async ({ file }) => {
    setAvatarUploading(true)
    try {
      const url = await uploadImage(file, 'avatars')
      await updateProfile({ avatar_url: url })
      message.success('Rasm yangilandi')
    } catch { message.error('Xatolik') }
    finally { setAvatarUploading(false) }
    return false
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>Profil sozlamalari</Title>

      <Tabs
        items={[
          {
            key: 'profile',
            label: <span><UserOutlined /> Shaxsiy</span>,
            children: (
              <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8e0d5' }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      size={80}
                      src={profile?.avatar_url}
                      icon={<UserOutlined />}
                      style={{ background: '#8B4513' }}
                    />
                    <Upload beforeUpload={handleAvatarUpload} showUploadList={false} accept="image/*">
                      <button style={{
                        position: 'absolute', bottom: 0, right: 0,
                        background: '#8B4513', border: 'none', borderRadius: '50%',
                        width: 24, height: 24, cursor: 'pointer', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
                      }}>
                        <CameraOutlined />
                      </button>
                    </Upload>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{profile?.full_name}</Text>
                    <div><Text type="secondary" style={{ fontSize: 13 }}>Sotuvchi</Text></div>
                  </div>
                </div>

                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={profile || {}}
                  onFinish={handleProfileSave}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="full_name" label="To'liq ism" rules={[{ required: true }]}>
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="phone" label="Telefon">
                        <Input size="large" placeholder="+998 90 123 45 67" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="address" label="Manzil">
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="city" label="Shahar">
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="bio" label="O'zingiz haqida">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} style={{ borderRadius: 10 }}>
                    Saqlash
                  </Button>
                </Form>
              </div>
            )
          },
          {
            key: 'shop',
            label: <span><ShopOutlined /> Do'kon</span>,
            children: (
              <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e8e0d5' }}>
                <Form
                  form={shopForm}
                  layout="vertical"
                  initialValues={sellerProfile || {}}
                  onFinish={handleShopSave}
                >
                  <Form.Item name="shop_name" label="Do'kon nomi" rules={[{ required: true }]}>
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="shop_description" label="Do'kon tavsifi">
                    <Input.TextArea rows={4} />
                  </Form.Item>
                  <Form.Item name="bank_account" label="Bank hisob raqami">
                    <Input placeholder="Hisobga to'lovlar kelib tushadi" />
                  </Form.Item>

                  {sellerProfile && (
                    <div style={{ background: '#faf8f5', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                      <Row gutter={16}>
                        <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>Reyting</Text>
                          <div style={{ fontWeight: 700, color: '#8B4513' }}>⭐ {Number(sellerProfile.rating || 0).toFixed(1)}</div>
                        </Col>
                        <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>Jami sotuv</Text>
                          <div style={{ fontWeight: 700, color: '#8B4513' }}>{sellerProfile.total_sales || 0}</div>
                        </Col>
                        <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>Holat</Text>
                          <div style={{ fontWeight: 700, color: sellerProfile.is_verified ? '#52c41a' : '#faad14' }}>
                            {sellerProfile.is_verified ? '✅ Tasdiqlangan' : '⏳ Kutilmoqda'}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} style={{ borderRadius: 10 }}>
                    Do'konni yangilash
                  </Button>
                </Form>
              </div>
            )
          }
        ]}
      />
    </div>
  )
}
