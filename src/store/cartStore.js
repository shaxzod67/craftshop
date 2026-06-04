import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCartStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async (userId) => {
    if (!userId) return
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, quantity, product_id, buyer_id')
        .eq('buyer_id', userId)

      if (error) { console.error('fetchCart select xato:', error); set({ loading: false }); return }

      if (!data || data.length === 0) { set({ items: [], loading: false }); return }

      // Productlarni alohida olamiz
      const productIds = data.map(i => i.product_id)
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('id, title, price, discount_price, images, stock, seller_id')
        .in('id', productIds)

      if (pError) console.error('products xato:', pError)

      const merged = data.map(item => ({
        ...item,
        product: (products || []).find(p => p.id === item.product_id) || null
      }))

      set({ items: merged, loading: false })
    } catch (e) {
      console.error('fetchCart umumiy xato:', e)
      set({ loading: false })
    }
  },

  addToCart: async (userId, productId, quantity = 1) => {
    if (!userId || !productId) throw new Error('userId yoki productId yo\'q')
    try {
      // Mavjudligini tekshiramiz
      const { data: existing, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('buyer_id', userId)
        .eq('product_id', productId)
        .maybeSingle()

      if (checkError) throw checkError

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert([{ buyer_id: userId, product_id: productId, quantity }])
        if (error) throw error
      }

      await get().fetchCart(userId)
    } catch (e) {
      console.error('addToCart xato:', e)
      throw e
    }
  },

  updateQuantity: async (userId, productId, quantity) => {
    if (quantity <= 0) return get().removeFromCart(userId, productId)
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('buyer_id', userId)
        .eq('product_id', productId)
      if (error) throw error
      set(state => ({
        items: state.items.map(i => i.product_id === productId ? { ...i, quantity } : i)
      }))
    } catch (e) { console.error('updateQuantity xato:', e) }
  },

  removeFromCart: async (userId, productId) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('buyer_id', userId)
        .eq('product_id', productId)
      if (error) throw error
      set(state => ({ items: state.items.filter(i => i.product_id !== productId) }))
    } catch (e) { console.error('removeFromCart xato:', e) }
  },

  clearCart: async (userId) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('buyer_id', userId)
      if (error) throw error
      set({ items: [] })
    } catch (e) { console.error('clearCart xato:', e) }
  },

  getTotal: () => get().items.reduce((sum, item) => {
    const price = item.product?.discount_price || item.product?.price || 0
    return sum + price * item.quantity
  }, 0),

  getCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}))