import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export async function uploadImage(file, bucket = 'products') {
  console.log('uploadImage boshlandi:', file.name, bucket)

  // Fayl turini tekshirish
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Faqat JPG, PNG, WebP rasm yuklash mumkin')
  }

  // Fayl nomini yaratish
  const ext = file.name.split('.').pop().toLowerCase()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  console.log('Fayl nomi:', fileName)

  // Yuklab olish
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  console.log('Upload natija:', data, error)

  if (error) {
    console.error('Upload xato:', error)
    throw new Error(error.message || 'Rasm yuklashda xatolik')
  }

  // Public URL olish
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  console.log('Public URL:', urlData.publicUrl)
  return urlData.publicUrl
}