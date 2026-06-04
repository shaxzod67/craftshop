import { Spin } from 'antd'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div style={{ fontSize: 48, marginBottom: 8 }}>🏺</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#8B4513', letterSpacing: '-0.5px' }}>
        CraftShop
      </div>
      <Spin size="large" style={{ marginTop: 16 }} />
      <div style={{ color: '#999', fontSize: 13, marginTop: 8 }}>Yuklanmoqda...</div>
    </div>
  )
}
