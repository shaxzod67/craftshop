import { useState, useEffect, useRef } from 'react'
import { Input, Button, Avatar, Typography, Badge, Spin, Empty } from 'antd'
import { SendOutlined, UserOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import dayjs from 'dayjs'

const { Text } = Typography

export default function SellerMessages() {
  const { profile } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { fetchConversations() }, [profile])
  useEffect(() => { if (activeConv) fetchMessages(activeConv) }, [activeConv])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchConversations = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(id, full_name, avatar_url), receiver:profiles!receiver_id(id, full_name, avatar_url)')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })

    // Group by conversation partner
    const convMap = {}
    for (const msg of (data || [])) {
      const partner = msg.sender_id === profile.id ? msg.receiver : msg.sender
      if (!partner) continue
      if (!convMap[partner.id]) {
        convMap[partner.id] = { partner, lastMsg: msg, unread: 0 }
      }
      if (!msg.is_read && msg.receiver_id === profile.id) {
        convMap[partner.id].unread++
      }
    }
    setConversations(Object.values(convMap))
    setLoading(false)
  }

  const fetchMessages = async (partnerId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    // mark read
    await supabase.from('messages').update({ is_read: true })
      .eq('receiver_id', profile.id).eq('sender_id', partnerId)
    setConversations(c => c.map(x => x.partner.id === partnerId ? { ...x, unread: 0 } : x))
  }

  const handleSend = async () => {
    if (!input.trim() || !activeConv) return
    setSending(true)
    const { data } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: activeConv,
      content: input.trim(),
    }).select().single()
    setMessages(m => [...m, data])
    setInput('')
    setSending(false)
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 20 }}>Xabarlar</Typography.Title>

      <div style={{ display: 'flex', background: 'white', borderRadius: 12, border: '1px solid #e8e0d5', overflow: 'hidden', height: 580 }}>
        {/* Sidebar */}
        <div style={{ width: 280, borderRight: '1px solid #e8e0d5', overflowY: 'auto', flexShrink: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin /></div>
          ) : conversations.length === 0 ? (
            <Empty description="Xabarlar yo'q" style={{ padding: 40 }} />
          ) : (
            conversations.map(conv => (
              <div
                key={conv.partner.id}
                onClick={() => setActiveConv(conv.partner.id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                  background: activeConv === conv.partner.id ? '#faf3ee' : 'white',
                  borderLeft: activeConv === conv.partner.id ? '3px solid #8B4513' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Badge count={conv.unread} size="small">
                  <Avatar icon={<UserOutlined />} src={conv.partner.avatar_url} style={{ background: '#8B4513', flexShrink: 0 }} />
                </Badge>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: 600, fontSize: 13, display: 'block' }}>{conv.partner.full_name}</Text>
                  <Text type="secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {conv.lastMsg.content}
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
                  {dayjs(conv.lastMsg.created_at).format('HH:mm')}
                </Text>
              </div>
            ))
          )}
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                <Text type="secondary">Suhbat tanlang</Text>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map(msg => {
                  const isMine = msg.sender_id === profile.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '8px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMine ? '#8B4513' : '#f5f0e8',
                        color: isMine ? 'white' : '#2c2c2c',
                        fontSize: 13, lineHeight: 1.5
                      }}>
                        {msg.content}
                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                          {dayjs(msg.created_at).format('HH:mm')}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e0d5', display: 'flex', gap: 8 }}>
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onPressEnter={handleSend}
                  placeholder="Xabar yozing..."
                  style={{ borderRadius: 20 }}
                />
                <Button
                  type="primary" shape="circle" icon={<SendOutlined />}
                  loading={sending} onClick={handleSend}
                  disabled={!input.trim()}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
