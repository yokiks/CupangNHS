const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-50 via-primary-50 to-gray-50 border-t-2 border-primary-200 mt-auto relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full -mr-32 -mt-32 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-200 rounded-full -ml-24 -mb-24 opacity-30"></div>
      
      <div className="container mx-auto px-4 py-8 relative">
        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* School Info Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/cunhs_logo.png" 
                alt="School Logo" 
                className="w-12 h-12 rounded-full shadow-lg border-2 border-primary-500"
              />
              <div>
                <h3 className="font-bold text-primary-700 text-lg">CuNHS</h3>
                <p className="text-xs text-gray-600">Excellence in Education</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cupang National High School is committed to providing quality education and fostering a safe, supportive learning environment for all students.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className="font-bold text-primary-700 mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  About Us
                </a>
              </li>
              <li>
                <a href="/concerns" className="text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Student Concerns
                </a>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div>
            <h4 className="font-bold text-primary-700 mb-4 text-lg">Connect With Us</h4>
            <div className="space-y-3">
              {/* Facebook */}
              <a 
                href="https://www.facebook.com/DepEdTayoCuNHS301420" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-lg transition-all duration-300 group border border-gray-200"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <img 
                    src="/images/facebook.png" 
                    alt="Facebook" 
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Follow us on</p>
                  <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">Facebook</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Brgy. Cupang, Antipolo City, Rizal</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>301420@deped.gov.ph</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-200 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 font-medium">
                © 2025 Cupang National High School. All Rights Reserved.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Web-Based Student Concern Management and Tracking System
              </p>
            </div>

            {/* Developed By */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border border-primary-200">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Developed by</p>
                <p className="text-sm font-bold text-primary-700">#GROUP NAME</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="absolute bottom-24  right-4 w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
          aria-label="Back to top"
        >
          <svg className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </footer>
  );
};

export default Footer;


// const Footer = () => {
//   return (
//     <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
//       <div className="container mx-auto px-4 py-6">
//         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//           <a 
//             href="https://www.facebook.com/DepEdTayoCuNHS301420" 
//             target="_blank" 
//             rel="noopener noreferrer"
//             className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition font-semibold"
//           >
//             <img 
//               src="/images/facebook.png" 
//               alt="Facebook" 
//               className="w-6 h-6"
//             />
//             DepEd Tayo Cupang NHS – Antipolo City
//           </a>
//           <div className="text-center md:text-right text-sm text-gray-600">
//             <p>© 2025 Cupang National High School. All Rights Reserved.</p>
//             <p className="mt-1">Web-Based Student Concern Management and Tracking System</p>
//             <p className="mt-1">Developed by: BSIT</p>
//           </div>
//         </div>
//       </div>
//     </footer>
//   )
// }

// export default Footer