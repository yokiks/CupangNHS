import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageBackground from '../components/PageBackground';

const Home = () => {
  return (
    <PageBackground>
      <Navbar />
        
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        {/* Hero Header Section */}
        <header className="text-center mb-16 md:mb-24 animate-fade-in relative">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-200 to-primary-100 rounded-full opacity-20 blur-3xl"></div>
          </div>

          {/* Logo with Enhanced Design */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <img 
              src="/images/cunhs_logo.png" 
              alt="CNHS Logo" 
              className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full shadow-2xl border-4 border-white transform hover:scale-110 transition-transform duration-300"
            />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gradient mb-6 leading-tight">
            Cupang National High School
          </h1>
          
          <div className="w-32 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 mx-auto mb-6 rounded-full"></div>
          
          <p className="text-gray-700 text-base md:text-lg max-w-3xl mx-auto font-medium leading-relaxed px-4">
            Benedict Street, Our Lady of Peace Subd., Purok 2 Zone 8, Brgy. Cupang 1870 Antipolo City
          </p>
        </header>

        {/* Tagline Section with Icon */}
        <div className="text-center mb-16 md:mb-20 animate-fade-in-up max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-xl mb-6 transform hover:rotate-12 transition-transform duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-700 mb-4 leading-tight">
            Stay Connected With CuNHS
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 font-medium">
            A simple way to voice concerns and stay informed.
          </p>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 md:mb-24 animate-fade-in-up-delay max-w-3xl mx-auto">
          <Link 
            to="/about"
            className="group relative w-full sm:w-auto overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700"></div>
            <div className="relative px-10 py-6 flex items-center justify-center space-x-3">
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-white font-bold text-lg">About School</span>
            </div>
          </Link>

          <Link 
            to="/concerns"
            className="group relative w-full sm:w-auto overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800"></div>
            <div className="relative px-10 py-6 flex items-center justify-center space-x-3">
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-white font-bold text-lg">Student Concerns</span>
            </div>
          </Link>
        </div>

        {/* Contact Section - Ultra Professional Design */}
        <div className="max-w-5xl mx-auto animate-fade-in-up-delay-2">
          <div className="relative bg-gradient-to-br from-white via-primary-50 to-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-300 rounded-full -ml-24 -mb-24 opacity-20"></div>
            
            <div className="relative p-8 md:p-12 lg:p-16">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-xl mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Get In Touch
                </h3>
                <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-4 rounded-full"></div>
                <p className="text-gray-600 text-lg">We're here to help and answer any questions you may have</p>
              </div>
              
              {/* Contact Cards Grid */}
              <div className="grid md:grid-cols-3 gap-8 mb-10">
                {/* Messenger Card */}
                <a 
                  href="https://m.me/DepEdTayoCuNHS301420" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-primary-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <img 
                          src="/images/messenger.png" 
                          alt="Messenger" 
                          className="w-12 h-12"
                        />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg mb-3">Messenger</h4>
                    <p className="text-sm text-primary-600 font-semibold break-words leading-relaxed">
                      DepEd Tayo Cupang NHS
                    </p>
                    <div className="mt-4 text-xs text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      Click to chat
                    </div>
                  </div>
                </a>

                {/* Email Card */}
                <a 
                  href="mailto:301420@deped.gov.ph"
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-primary-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-red-200 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <img 
                          src="/images/gmail.png" 
                          alt="Email" 
                          className="w-12 h-12"
                        />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg mb-3">Email</h4>
                    <p className="text-sm text-primary-600 font-semibold break-words leading-relaxed">
                      301420@deped.gov.ph
                    </p>
                    <div className="mt-4 text-xs text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Send an email
                    </div>
                  </div>
                </a>

                {/* Phone Card */}
                <a 
                  href="tel:09#######13"
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-primary-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <div className="relative w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <img 
                          src="/images/phone.png" 
                          alt="Phone" 
                          className="w-12 h-12"
                        />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg mb-3">Tel No.</h4>
                    <p className="text-sm text-primary-600 font-semibold leading-relaxed">
                      (02)7120-5569
                    </p>
                    <div className="mt-4 text-xs text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Give us a call
                    </div>
                  </div>
                </a>
              </div>

              {/* Office Hours Section */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-gray-800 text-lg">Office Hours</span>
                </div>
                <p className="text-gray-700">
                  Monday - Friday, 8:00 AM - 5:00 PM
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  We aim to respond to all inquiries within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-primary-600 mb-2">2003</div>
              <div className="text-sm text-gray-600">Established</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-primary-600 mb-2">20+</div>
              <div className="text-sm text-gray-600">Years of Excellence</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-primary-600 mb-2">K-12</div>
              <div className="text-sm text-gray-600">Curriculum</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-primary-600 mb-2">JHS</div>
              <div className="text-sm text-gray-600">Grades 7-10</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Home;

// import { Link } from 'react-router-dom'
// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import PageBackground from '../components/PageBackground'

// const Home = () => {
//   return (
//     <PageBackground>
//       <Navbar />
        
//         <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
//           {/* Header Section */}
//           <header className="text-center mb-8 md:mb-12 animate-fade-in">
//             <img 
//               src="/images/cunhs_logo.png" 
//               alt="CNHS Logo" 
//               className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full shadow-xl border-4 border-white mb-4"
//             />
//             <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gradient mb-3">
//               Cupang National High School
//             </h1>
//             <p className="text-gray-700 italic text-sm md:text-base max-w-2xl mx-auto font-medium">
//               Benedict Street, Our Lady of Peace Subd., Purok 2 Zone 8, Brgy. Cupang 1870 Antipolo City.
//             </p>
//           </header>

//           {/* Tagline Section */}
//           <div className="text-center mb-8 md:mb-12 animate-fade-in-up">
//             <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary-600 mb-3">
//               Stay Connected With CuNHS
//             </h2>
//             <p className="text-lg md:text-xl text-gray-700 font-medium">
//               A simple way to voice concerns.
//             </p>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up-delay">
//             <Link 
//               to="/about"
//               className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 text-center gpu-accelerated"
//             >
//               About School
//             </Link>
//             <Link 
//               to="/concerns"
//               className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 text-center gpu-accelerated"
//             >
//               Student Concerns
//             </Link>
//           </div>

//           {/* Contact Section - Professional Design */}
//           <div className="max-w-4xl mx-auto animate-fade-in-up-delay-2 gpu-accelerated">
//             <div className="bg-gradient-to-br from-white via-green-50 to-white rounded-3xl shadow-2xl p-8 md:p-10 border border-primary-100 gpu-accelerated">
//               <div className="text-center mb-8">
//                 <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
//                   Get In Touch
//                 </h3>
//                 <p className="text-gray-600">We're here to help and answer any questions</p>
//               </div>
              
//               <div className="grid md:grid-cols-3 gap-6 mb-8">
//                 {/* Messenger Card */}
//                 <a 
//                   href="https://m.me/DepEdTayoCuNHS301420" 
//                   target="_blank" 
//                   rel="noopener noreferrer"
//                   className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-300 transform hover:-translate-y-1"
//                 >
//                   <div className="flex flex-col items-center text-center">
//                     <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
//                       <img 
//                         src="/images/messenger.png" 
//                         alt="Messenger" 
//                         className="w-10 h-10"
//                       />
//                     </div>
//                     <h4 className="font-bold text-gray-800 mb-2">Messenger</h4>
//                     <p className="text-sm text-primary-600 font-semibold break-words">
//                       DepEd Tayo Cupang NHS
//                     </p>
//                   </div>
//                 </a>

//                 {/* Email Card */}
//                 <a 
//                   href="mailto:301420@deped.gov.ph"
//                   className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-200 border-2 border-transparent hover:border-primary-300 gpu-accelerated"
//                 >
//                   <div className="flex flex-col items-center text-center">
//                     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
//                       <img 
//                         src="/images/gmail.png" 
//                         alt="Email" 
//                         className="w-10 h-10"
//                       />
//                     </div>
//                     <h4 className="font-bold text-gray-800 mb-2">Email</h4>
//                     <p className="text-sm text-primary-600 font-semibold break-words">
//                       301420@deped.gov.ph
//                     </p>
//                   </div>
//                 </a>

//                 {/* Phone Card */}
//                 <a 
//                   href="tel:09#######13"
//                   className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow duration-200 border-2 border-transparent hover:border-primary-300 gpu-accelerated"
//                 >
//                   <div className="flex flex-col items-center text-center">
//                     <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
//                       <img 
//                         src="/images/phone.png" 
//                         alt="Phone" 
//                         className="w-10 h-10"
//                       />
//                     </div>
//                     <h4 className="font-bold text-gray-800 mb-2">Phone</h4>
//                     <p className="text-sm text-primary-600 font-semibold">
//                       09#######13
//                     </p>
//                   </div>
//                 </a>
//               </div>

//               <div className="text-center pt-4 border-t border-gray-200">
//                 <p className="text-sm text-gray-600">
//                   <span className="font-semibold">Office Hours:</span> Monday - Friday, 8:00 AM - 5:00 PM
//                 </p>
//               </div>
//             </div>
//           </div>
//         </main>

//         <Footer />
//     </PageBackground>
//   )
// }

// export default Home
