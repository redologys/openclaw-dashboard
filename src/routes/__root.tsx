import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
