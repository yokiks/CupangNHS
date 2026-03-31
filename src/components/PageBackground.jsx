import { useAuth } from '../context/AuthContext'
import NotificationFab from './NotificationFab'

const PageBackground = ({ children }) => {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image with Overlay - Optimized for performance and mobile */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: 'url(/images/cunhs_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'translateZ(0)', // Force GPU acceleration
          backfaceVisibility: 'hidden', // Optimize rendering
          WebkitTransform: 'translateZ(0)', // Safari support
        }}
      >
        <div 
          className="absolute inset-0 bg-white/90 md:bg-white/85"
          style={{
            backdropFilter: 'blur(1px)', // Reduced blur for mobile performance
            WebkitBackdropFilter: 'blur(1px)',
          }}
        />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
        {user && <NotificationFab />}
      </div>
    </div>
  )
}

export default PageBackground

