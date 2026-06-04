import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Switch, Button, Upload, Typography, Row, Col, Card, Tag, Divider, message, Space, Spin } from 'antd'
import { UploadOutlined, PlusOutlined, MinusCircleOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, uploadImage } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const { Title, Text } = Typography
const { TextArea } = Input

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [categories, setCategories] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [uploadingImg, setUploadingImg] = useState(false)

  useEffect(() => {
    fetchCategories()
    if (isEdit) fetchProduct()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).eq('seller_id', profile?.id).single()
    if (!data) { navigate('/seller/products'); return }
    form.setFieldsValue({
      ...data,
      tags: data.tags || [],
    })
    setImageUrls(data.images || [])
    setFetchLoading(false)
  }

  const handleImageUpload = async (file) => {
    console.log('Fayl keldi:', file)

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      message.error('Faqat JPG, PNG, WebP rasm yuklash mumkin')
      return false
    }
    if (imageUrls.length >= 5) {
      message.warning('Maksimum 5 ta rasm yuklanadi')
      return false
    }

    setUploadingImg(true)
    try {
      console.log('Yuklash boshlanmoqda...')
      const url = await uploadImage(file, 'products')
      console.log('Yuklandi! URL:', url)
      setImageUrls(prev => [...prev, url])
      message.success('Rasm muvaffaqiyatli yuklandi!')
    } catch (e) {
      console.error('Yuklash xatosi:', e)
      message.error(e.message || 'Rasm yuklashda xatolik yuz berdi')
    } finally {
      setUploadingImg(false)
    }
    return false  // Ant Design ning avtomatik yuklanishini to'xtatamiz
  }

  const handleSubmit = async (values) => {
    if (imageUrls.length === 0) { message.warning('Kamida 1 ta rasm qo\'shing'); return }
    setLoading(true)
    try {
      const payload = {
        ...values,
        images: imageUrls,
        seller_id: profile.id,
        tags: values.tags || [],
      }
      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
        message.success('Mahsulot yangilandi!')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        message.success('Mahsulot qo\'shildi!')
      }
      navigate('/seller/products')
    } catch (e) {
      message.error(e.message || 'Xatolik yuz berdi')
    } finally { setLoading(false) }
  }

  if (fetchLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/seller/products')} />
        <Title level={3} style={{ margin: 0 }}>
          {isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
        </Title>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}
        initialValues={{ is_active: true, is_featured: false, stock: 1 }}>
        <Row gutter={24}>
          {/* Left column */}
          <Col xs={24} lg={14}>
            <Card title="Asosiy ma'lumotlar" style={{ borderRadius: 12, marginBottom: 16 }}>
              <Form.Item name="title" label="Mahsulot nomi" rules={[{ required: true, message: 'Nom kiriting' }]}>
                <Input placeholder="Masalan: Qo'lda ishlangan keramika kosa" size="large" />
              </Form.Item>

              <Form.Item name="description" label="Tavsif">
                <TextArea
                  rows={4}
                  placeholder="Mahsulot haqida batafsil ma'lumot yozing — material, o'lcham, qo'llanish..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="price" label="Narx (so'm)" rules={[{ required: true, message: 'Narx kiriting' }]}>
                    <InputNumber
                      style={{ width: '100%' }} min={0} step={1000}
                      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => v.replace(/,/g, '')}
                      placeholder="150,000"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="discount_price" label="Chegirma narx (ixtiyoriy)">
                    <InputNumber
                      style={{ width: '100%' }} min={0} step={1000}
                      formatter={v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                      parser={v => v.replace(/,/g, '')}
                      placeholder="120,000"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="stock" label="Stok miqdori" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="weight" label="Og'irlik (kg)">
                    <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="dimensions" label="O'lcham">
                    <Input placeholder="20x15x10 sm" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="material" label="Material">
                <Input placeholder="Masalan: Sopol, gilam, temir, charm..." />
              </Form.Item>
            </Card>

            <Card title="Kategoriya va teglar" style={{ borderRadius: 12, marginBottom: 16 }}>
              <Form.Item name="category_id" label="Kategoriya">
                <Select
                  placeholder="Kategoriya tanlang"
                  options={categories.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item name="tags" label="Teglar (kalit so'zlar)">
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Teg kiriting va Enter bosing"
                  tokenSeparators={[',']}
                />
              </Form.Item>
            </Card>
          </Col>

          {/* Right column */}
          <Col xs={24} lg={10}>
            <Card title="Rasmlar (maks 5 ta)" style={{ borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {imageUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    <button
                      onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        border: 'none', borderRadius: '50%', width: 20, height: 20,
                        cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >✕</button>
                    {i === 0 && (
                      <Tag color="blue" style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10 }}>Asosiy</Tag>
                    )}
                  </div>
                ))}
                {imageUrls.length < 5 && (
                  <Upload customRequest={({ file }) => handleImageUpload(file)} showUploadList={false} accept="image/jpeg,image/png,image/webp" multiple={false}>
                    <div style={{
                      aspectRatio: '1', border: '2px dashed #e8e0d5', borderRadius: 8,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#999', fontSize: 12,
                      background: uploadingImg ? '#f9f6f2' : 'white'
                    }}>
                      {uploadingImg ? <Spin size="small" /> : <><PlusOutlined style={{ fontSize: 20, marginBottom: 4 }} /><span>Rasm qo'sh</span></>}
                    </div>
                  </Upload>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Birinchi rasm asosiy sifatida ko'rsatiladi. JPG, PNG, WebP qo'llab-quvvatlanadi.
              </Text>
            </Card>

            <Card title="Sozlamalar" style={{ borderRadius: 12, marginBottom: 16 }}>
              <Form.Item name="is_active" label="Mahsulot holati" valuePropName="checked">
                <Switch checkedChildren="Faol — ko'rinadi" unCheckedChildren="Yopiq — ko'rinmaydi" />
              </Form.Item>
              <Form.Item name="is_featured" label="Featured (tavsiya etilgan)" valuePropName="checked">
                <Switch checkedChildren="Ha" unCheckedChildren="Yo'q" />
              </Form.Item>
            </Card>

            <Button
              type="primary" htmlType="submit"
              block size="large"
              loading={loading}
              icon={<SaveOutlined />}
              style={{ borderRadius: 10, height: 50, fontSize: 16 }}
            >
              {isEdit ? 'Saqlash' : 'Mahsulot qo\'shish'}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  )
}