// BuyerProfile.jsx
import { useState } from 'react'
import { Form, Input, Button, Avatar, Typography, message, Upload } from 'antd'
import { UserOutlined, SaveOutlined, CameraOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'
import { uploadImage } from '../../lib/supabase'

const { Title } = Typography

export function BuyerProfile() {
  const { profile, updateProfile } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSave = async (values) => {
    setLoading(true)
    try {
      await updateProfile(values)
      message.success('Profil yangilandi!')
    } catch (e) { message.error(e.message) }
    finally { setLoading(false) }
  }

  const handleAvatarUpload = async ({ file }) => {
    try {
      const url = await uploadImage(file, 'avatars')
      await updateProfile({ avatar_url: url })
      message.success('Rasm yangilandi')
    } catch { message.error('Xatolik') }
    return false
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
      <Title level={2} style={{ marginBottom: 32 }}>Mening profilim</Title>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #e8e0d5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <Avatar size={72} src={profile?.avatar_url} icon={<UserOutlined />} style={{ background: '#8B4513' }} />
            <Upload beforeUpload={handleAvatarUpload} showUploadList={false} accept="image/*">
              <button style={{
                position: 'absolute', bottom: 0, right: 0, background: '#8B4513',
                border: 'none', borderRadius: '50%', width: 22, height: 22,
                cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
              }}>
                <CameraOutlined />
              </button>
            </Upload>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{profile?.full_name}</div>
            <div style={{ color: '#999', fontSize: 13 }}>Xaridor</div>
          </div>
        </div>
        <Form form={form} layout="vertical" initialValues={profile || {}} onFinish={handleSave}>
          <Form.Item name="full_name" label="To'liq ism" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="phone" label="Telefon">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="address" label="Manzil">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="city" label="Shahar">
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} style={{ borderRadius: 10 }}>
            Saqlash
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default BuyerProfile
