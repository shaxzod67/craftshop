import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  sellerProfile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await get().fetchProfile(session.user)
    }
    set({ loading: false, initialized: true })

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await get().fetchProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, sellerProfile: null })
      }
    })
  },

  fetchProfile: async (user) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let sellerProfile = null
    if (profile?.role === 'seller') {
      const { data } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      sellerProfile = data
    }

    set({ user, profile, sellerProfile })
  },

  signInBuyer: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (profile?.role !== 'buyer') {
      await supabase.auth.signOut()
      throw new Error('Bu akkaunt xaridor uchun emas')
    }
    return data
  },

  signUpBuyer: async ({ email, password, full_name, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role: 'buyer', full_name } }
    })
    if (error) throw error
    if (phone && data.user) {
      await supabase.from('profiles').update({ phone }).eq('id', data.user.id)
    }
    return data
  },

  signInSeller: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (profile?.role !== 'seller') {
      await supabase.auth.signOut()
      throw new Error('Bu akkaunt sotuvchi uchun emas')
    }
    return data
  },

  signUpSeller: async ({ email, password, full_name, phone, shop_name, shop_description }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { role: 'seller', full_name } }
    })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').update({ phone }).eq('id', data.user.id)
      await supabase.from('seller_profiles').insert({
        id: data.user.id, shop_name, shop_description
      })
    }
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, sellerProfile: null })
  },

  updateProfile: async (updates) => {
    const { user } = get()
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (error) throw error
    set({ profile: data })
    return data
  },

  updateSellerProfile: async (updates) => {
    const { user } = get()
    const { data, error } = await supabase.from('seller_profiles').update(updates).eq('id', user.id).select().single()
    if (error) throw error
    set({ sellerProfile: data })
    return data
  },
}))
