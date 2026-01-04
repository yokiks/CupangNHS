import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageBackground from '../components/PageBackground';

const Concerns = () => {
  return (
    <PageBackground>
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section with Enhanced Design */}
        <div className="text-center mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100 via-primary-50 to-primary-100 rounded-full opacity-30 blur-3xl"></div>
          
          <div className="relative">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-2xl mb-8 transform hover:rotate-6 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-700 mb-6 leading-tight">
              Student Concerns Portal
            </h1>
            
            <div className="w-32 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 mx-auto mb-8 rounded-full"></div>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium max-w-2xl mx-auto">
              Your voice matters, we're here to listen.
            </p>
            <p className="text-base md:text-lg text-gray-600 italic max-w-xl mx-auto">
              Together, we build a better and safer school community.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors duration-300">
              <svg className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Safe & Secure</h3>
            <p className="text-gray-600 leading-relaxed">
              Your concerns are handled with confidentiality and care, ensuring a safe space for every student.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors duration-300">
              <svg className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Quick Response</h3>
            <p className="text-gray-600 leading-relaxed">
              Our dedicated team reviews and responds to all concerns promptly to address your needs.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors duration-300">
              <svg className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Community Support</h3>
            <p className="text-gray-600 leading-relaxed">
              Join a supportive community where every voice contributes to positive change.
            </p>
          </div>
        </div>

        {/* Main Action Card */}
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-gradient-to-br from-white via-primary-50 to-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-300 rounded-full -ml-24 -mb-24 opacity-20"></div>
            
            <div className="relative p-10 md:p-16">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  Get Started Today
                </h2>
                <p className="text-gray-600 text-lg">
                  Access the portal to submit and track your concerns
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Login Button */}
                <Link 
                  to="/login"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 p-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-30 transition-all duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Login</h3>
                      <p className="text-primary-100 text-sm">
                        Already have an account?
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Register Button */}
                <Link 
                  to="/register"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="relative bg-gradient-to-r from-primary-700 to-primary-800 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 p-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-30 transition-all duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Register</h3>
                      <p className="text-primary-100 text-sm">
                        Create a new account
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Please log in or register to access the Student Concerns Portal
                </p>
                
                {/* Additional Info */}
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Need help? Contact the guidance office</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-8 md:p-10 text-center">
            <h3 className="text-2xl font-bold text-primary-800 mb-4">
              Why Use the Concerns Portal?
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700">Report bullying, harassment, or safety concerns</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700">Request academic or personal guidance</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700">Suggest improvements for school facilities</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700">Share feedback about school programs</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Concerns;

// import { Link } from 'react-router-dom'
// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import PageBackground from '../components/PageBackground'

// const Concerns = () => {
//   return (
//     <PageBackground>
//       <Navbar />
      
//       <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
//         <div className="text-center mb-12">
//           <h1 className="text-3xl md:text-5xl font-bold text-primary-600 mb-4">
//             Student Concerns Portal
//           </h1>
//           <p className="text-lg md:text-xl text-gray-700 mb-2">
//             Your voice matters, we're here to listen.
//           </p>
//           <p className="text-sm md:text-base text-gray-600 italic">
//             Together, we build a better and safer school community.
//           </p>
//         </div>

//         <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl p-8">
//           <div className="flex flex-col sm:flex-row gap-4 mb-6">
//             <Link 
//               to="/login"
//               className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-center"
//             >
//               Login
//             </Link>
//             <Link 
//               to="/register"
//               className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-center"
//             >
//               Register
//             </Link>
//           </div>
//           <p className="text-center text-gray-600 text-sm">
//             Please log in or register to continue.
//           </p>
//         </div>
//       </main>

//       <Footer />
//     </PageBackground>
//   )
// }

// export default Concerns