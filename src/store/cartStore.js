import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCartStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async (userId) => {
    if (!userId) return
    set({ loading: true })
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(id,title,price,discount_price,images,stock,seller_id,seller:profiles(full_name))')
      .eq('buyer_id', userId)
    set({ items: data || [], loading: false })
  },

  addToCart: async (userId, productId, quantity = 1) => {
    const { error } = await supabase
      .from('cart_items')
      .upsert({ buyer_id: userId, product_id: productId, quantity }, { onConflict: 'buyer_id,product_id' })
    if (error) throw error
    await get().fetchCart(userId)
  },

  updateQuantity: async (userId, productId, quantity) => {
    if (quantity <= 0) return get().removeFromCart(userId, productId)
    await supabase.from('cart_items').update({ quantity }).eq('buyer_id', userId).eq('product_id', productId)
    await get().fetchCart(userId)
  },

  removeFromCart: async (userId, productId) => {
    await supabase.from('cart_items').delete().eq('buyer_id', userId).eq('product_id', productId)
    set(state => ({ items: state.items.filter(i => i.product_id !== productId) }))
  },

  clearCart: async (userId) => {
    await supabase.from('cart_items').delete().eq('buyer_id', userId)
    set({ items: [] })
  },

  // ✅ getter o'rniga oddiy funksiya
  getTotal: () => {
    return get().items.reduce((sum, item) => {
      const price = item.product?.discount_price || item.product?.price || 0
      return sum + price * item.quantity
    }, 0)
  },

  getCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))