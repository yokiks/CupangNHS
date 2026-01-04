import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageBackground from '../components/PageBackground';
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    role: 'student',
    identifier: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('rememberedIdentifier');
    const savedRole = localStorage.getItem('rememberedRole');
    if (savedIdentifier) {
      setFormData(prev => ({
        ...prev,
        identifier: savedIdentifier,
        role: savedRole || 'student'
      }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.identifier || !formData.password) {
      setError('Please complete all required fields');
      setLoading(false);
      return;
    }

    // Call login (AuthContext login function only accepts identifier and password)
    const result = await login(formData.identifier, formData.password);

    if (result.success) {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedIdentifier', formData.identifier);
        localStorage.setItem('rememberedRole', formData.role);
      } else {
        localStorage.removeItem('rememberedIdentifier');
        localStorage.removeItem('rememberedRole');
      }
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }

    setLoading(false);
  };

  return (
    <PageBackground>
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-lg">
          <div className="relative bg-gradient-to-br from-white via-primary-50 to-white rounded-3xl shadow-2xl overflow-hidden">

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-300 rounded-full -ml-24 -mb-24 opacity-20"></div>

            <div className="relative p-8 md:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-4 transform hover:rotate-12 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">Welcome Back</h2>
                <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-3 rounded-full"></div>
                <p className="text-gray-600">Please login to access your account</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Login As</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="student">Student</option>
                    <option value="guidance">Guidance Counselor</option>
                  </select>
                </div>

                {/* Identifier */}
                <div className="group">
                  <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
                    {formData.role === "student" ? "LRN or Username" : "Username"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="identifier"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleChange}
                      className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
                      placeholder={
                        formData.role === "student"
                          ? "Enter LRN or username"
                          : "Enter your username"
                      }
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff size={20} strokeWidth={2} />
                      ) : (
                        <Eye size={20} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded cursor-pointer focus:ring-primary-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-sm text-primary-600 font-semibold">
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6 text-center text-sm text-gray-500">
                Don't have an account?
              </div>

              <Link
                to="/register"
                className="block w-full py-3 text-center border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all"
              >
                Create an Account
              </Link>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Login;


// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';
// import PageBackground from '../components/PageBackground';

// const Login = () => {
//   const [formData, setFormData] = useState({
//     identifier: '',
//     password: ''
//   });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     if (!formData.identifier || !formData.password) {
//       setError('Please enter your LRN or username and password');
//       setLoading(false);
//       return;
//     }

//     const result = await login(formData.identifier, formData.password);
    
//     if (result.success) {
//       navigate('/dashboard');
//     } else {
//       setError(result.message || 'Login failed. Please check your credentials.');
//     }
    
//     setLoading(false);
//   };
 
//   return (
//     <PageBackground>
//       <Navbar />
      
//       <main className="flex-grow flex items-center justify-center px-4 py-8 md:py-12">
//         <div className="w-full max-w-lg">
//           {/* Main Card */}
//           <div className="relative bg-gradient-to-br from-white via-primary-50 to-white rounded-3xl shadow-2xl overflow-hidden">
//             {/* Decorative Elements */}
//             <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
//             <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-300 rounded-full -ml-24 -mb-24 opacity-20"></div>
            
//             <div className="relative p-8 md:p-10">
//               {/* Header Section */}
//               <div className="text-center mb-8">
//                 <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-4 transform hover:rotate-12 transition-transform duration-300">
//                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                   </svg>
//                 </div>
//                 <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">Welcome Back</h2>
//                 <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-3 rounded-full"></div>
//                 <p className="text-gray-600">Please login to access your account</p>
//               </div>

//               {/* Error Message */}
//               {error && (
//                 <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 animate-fade-in">
//                   <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                   <p className="text-sm text-red-700 font-medium">{error}</p>
//                 </div>
//               )}

//               {/* Login Form */}
//               <form onSubmit={handleSubmit} className="space-y-5">
//                 {/* LRN/Username Field */}
//                 <div className="group">
//                   <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
//                     LRN or Username
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                       <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                       </svg>
//                     </div>
//                     <input
//                       type="text"
//                       id="identifier"
//                       name="identifier"
//                       value={formData.identifier}
//                       onChange={handleChange}
//                       className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
//                       placeholder="Enter your LRN or username"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Password Field */}
//                 <div className="group">
//                   <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                       <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                       </svg>
//                     </div>
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       id="password"
//                       name="password"
//                       value={formData.password}
//                       onChange={handleChange}
//                       className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
//                       placeholder="Enter your password"
//                       required
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
//                     >
//                       {showPassword ? (
//                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                         </svg>
//                       ) : (
//                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                         </svg>
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Forgot Password Link */}
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <input
//                       id="remember-me"
//                       name="remember-me"
//                       type="checkbox"
//                       className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
//                     />
//                     <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
//                       Remember me
//                     </label>
//                   </div>
//                   <Link 
//                     to="/forgot-password" 
//                     className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
//                   >
//                     Forgot Password?
//                   </Link>
//                 </div>

//                 {/* Submit Button */}
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="group relative w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
//                 >
//                   <span className="relative z-10 flex items-center justify-center space-x-2">
//                     {loading ? (
//                       <>
//                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         <span>Logging in...</span>
//                       </>
//                     ) : (
//                       <>
//                         <span>Login</span>
//                         <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                         </svg>
//                       </>
//                     )}
//                   </span>
//                   <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
//                 </button>
//               </form>

//               {/* Divider */}
//               <div className="relative my-6">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-200"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-4 bg-white text-gray-500">Don't have an account?</span>
//                 </div>
//               </div>

//               {/* Register Link */}
//               <Link 
//                 to="/register"
//                 className="block w-full py-3 text-center border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transform hover:-translate-y-0.5 transition-all duration-300"
//               >
//                 Create an Account
//               </Link>

//               {/* Additional Info
//               <div className="mt-6 text-center">
//                 <p className="text-xs text-gray-500">
//                   By logging in, you agree to our{' '}
//                   <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
//                   {' '}and{' '}
//                   <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
//                 </p>
//               </div> */}
//             </div>
//           </div>

//           {/* Help Section
//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-600">
//               Need help?{' '}
//               <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold">
//                 Contact Support
//               </a>
//             </p>
//           </div> */}
//         </div>
//       </main>

//       <Footer />
//     </PageBackground>
//   );
// };

// export default Login;

// // import { useState } from 'react'
// // import { Link, useNavigate } from 'react-router-dom'
// // import { useAuth } from '../context/AuthContext'
// // import Navbar from '../components/Navbar'
// // import Footer from '../components/Footer'
// // import PageBackground from '../components/PageBackground'

// // const Login = () => {
// //   const [formData, setFormData] = useState({
// //     identifier: '',
// //     password: ''
// //   })
// //   const [error, setError] = useState('')
// //   const [loading, setLoading] = useState(false)
// //   const { login } = useAuth()
// //   const navigate = useNavigate()

// //   const handleChange = (e) => {
// //     setFormData({
// //       ...formData,
// //       [e.target.name]: e.target.value
// //     })
// //     setError('')
// //   }

// //   const handleSubmit = async (e) => {
// //     e.preventDefault()                                                                             
// //     setError('')
// //     setLoading(true)

// //     if (!formData.identifier || !formData.password) {
// //       setError('Please enter your LRN or username and password')
// //       setLoading(false)
// //       return
// //     }

// //     const result = await login(formData.identifier, formData.password)
    
// //     if (result.success) {
// //       navigate('/dashboard')
// //     } else {
// //       setError(result.message || 'Login failed. Please check your credentials.')
// //     }
    
// //     setLoading(false)
// //   }
 
// //    return (
// //      <PageBackground>
// //        <Navbar />
       
// //        <main className="flex-grow flex items-center justify-center px-4 py-12">
// //          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10">
// //            <h2 className="text-3xl font-bold text-primary-600 mb-2 text-center">Login</h2>
// //            <p className="text-gray-600 text-center mb-8">Welcome back! Please login to continue.</p>
 
// //            {error && (
// //              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
// //               {error}
// //              </div>
// //            )}
 
// //            <form onSubmit={handleSubmit} className="space-y-6">
// //              <div>
// //                <label htmlFor="identifier" className="block text-sm font-semibold text-gray-700 mb-2">
// //                  LRN or Username
// //                </label>
// //                <input
// //                  type="text"
// //                 id="identifier"
// //                  name="identifier"
// //                 value={formData.identifier}
// //                 onChange={handleChange}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                 placeholder="Enter your LRN or username"
// //                 required
// //               />
// //             </div>

// //             <div>
// //               <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
// //                 Password
// //               </label>
// //               <input
// //                 type="password"
// //                 id="password"
// //                 name="password"
// //                 value={formData.password}
// //                 onChange={handleChange}
// //                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
// //                 placeholder="Enter your password"
// //                 required
// //               />
// //             </div>

// //             <div className="text-right">
// //               <Link 
// //                 to="/forgot-password" 
// //                 className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
// //               >
// //                 Forgot Password?
// //               </Link>
// //             </div>

// //             <button
// //               type="submit"
// //               disabled={loading}
// //               className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
// //             >
// //               {loading ? 'Logging in...' : 'Login'}
// //             </button>
// //           </form>

// //           <p className="mt-6 text-center text-gray-600 text-sm">
// //             Don't have an account?{' '}
// //             <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
// //               Register here
// //             </Link>
// //           </p>
// //         </div>
// //       </main>

// //       <Footer />
// //     </PageBackground>
// //   )
// // } 

// // export default Login    