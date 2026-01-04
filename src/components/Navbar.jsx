import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 text-white shadow-2xl relative">
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo and School Name - Left Side */}
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group"
            onClick={closeMenu}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <img 
                src="/images/cunhs_logo.png" 
                alt="School Logo" 
                className="relative w-11 h-11 rounded-full border-2 border-white shadow-lg transform group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base md:text-lg leading-tight">Cupang National High School</span>
              <span className="text-xs text-primary-100 hidden sm:block">Excellence in Education</span>
            </div>
          </Link>
          
          {/* Right Side - Notification & Hamburger */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:block">
                <NotificationBell />
              </div>
            )}
            
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 backdrop-blur-sm"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-2 lg:gap-3">
            <li>
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  isActive('/') 
                    ? 'bg-white bg-opacity-20 font-semibold shadow-lg backdrop-blur-sm' 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  isActive('/about') 
                    ? 'bg-white bg-opacity-20 font-semibold shadow-lg backdrop-blur-sm' 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/concerns" 
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  isActive('/concerns') 
                    ? 'bg-white bg-opacity-20 font-semibold shadow-lg backdrop-blur-sm' 
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Concerns</span>
              </Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link 
                    to="/dashboard" 
                    className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      isActive('/dashboard') 
                        ? 'bg-white bg-opacity-20 font-semibold shadow-lg backdrop-blur-sm' 
                        : 'hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
                    </svg>
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={logout}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-300 font-semibold shadow-lg backdrop-blur-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link 
                  to="/login" 
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                    isActive('/login') 
                      ? 'bg-white bg-opacity-20 font-semibold shadow-lg backdrop-blur-sm' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-white border-opacity-20 mt-2 pt-4 pb-4">
            <ul className="flex flex-col gap-2">
              <li>
                <Link 
                  to="/" 
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive('/') 
                      ? 'bg-white bg-opacity-20 font-semibold shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive('/about') 
                      ? 'bg-white bg-opacity-20 font-semibold shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/concerns" 
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive('/concerns') 
                      ? 'bg-white bg-opacity-20 font-semibold shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>Concerns</span>
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link 
                      to="/dashboard" 
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive('/dashboard') 
                          ? 'bg-white bg-opacity-20 font-semibold shadow-lg' 
                          : 'hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li className="px-4 py-2">
                    <NotificationBell />
                  </li>
                  <li>
                    <button 
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-300 font-semibold shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link 
                    to="/login" 
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-300 font-semibold shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Login</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// import { useState } from 'react'
// import { Link, useLocation } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import NotificationBell from './NotificationBell'

// const Navbar = () => {
//   const location = useLocation()
//   const { user, logout } = useAuth()
//   const [isMenuOpen, setIsMenuOpen] = useState(false)

//   const isActive = (path) => location.pathname === path

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen)
//   }

//   const closeMenu = () => {
//     setIsMenuOpen(false)
//   }

//   return (
//     <nav className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
//       <div className="container mx-auto px-4">
//         <div className="flex items-center justify-between py-4">
//           {/* Logo and School Name - Left Side */}
//           <Link 
//             to="/" 
//             className="flex items-center gap-2 hover:opacity-90 transition"
//             onClick={closeMenu}
//           >
//             <img 
//               src="/images/cunhs_logo.png" 
//               alt="School Logo" 
//               className="w-10 h-10 rounded-full border-2 border-white flex-shrink-0"
//             />
//             <span className="font-bold text-lg">Cupang National High School</span>
//           </Link>
          
//           {/* Hamburger Button - Right Side (Mobile Only) */}
//           <div className="flex items-center gap-3">
//             {user && (
//               <div className="hidden md:block">
//                 <NotificationBell />
//               </div>
//             )}
//             <button
//               onClick={toggleMenu}
//               className="md:hidden p-2 rounded-md hover:bg-primary-700 transition focus:outline-none focus:ring-2 focus:ring-white"
//               aria-label="Toggle menu"
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 {isMenuOpen ? (
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 ) : (
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M4 6h16M4 12h16M4 18h16"
//                   />
//                 )}
//               </svg>
//             </button>
//           </div>

//           {/* Desktop Menu */}
//           <ul className="hidden md:flex items-center gap-4 lg:gap-6">
//             <li>
//               <Link 
//                 to="/" 
//                 className={`px-3 py-2 rounded-md transition ${
//                   isActive('/') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                 }`}
//               >
//                 Home
//               </Link>
//             </li>
//             <li>
//               <Link 
//                 to="/about" 
//                 className={`px-3 py-2 rounded-md transition ${
//                   isActive('/about') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                 }`}
//               >
//                 About
//               </Link>
//             </li>
//             <li>
//               <Link 
//                 to="/concerns" 
//                 className={`px-3 py-2 rounded-md transition ${
//                   isActive('/concerns') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                 }`}
//               >
//                 Concerns
//               </Link>
//             </li>
//             {user ? (
//               <>
//                 <li>
//                   <Link 
//                     to="/dashboard" 
//                     className={`px-3 py-2 rounded-md transition ${
//                       isActive('/dashboard') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                     }`}
//                   >
//                     Dashboard
//                   </Link>
//                 </li>
//                 <li>
//                   <button 
//                     onClick={logout}
//                     className="px-4 py-2 bg-primary-800 hover:bg-primary-900 rounded-md transition"
//                   >
//                     Logout
//                   </button>
//                 </li>
//               </>
//             ) : (
//               <li>
//                 <Link 
//                   to="/login" 
//                   className={`px-3 py-2 rounded-md transition ${
//                   isActive('/login') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                 }`}                >
//                   Login
//                 </Link>
//               </li>
//             )}
//           </ul>
//         </div>

//         {/* Mobile Menu */}
//         {isMenuOpen && (
//           <div className="md:hidden border-t border-primary-500 mt-2 pt-4 pb-4">
//             <ul className="flex flex-col gap-2">
//               <li>
//                 <Link 
//                   to="/" 
//                   onClick={closeMenu}
//                   className={`block px-4 py-2 rounded-md transition ${
//                     isActive('/') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                   }`}
//                 >
//                   Home
//                 </Link>
//               </li>
//               <li>
//                 <Link 
//                   to="/about" 
//                   onClick={closeMenu}
//                   className={`block px-4 py-2 rounded-md transition ${
//                     isActive('/about') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                   }`}
//                 >
//                   About
//                 </Link>
//               </li>
//               <li>
//                 <Link 
//                   to="/concerns" 
//                   onClick={closeMenu}
//                   className={`block px-4 py-2 rounded-md transition ${
//                     isActive('/concerns') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                   }`}
//                 >
//                   Concerns
//                 </Link>
//               </li>
//               {user ? (
//                 <>
//                   <li>
//                     <Link 
//                       to="/dashboard" 
//                       onClick={closeMenu}
//                       className={`block px-4 py-2 rounded-md transition ${
//                         isActive('/dashboard') ? 'bg-primary-800 font-semibold' : 'hover:bg-primary-700'
//                       }`}
//                     >
//                       Dashboard
//                     </Link>
//                   </li>
//                   <li className="px-4 py-2">
//                     <NotificationBell />
//                   </li>
//                   <li>
//                     <button 
//                       onClick={() => {
//                         closeMenu()
//                         logout()
//                       }}
//                       className="w-full text-left px-4 py-2 bg-primary-800 hover:bg-primary-900 rounded-md transition"
//                     >
//                       Logout
//                     </button>
//                   </li>
//                 </>
//               ) : (
//                 <li>
//                   <Link 
//                     to="/login" 
//                     onClick={closeMenu}
//                     className="block px-4 py-2 bg-primary-800 hover:bg-primary-900 rounded-md transition text-center"
//                   >
//                     Login
//                   </Link>
//                 </li>
//               )}
//             </ul>
//           </div>
//         )}
//       </div>
//     </nav>
//   )
// }

// export default Navbar