import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageBackground from '../components/PageBackground';

const About = () => {
  return (
    <PageBackground>
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-50 rounded-3xl opacity-50 blur-3xl"></div>
          <div className="relative">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-700 mb-4">
              About Our School
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-6"></div>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Empowering minds, shaping futures since 2003
            </p>
          </div>
        </div>

        {/* Mission & Vision Cards - Enhanced Design */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Mission Card */}
          <div className="group relative bg-gradient-to-br from-white to-primary-50 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-200 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative p-8 md:p-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-primary-700">Our Mission</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                To protect and promote the rights of every Filipino to quality, equitable culture-based, and complete basic education where students learn in a child-friendly, gender-sensitive, safe, and motivating environment.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Teachers facilitate learning and constantly nurture every learner. Administrators and staff, as stewards of the institution, ensure an enabling and supportive environment for effective learning to happen. Family, community, and other stakeholders are actively engaged and share responsibility for developing life-long learners.
              </p>
            </div>
          </div>

          {/* Vision Card */}
          <div className="group relative bg-gradient-to-br from-white to-primary-50 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-300 rounded-full -mr-20 -mt-20 opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative p-8 md:p-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-primary-700">Our Vision</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation.
              </p>
              <p className="text-gray-700 leading-relaxed">
                As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders.
              </p>
            </div>
          </div>
        </div>

        {/* History Section - Full Width with Timeline Design */}
        <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-2xl shadow-xl p-8 md:p-12 mb-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500"></div>
          <div className="flex items-center mb-8">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-700">Our History</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mr-6 shadow-md">
                <span className="text-primary-700 font-bold text-lg">2002</span>
              </div>
              <div className="flex-grow">
                <p className="text-gray-700 leading-relaxed">
                  Cupang National High School started its operation as an extension of Antipolo National High School S.Y. 2002-2003. There were 8 teachers and 465 enrollees. FJ Ville Corp. donated the school site to the City government with the land size of 2,466 sq. m. A building of four classrooms was constructed through the effort of the City Mayor Angeline C. Gatlabayan.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mr-6 shadow-lg">
                <span className="text-white font-bold text-lg">2003</span>
              </div>
              <div className="flex-grow">
                <p className="text-gray-700 leading-relaxed">
                  On the summer of 2003, the Teacher-In-Charge of the school worked-out on the turn over of the deed of donation from the City government in favor of the Department of Education. She also requested for the separation of Cupang Ext. from Antipolo National High School to be an independent school. After five months of completing all the requirements, the Director of Region IV-A CALABARZON signed the papers on July 25, 2003. Cupang Ext. became an independent school, now called Cupang National High School.
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Organizational Chart */}
          <section className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
                Organizational Chart
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                The Organizational Chart of Cupang National High School shows the structure of leadership, teachers, and staff working together to provide quality education and support for students.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                
                {/* Image */}
                <img
                  src="/images/organization.jpg"
                  alt="Organizational Chart"
                  className="max-w-full h-auto transform group-hover:scale-110 transition-transform duration-500"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Hover Text */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-lg md:text-xl font-semibold text-center px-6">
                    Cupang National High School Organizational Structure
                  </p>
                </div>

              </div>
            </div>
          </section>

        {
        /* School Gallery
        <section className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">School Gallery</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">
              Take a look at some highlights from Cupang National High School.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <img 
                  src="/images/school4.jpg" 
                  alt={`School ${i}`}
                  className="w-full h-48 md:h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>  
        </section> */}

        {/* School Gallery
        <section className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
              School Gallery
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">
              Take a look at some highlights from Cupang National High School.
            </p>
          </div>

          {/* Gallery Images */}
          {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              "/images/school1.jpg",
              "/images/school2.jpg",
              "/images/school3.jpg",
              "/images/school4.jpg",
              "/images/school5.jpg",
              "/images/school6.jpg",
            ].map((img, index) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={img}
                  alt={`School ${index + 1}`}
                  className="w-full h-48 md:h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </section> */}

        {/* School Gallery */}
        <section className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-xl p-8 md:p-12 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">
              School Gallery
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">
              Take a look at some highlights from Cupang National High School.
            </p>
          </div>

          {/* Gallery Images */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { src: "/images/campus.jpg", text: "School Campus" },
              { src: "/images/activities.jpg", text: "Classroom Activities" },
              { src: "/images/events.jpg", text: "School Events" },
              { src: "/images/programs.jpg", text: "Student Programs" },
              { src: "/images/facilities.jpg", text: "Facilities" },
              { src: "/images/excellence.jpg", text: "Academic Excellence" },
            ].map((item, index) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={item.src}
                  alt={item.text}
                  className="w-full h-48 md:h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Hover Text */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-lg md:text-xl font-semibold text-center px-4">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* School Information */}
        <section className="relative bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full -mr-32 -mt-32 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-200 rounded-full -ml-24 -mb-24 opacity-30"></div>
          
          <div className="relative">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-4">School Information</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 bg-primary-50 p-5 rounded-xl hover:bg-primary-100 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-primary-700 mb-1">Address</p>
                  <p className="text-gray-700">Brgy. Cupang, Antipolo City, Rizal</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-primary-50 p-5 rounded-xl hover:bg-primary-100 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-primary-700 mb-1">Established</p>
                  <p className="text-gray-700">2003</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-primary-50 p-5 rounded-xl hover:bg-primary-100 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-primary-700 mb-1">School ID</p>
                  <p className="text-gray-700">301420</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-primary-50 p-5 rounded-xl hover:bg-primary-100 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-primary-700 mb-1">Curriculum</p>
                  <p className="text-gray-700">K to 12 Basic Education Program for Junior High School (Grades 7–10)</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default About;

// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import PageBackground from '../components/PageBackground'

// const About = () => {
//   return (
//     <PageBackground>
//       <Navbar />
      
//       <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
//         {/* About Sections */}
//         <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
//           <section className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
//             <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4">History</h2>
//             <p className="text-gray-700 leading-relaxed">
//               Cupang National High School started its operation as an extension of Antipolo National High School S.Y. 2002-2003. There were 8 teachers and 465 enrollees. FJ Ville Corp. donated the school site to the City government with the land size of 2,466 sq. m. A building of four classrooms was constructed through the effort of the City Mayor Angeline C. Gatlabayan.
//             </p>
//             <p className="text-gray-700 leading-relaxed mt-4">
//               On the summer of 2003, the Teacher-In-Charge of the school worked-out on the turn over of the deed of donation from the City government in favor of the Department of Education. She also requested for the separation of Cupang Ext. from Antipolo National High School to be an independent school. After five months of completing all the requirements, the Director of Region IV-A CALABARZON signed the papers on July 25, 2003. Cupang Ext. became an independent school, now called Cupang National High School.
//             </p>
//           </section>

//           <section className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
//             <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4">Mission</h2>
//             <p className="text-gray-700 leading-relaxed">
//               To protect and promote the rights of every Filipino to quality, equitable culture-based, and complete basic education where students learn in a child-friendly, gender-sensitive, safe, and motivating environment.
//             </p>
//             <p className="text-gray-700 leading-relaxed mt-4">
//               Teachers facilitate learning and constantly nurture every learner. Administrators and staff, as stewards of the institution, ensure an enabling and supportive environment for effective learning to happen. Family, community, and other stakeholders are actively engaged and share responsibility for developing life-long learners.
//             </p>
//           </section>

//           <section className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
//             <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4">Vision</h2>
//             <p className="text-gray-700 leading-relaxed">
//               We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation.
//             </p>
//             <p className="text-gray-700 leading-relaxed mt-4">
//               As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders.
//             </p>
//           </section>
//         </div>

//         {/* Organizational Chart */}
//         <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-12">
//           <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4 text-center">Organizational Chart</h2>
//           <p className="text-gray-700 text-center mb-6">
//             The Organizational Chart of Cupang National High School shows the structure of leadership, teachers, and staff working together to provide quality education and support for students.
//           </p>
//           <div className="flex justify-center">
//             <img 
//               src="/images/org_chart.jpg" 
//               alt="Organizational Chart" 
//               className="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow"
//             />
//           </div>
//         </section>

//         {/* School Gallery */}
//         <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-12">
//           <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4 text-center">School Gallery</h2>
//           <p className="text-gray-700 text-center mb-6">
//             Take a look at some highlights from Cupang National High School.
//           </p>
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
//             {[1, 2, 3, 4, 5, 6].map((i) => (
//               <img 
//                 key={i}
//                 src="/images/school4.jpg" 
//                 alt={`School ${i}`}
//                 className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
//               />
//             ))}
//           </div>
//         </section>

//         {/* School Information */}
//         <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-3xl mx-auto">
//           <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 text-center">School Information</h2>
//           <div className="space-y-3 text-gray-700">
//             <p><strong>Address: </strong>Brgy. Cupang, Antipolo City, Rizal</p>
//             <p><strong>Established: </strong>2003</p>
//             <p><strong>School ID: </strong>301420</p>
//             <p><strong>Curriculum: </strong>K to 12 Basic Education Program for Junior High School (Grades 7–10)</p>
//           </div>
//         </section>
//       </main>

//       <Footer />
//     </PageBackground>
//   )
// }

// export default About