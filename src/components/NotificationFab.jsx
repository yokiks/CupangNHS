import { useEffect, useState } from 'react'
import axios from 'axios'

const NotificationFab = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refresh()
    const interval = setInterval(() => {
      refresh(false)
    }, 5000) // poll more frequently to feel real-time
    const onExternalRefresh = () => refresh(false)
    const onPush = (e) => {
      const detail = e?.detail || {}
      const local = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message: detail.message || 'Update',
        read: false,
        createdAt: new Date().toISOString()
      }
      setNotifications(prev => [local, ...prev])
      setUnreadCount(prev => prev + 1)
    }
    window.addEventListener('notifications:refresh', onExternalRefresh)
    window.addEventListener('notifications:push', onPush)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications:refresh', onExternalRefresh)
      window.removeEventListener('notifications:push', onPush)
    }
  }, [])

  const refresh = async (withPanel = false) => {
    try {
      setLoading(withPanel)
      const [countRes, listRes] = await Promise.all([
        axios.get('/api/notifications/unread/count'),
        axios.get('/api/notifications'),
      ])
      setUnreadCount(countRes.data.count || 0)
      setNotifications(listRes.data || [])
    } catch (e) {
      // Silent fail; UI should not break
      // console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`)
      refresh()
    } catch (e) {
      // ignore
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all')
      refresh()
    } catch (e) {
      // ignore
    }
  }

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/0"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-24 right-6 z-50 w-[22rem] max-w-[90vw]">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => refresh(true)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    aria-label="Refresh"
                  >
                    {loading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-gray-500 text-sm">You have no notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id)
                      }}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition ${!n.read ? 'bg-primary-50/60 hover:bg-primary-50' : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2.5 h-2.5 rounded-full ${n.read ? 'bg-gray-300' : 'bg-primary-500'}`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{n.message}</p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:scale-95 transition transform"
        aria-label="Open notifications"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] leading-5 text-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </button>
    </>
  )
}

export default NotificationFab

