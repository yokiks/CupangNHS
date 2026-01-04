import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageBackground from '../components/PageBackground'
import axios from 'axios'

const Dashboard = () => {
  const { user } = useAuth()
  const [concerns, setConcerns] = useState([])
  const [filteredConcerns, setFilteredConcerns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    files: []
  })
  
  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchConcerns()
  }, [statusFilter, categoryFilter, sortBy, sortOrder])

  useEffect(() => {
    handleSearch()
  }, [searchQuery, concerns])

  const fetchConcerns = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const res = await axios.get(`/api/concerns?${params.toString()}`)
      setConcerns(res.data)
      setFilteredConcerns(res.data)
    } catch (error) {
      console.error('Error fetching concerns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredConcerns(concerns)
      return
    }

    const filtered = concerns.filter(concern => 
      concern.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      concern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user?.role === 'guidance_counselor' && 
        (`${concern.firstName} ${concern.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.studentId?.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    setFilteredConcerns(filtered)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setFormData({ ...formData, files: files })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Check if there are files to upload
      if (formData.files.length > 0) {
        // Use FormData for file uploads
        const submitData = new FormData()
        submitData.append('title', formData.title)
        submitData.append('description', formData.description)
        submitData.append('category', formData.category)
        
        formData.files.forEach((file) => {
          submitData.append('files', file)
        })

        await axios.post('/api/concerns', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        // Use JSON for no files
        await axios.post('/api/concerns', {
          title: formData.title,
          description: formData.description,
          category: formData.category
        })
      }
      
      setFormData({ title: '', description: '', category: 'academic', files: [] })
      setShowForm(false)
      fetchConcerns()
      alert('Concern submitted successfully!')
    } catch (error) {
      console.error('Error submitting concern:', error)
      console.error('Error details:', error.response?.data)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to submit concern. Please try again.'
      alert(errorMsg)
    }
  }

  const handleStatusUpdate = async (concernId, newStatus) => {
    try {
      await axios.patch(`/api/concerns/${concernId}`, { status: newStatus })
      fetchConcerns()
    } catch (error) {
      alert('Failed to update status. Please try again.')
    }
  }

  const handleDelete = async (concernId) => {
    if (!window.confirm('Are you sure you want to delete this concern?')) return
    
    try {
      await axios.delete(`/api/concerns/${concernId}`)
      fetchConcerns()
      alert('Concern deleted successfully!')
    } catch (error) {
      alert('Failed to delete concern. Please try again.')
    }
  }

  const handleGenerateReport = async () => {
    try {
      const res = await axios.get('/api/concerns/report')
      const data = res.data

      const reportWindow = window.open('', '_blank')
      reportWindow.document.write(`
        <html>
          <head>
            <title>Overall Concerns Report - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
              h1 { color: #16a34a; border-bottom: 3px solid #16a34a; padding-bottom: 10px; }
              h2 { color: #047857; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #16a34a; color: white; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .stats { margin: 20px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
              .stat-box { padding: 15px; border: 2px solid #16a34a; border-radius: 8px; text-align: center; }
              .stat-box strong { display: block; font-size: 14px; color: #666; margin-bottom: 5px; }
              .stat-box .number { font-size: 28px; font-weight: bold; color: #16a34a; }
              .header { text-align: center; margin-bottom: 30px; }
              .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
              @media print { 
                body { padding: 20px; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>STUDENT CONCERNS - OVERALL SYSTEM REPORT</h1>
              <p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
            </div>
            
            <div class="stats">
              <div class="stat-box">
                <strong>Total Concerns</strong>
                <div class="number">${data.summary.total}</div>
              </div>
              <div class="stat-box">
                <strong>Pending</strong>
                <div class="number">${data.summary.byStatus.pending || 0}</div>
              </div>
              <div class="stat-box">
                <strong>Read</strong>
                <div class="number">${data.summary.byStatus.read || 0}</div>
              </div>
              <div class="stat-box">
                <strong>In Review</strong>
                <div class="number">${data.summary.byStatus.in_review || 0}</div>
              </div>
              <div class="stat-box">
                <strong>Resolved</strong>
                <div class="number">${data.summary.byStatus.resolved || 0}</div>
              </div>
            </div>

            <h2>Category Breakdown</h2>
            <table>
              <tr>
                <th>Category</th>
                <th>Count</th>
              </tr>
              <tr><td>Academic</td><td>${data.summary.byCategory?.academic || 0}</td></tr>
              <tr><td>Behavioral</td><td>${data.summary.byCategory?.behavioral || 0}</td></tr>
              <tr><td>General</td><td>${data.summary.byCategory?.general || 0}</td></tr>
              <tr><td>Safety</td><td>${data.summary.byCategory?.safety || 0}</td></tr>
              <tr><td>Other</td><td>${data.summary.byCategory?.other || 0}</td></tr>
            </table>

            <h2>All Concerns</h2>
            <table>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Student</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
              ${data.concerns.map(c => `
                <tr>
                  <td>${c.id}</td>
                  <td>${c.title}</td>
                  <td>${c.firstName} ${c.lastName}</td>
                  <td>${c.category}</td>
                  <td>${c.status}</td>
                  <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </table>

            <div class="footer">
              <p><strong>Confidential Document</strong></p>
              <p>This is a system-generated report</p>
            </div>
          </body>
        </html>
      `)
      reportWindow.document.close()
      reportWindow.print()
    } catch (error) {
      alert('Failed to generate report. Please try again.')
    }
  }

  const handleGenerateSpecificReport = async (concern) => {
    try {
      // Try to fetch detailed data, but proceed even if it fails
      let detailData = {
        gradeSection: 'N/A',
        files: [],
        statusHistory: [],
        adminNotes: '',
        findings: '',
        recommendations: '',
        finalSummary: '',
        followUpRequired: false
      }

      try {
        const res = await axios.get(`/api/concerns/${concern.id}/details`)
        detailData = { ...detailData, ...res.data }
      } catch (apiError) {
        console.warn('Could not fetch detailed data, using basic concern info:', apiError)
        // Continue with default values
      }

      const reportWindow = window.open('', '_blank')
    reportWindow.document.write(`
      <html>
        <head>
          <title>Concern Report - ${concern.title}</title>
          <style>
            @page { 
              size: A4; 
              margin: 1cm; 
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              margin: 0;
              font-size: 12px;
              line-height: 1.5;
              max-width: 1200px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #16a34a; 
              padding-bottom: 10px; 
              margin-bottom: 20px; 
            }
            .header h1 { 
              color: #16a34a; 
              font-size: 24px; 
              margin: 5px 0; 
            }
            .header p {
              margin: 5px 0;
              font-size: 12px;
            }
            .section { 
              margin: 15px 0; 
              page-break-inside: avoid; 
            }
            .section-title { 
              background-color: #16a34a; 
              color: white; 
              padding: 8px 12px; 
              font-weight: bold; 
              font-size: 14px; 
              margin-bottom: 8px; 
            }
            .info-grid { 
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px 15px;
              margin-bottom: 10px;
            }
            .info-row { 
              display: flex;
              gap: 10px;
              padding: 6px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label { 
              font-weight: bold; 
              color: #047857; 
              min-width: 150px;
              font-size: 12px;
            }
            .info-value {
              flex: 1;
              font-size: 12px;
            }
            .description-box { 
              border: 1px solid #ddd; 
              padding: 10px; 
              background-color: #f9f9f9; 
              margin: 10px 0; 
              font-size: 12px;
              max-height: 100px;
              overflow: hidden;
            }
            .timeline-item { 
              padding: 8px; 
              border-left: 3px solid #16a34a; 
              margin-left: 15px; 
              margin-bottom: 8px; 
              font-size: 12px;
            }
            .editable-section { 
              border: 2px dashed #ddd; 
              padding: 10px; 
              margin: 10px 0; 
              min-height: 60px; 
              background-color: #fafafa; 
              font-size: 12px;
              cursor: text;
            }
            .editable-section:focus {
              outline: 2px solid #16a34a;
              background-color: white;
            }
            .signature-section { 
              margin-top: 20px; 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 30px; 
            }
            .signature-line { 
              border-top: 2px solid #000; 
              margin-top: 40px; 
              padding-top: 5px; 
              text-align: center;
              font-size: 12px;
            }
            .file-item { 
              padding: 5px; 
              background-color: #f0f0f0; 
              margin: 5px 0; 
              font-size: 11px;
            }
            .buttons { 
              position: fixed; 
              top: 15px; 
              right: 15px; 
              z-index: 1000;
              display: flex;
              gap: 8px;
            }
            .btn { 
              padding: 8px 15px; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer; 
              font-weight: bold;
              font-size: 12px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .btn-view {
              background-color: #3b82f6;
              color: white;
            }
            .btn-view:hover {
              background-color: #2563eb;
            }
            .btn-print { 
              background-color: #16a34a; 
              color: white; 
            }
            .btn-print:hover {
              background-color: #15803d;
            }
            .btn-save {
              background-color: #f59e0b;
              color: white;
            }
            .btn-save:hover {
              background-color: #d97706;
            }
            .btn-close { 
              background-color: #dc2626; 
              color: white; 
            }
            .btn-close:hover {
              background-color: #b91c1c;
            }
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px;
            }
            .footer-note {
              margin-top: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print { 
              body {
                padding: 20px;
                font-size: 12px;
              }
              .buttons { 
                display: none !important; 
              }
              .editable-section {
                border-style: solid;
                cursor: default;
              }
              @page {
                size: A4;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="buttons">
            <button class="btn btn-view" onclick="toggleFullView()">📋 View Full Details</button>
            <button class="btn btn-save" onclick="saveReport()">💾 Save Changes</button>
            <button class="btn btn-print" onclick="window.print()">🖨️ Print</button>
            <button class="btn btn-close" onclick="window.close()">✕ Close</button>
          </div>

          <div class="header">
            <h1>STUDENT CONCERN REPORT</h1>
            <p><strong>Report ID:</strong> CR-${concern.id}-${new Date().getFullYear()} | <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <!-- Student Information Section -->
          <div class="section">
            <div class="section-title">I. STUDENT INFORMATION</div>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-label">Student Name:</div>
                <div class="info-value">${concern.firstName} ${concern.lastName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Student ID/LRN:</div>
                <div class="info-value">${concern.studentId || 'N/A'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Grade/Section:</div>
                <div class="info-value">${detailData.gradeSection || 'N/A'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Date Submitted:</div>
                <div class="info-value">${new Date(concern.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

            <!-- Concern Details Section -->
              <div class="section">
                <div class="section-title">II. CONCERN DETAILS</div>

                <div class="info-row">
                  <div class="info-label">Title:</div>
                  <div class="info-value"><strong>${concern.title}</strong></div>
                </div>

                <div class="info-row">
                  <div class="info-label">Category:</div>
                  <div class="info-value" style="text-transform: capitalize;">${concern.category}</div>
                </div>

                <div class="description-box" id="fullDescription" style="max-height: 100px; overflow: hidden;">
                  <strong>Description:</strong> ${concern.description}
                </div>

                ${detailData.files && detailData.files.length > 0 ? `
                  <div style="margin-top: 10px; font-size: 12px;">
                    <strong>Attached Files (${detailData.files.length}):</strong>
                    ${detailData.files.slice(0, 3).map(f => `
                      <div class="file-item">📎 ${f.filename || f.name}</div>
                    `).join('')}
                    ${detailData.files.length > 3 ? `
                      <div class="file-item">... and ${detailData.files.length - 3} more</div>
                    ` : ''}
                  </div>
                ` : `
                  <p style="font-size: 12px; margin: 10px 0;"><em>No files attached</em></p>
                `}
              </div>
              
            <!-- Two Column Layout for Compact View -->
          <div class="two-column">
            <!-- Status Timeline -->
            <div class="section">
              <div class="section-title">III. STATUS TIMELINE</div>
              ${detailData.statusHistory && detailData.statusHistory.length > 0 ? 
                detailData.statusHistory.slice(-2).map(h => `
                  <div class="timeline-item">
                    <strong style="text-transform: capitalize;">${h.status.replace('_', ' ')}</strong><br>
                    ${new Date(h.timestamp).toLocaleDateString()}
                  </div>
                `).join('')
                :
                `
                  <div class="timeline-item">
                    <strong>Submitted</strong><br>
                    ${new Date(concern.createdAt).toLocaleDateString()}
                  </div>
                  <div class="timeline-item">
                    <strong style="text-transform: capitalize;">${concern.status.replace('_', ' ')}</strong><br>
                    ${new Date(concern.updatedAt).toLocaleDateString()}
                  </div>
                `
              }
            </div>

            <!-- Final Summary Quick View -->
            <div class="section">
              <div class="section-title">VII. FINAL SUMMARY</div>
              <div class="info-row">
                <div class="info-label">Status:</div>
                <div class="info-value">${concern.status === 'resolved' ? 'RESOLVED' : 'IN PROGRESS'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Follow-up:</div>
                <div class="info-value">
                  <select id="followUpSelect" onchange="updateFollowUp()" style="border: 1px solid #ddd; padding: 5px; border-radius: 3px; font-size: 12px;">
                    <option value="false" ${!detailData.followUpRequired ? 'selected' : ''}>No</option>
                    <option value="true" ${detailData.followUpRequired ? 'selected' : ''}>Yes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

            <!-- Editable Sections -->
          <div class="section">
            <div class="section-title">IV. COUNSELOR NOTES / REMARKS</div>
            <div class="editable-section" contenteditable="true" id="adminNotes">
              ${detailData.adminNotes || '[Click to edit - Add your notes and remarks here]'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">V. SUMMARY OF FINDINGS</div>
            <div class="editable-section" contenteditable="true" id="findings">
              ${detailData.findings || '[Click to edit - Document your findings and observations]'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">VI. RECOMMENDATIONS / ACTIONS</div>
            <div class="editable-section" contenteditable="true" id="recommendations">
              ${detailData.recommendations || '[Click to edit - List recommendations and actions taken]'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">CLOSING REMARKS</div>
            <div class="editable-section" contenteditable="true" id="finalSummary">
              ${detailData.finalSummary || '[Click to edit - Add final summary and closing remarks]'}
            </div>
          </div>

            <!-- Signature Section -->
          <div class="signature-section">
            <div>
              <div class="signature-line">
                Guidance Counselor<br>
                <strong>${user?.firstName || ''} ${user?.lastName || ''}</strong>
              </div>
            </div>
            <div>
              <div class="signature-line">
                Date<br>
                <strong>${new Date().toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

            <div class="footer-note">
            <p><strong>CONFIDENTIAL DOCUMENT</strong> - This report contains sensitive student information</p>
          </div>

          <script>
            let isFullView = false;

            function toggleFullView() {
              isFullView = !isFullView;
              const desc = document.getElementById('fullDescription');
              const btn = document.querySelector('.btn-view');
              
              if (isFullView) {
                desc.style.maxHeight = 'none';
                desc.style.overflow = 'visible';
                desc.style.whiteSpace = 'pre-wrap';
                btn.textContent = '📋 Collapse Details';
              } else {
                desc.style.maxHeight = '100px';
                desc.style.overflow = 'hidden';
                desc.style.whiteSpace = 'normal';
                btn.textContent = '📋 View Full Details';
              }
            }

            function updateFollowUp() {
              const select = document.getElementById('followUpSelect');
              console.log('Follow-up required:', select.value === 'true');
            }

            function saveReport() {
              const reportData = {
                concernId: ${concern.id},
                adminNotes: document.getElementById('adminNotes').innerText,
                findings: document.getElementById('findings').innerText,
                recommendations: document.getElementById('recommendations').innerText,
                finalSummary: document.getElementById('finalSummary').innerText,
                followUpRequired: document.getElementById('followUpSelect').value === 'true'
              };

              // Save to localStorage as backup
              localStorage.setItem('report_${concern.id}', JSON.stringify(reportData));
              
              // Here you would normally send this to your backend
              // Example: 
              // fetch('/api/concerns/${concern.id}/report', {
              //   method: 'PATCH',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify(reportData)
              // });

              alert('✅ Report saved! You can now print or close this window.');
              console.log('Saved report data:', reportData);
            }

            // Load saved data if exists
            window.onload = function() {
              const saved = localStorage.getItem('report_${concern.id}');
              if (saved) {
                const data = JSON.parse(saved);
                if (data.adminNotes && !data.adminNotes.includes('[Click to edit')) {
                  document.getElementById('adminNotes').innerText = data.adminNotes;
                }
                if (data.findings && !data.findings.includes('[Click to edit')) {
                  document.getElementById('findings').innerText = data.findings;
                }
                if (data.recommendations && !data.recommendations.includes('[Click to edit')) {
                  document.getElementById('recommendations').innerText = data.recommendations;
                }
                if (data.finalSummary && !data.finalSummary.includes('[Click to edit')) {
                  document.getElementById('finalSummary').innerText = data.finalSummary;
                }
                if (data.followUpRequired !== undefined) {
                  document.getElementById('followUpSelect').value = data.followUpRequired.toString();
                }
              }
            };

            // Auto-save every 30 seconds
            setInterval(function() {
              const reportData = {
                concernId: ${concern.id},
                adminNotes: document.getElementById('adminNotes').innerText,
                findings: document.getElementById('findings').innerText,
                recommendations: document.getElementById('recommendations').innerText,
                finalSummary: document.getElementById('finalSummary').innerText,
                followUpRequired: document.getElementById('followUpSelect').value === 'true',
                lastSaved: new Date().toISOString()
              };
              localStorage.setItem('report_${concern.id}', JSON.stringify(reportData));
            }, 30000);
          </script>
        </body>
      </html>
    `)
    reportWindow.document.close();
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Failed to generate specific report. Please try again.\\n\\nError: ' + (error.message || 'Unknown error'))
  }
}

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'read': 'bg-blue-100 text-blue-800',
      'in_review': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'read': 'Read',
      'in_review': 'In Review',
      'resolved': 'Resolved'
    }
    return labels[status] || status
  }

  const statusFlow = ['pending', 'read', 'in_review', 'resolved']

  return (
    <PageBackground>
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-gray-600">
            {user?.role === 'guidance_counselor' ? 'Manage student concerns' : 'Submit and track your concerns'}
          </p>
        </div>

        {user?.role === 'student' && (
          <div className="mb-8">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {showForm ? 'Cancel' : '+ Submit New Concern'}
            </button>

            {showForm && (
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-primary-600 mb-4">Submit a Concern</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="academic">Academic</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="general">General</option>
                      <option value="safety">Safety</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows="4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Attach Files (Photos, PDFs, Documents)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    {formData.files.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {formData.files.length} file(s) selected
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:shadow-lg transition"
                  >
                    Submit Concern
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-primary-600">
              {user?.role === 'guidance_counselor' ? 'All Concerns' : 'My Concerns'}
            </h2>
            
            {user?.role === 'guidance_counselor' && (
              <button
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                📊 Generate Overall Report
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by title, description, student name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters and Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="read">Read</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="behavioral">Behavioral</option>
                <option value="general">General</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="createdAt">Date Created</option>
                <option value="updatedAt">Last Updated</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="DESC">Newest First</option>
                <option value="ASC">Oldest First</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : filteredConcerns.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No concerns found.</p>
          ) : (
            <div className="space-y-4">
              {filteredConcerns.map((concern) => (
                <div 
                  key={concern.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => {
                    if (user?.role === 'guidance_counselor') {
                      handleGenerateSpecificReport(concern);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">{concern.title}</h3>
                      {user?.role === 'guidance_counselor' && (
                        <p className="text-sm text-gray-600">
                          Submitted by: {concern.firstName} {concern.lastName} 
                          {concern.studentId && ` (LRN: ${concern.studentId})`}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(concern.status)}`}>
                      {getStatusLabel(concern.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{concern.description}</p>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Category: <span className="font-semibold capitalize">{concern.category}</span></span>
                      <span>Created: {new Date(concern.createdAt).toLocaleDateString()}</span>
                    </div>
                    {user?.role === 'guidance_counselor' && (
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleGenerateSpecificReport(concern)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                        >
                          📄 View Full Report
                        </button>
                        {statusFlow.map((status, index) => {
                          const currentIndex = statusFlow.indexOf(concern.status)
                          if (index <= currentIndex) return null
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(concern.id, status)}
                              className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition"
                            >
                              Mark as {getStatusLabel(status)}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => handleDelete(concern.id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </PageBackground>
  )
}

export default Dashboard

// import { useState, useEffect } from 'react'
// import { useAuth } from '../context/AuthContext'
// import Navbar from '../components/Navbar'
// import Footer from '../components/Footer'
// import PageBackground from '../components/PageBackground'
// import axios from 'axios'

// const Dashboard = () => {
//   const { user } = useAuth()
//   const [concerns, setConcerns] = useState([])
//   const [filteredConcerns, setFilteredConcerns] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [showForm, setShowForm] = useState(false)
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     category: 'academic'
//   })
  
//   // Filter and sort states
//   const [statusFilter, setStatusFilter] = useState('all')
//   const [categoryFilter, setCategoryFilter] = useState('all')
//   const [sortBy, setSortBy] = useState('createdAt')
//   const [sortOrder, setSortOrder] = useState('DESC')

//   useEffect(() => {
//     fetchConcerns()
//   }, [statusFilter, categoryFilter, sortBy, sortOrder])

//   const fetchConcerns = async () => {
//     try {
//       const params = new URLSearchParams()
//       if (statusFilter !== 'all') params.append('status', statusFilter)
//       if (categoryFilter !== 'all') params.append('category', categoryFilter)
//       params.append('sortBy', sortBy)
//       params.append('sortOrder', sortOrder)

//       const res = await axios.get(`/api/concerns?${params.toString()}`)
//       setConcerns(res.data)
//       setFilteredConcerns(res.data)
//     } catch (error) {
//       console.error('Error fetching concerns:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     try {
//       await axios.post('/api/concerns', formData)
//       setFormData({ title: '', description: '', category: 'academic' })
//       setShowForm(false)
//       fetchConcerns()
//     } catch (error) {
//       alert('Failed to submit concern. Please try again.')
//     }
//   }

//   const handleStatusUpdate = async (concernId, newStatus) => {
//     try {
//       await axios.patch(`/api/concerns/${concernId}`, { status: newStatus })
//       fetchConcerns()
//     } catch (error) {
//       alert('Failed to update status. Please try again.')
//     }
//   }

//   const handleGenerateReport = async () => {
//     try {
//       const res = await axios.get('/api/concerns/report')
//       const data = res.data

//       // Create a printable report
//       const reportWindow = window.open('', '_blank')
//       reportWindow.document.write(`
//         <html>
//           <head>
//             <title>Concerns Report - ${new Date().toLocaleDateString()}</title>
//             <style>
//               body { font-family: Arial, sans-serif; padding: 20px; }
//               h1 { color: #16a34a; }
//               table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//               th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//               th { background-color: #16a34a; color: white; }
//               .stats { margin: 20px 0; }
//               .stat-box { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
//             </style>
//           </head>
//           <body>
//             <h1>Concerns Report</h1>
//             <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
            
//             <div class="stats">
//               <h2>Summary Statistics</h2>
//               <div class="stat-box">
//                 <strong>Total Concerns:</strong> ${data.summary.total}
//               </div>
//               <div class="stat-box">
//                 <strong>Pending:</strong> ${data.summary.byStatus.pending}
//               </div>
//               <div class="stat-box">
//                 <strong>Read:</strong> ${data.summary.byStatus.read}
//               </div>
//               <div class="stat-box">
//                 <strong>In Review:</strong> ${data.summary.byStatus.in_review}
//               </div>
//               <div class="stat-box">
//                 <strong>Resolved:</strong> ${data.summary.byStatus.resolved}
//               </div>
//             </div>

//             <h2>All Concerns</h2>
//             <table>
//               <tr>
//                 <th>ID</th>
//                 <th>Title</th>
//                 <th>Student</th>
//                 <th>Category</th>
//                 <th>Status</th>
//                 <th>Date</th>
//               </tr>
//               ${data.concerns.map(c => `
//                 <tr>
//                   <td>${c.id}</td>
//                   <td>${c.title}</td>
//                   <td>${c.firstName} ${c.lastName}</td>
//                   <td>${c.category}</td>
//                   <td>${c.status}</td>
//                   <td>${new Date(c.createdAt).toLocaleDateString()}</td>
//                 </tr>
//               `).join('')}
//             </table>
//           </body>
//         </html>
//       `)
//       reportWindow.document.close()
//       reportWindow.print()
//     } catch (error) {
//       alert('Failed to generate report. Please try again.')
//     }
//   }

//   const getStatusColor = (status) => {
//     const colors = {
//       'pending': 'bg-gray-100 text-gray-800',
//       'read': 'bg-blue-100 text-blue-800',
//       'in_review': 'bg-yellow-100 text-yellow-800',
//       'resolved': 'bg-green-100 text-green-800'
//     }
//     return colors[status] || 'bg-gray-100 text-gray-800'
//   }

//   const getStatusLabel = (status) => {
//     const labels = {
//       'pending': 'Pending',
//       'read': 'Read',
//       'in_review': 'In Review',
//       'resolved': 'Resolved'
//     }
//     return labels[status] || status
//   }

//   const statusFlow = ['pending', 'read', 'in_review', 'resolved']

//   return (
//     <PageBackground>
//       <Navbar />
      
//       <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
//         <div className="mb-8">
//           <h1 className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
//             Welcome, {user?.firstName} {user?.lastName}!
//           </h1>
//           <p className="text-gray-600">
//             {user?.role === 'guidance_counselor' ? 'Manage student concerns' : 'Submit and track your concerns'}
//           </p>
//         </div>

//         {user?.role === 'student' && (
//           <div className="mb-8">
//             <button
//               onClick={() => setShowForm(!showForm)}
//               className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
//             >
//               {showForm ? 'Cancel' : '+ Submit New Concern'}
//             </button>

//             {showForm && (
//               <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
//                 <h2 className="text-2xl font-bold text-primary-600 mb-4">Submit a Concern</h2>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Title *
//                     </label>
//                     <input
//                       type="text"
//                       value={formData.title}
//                       onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Category *
//                     </label>
//                     <select
//                       value={formData.category}
//                       onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                     >
//                       <option value="academic">Academic</option>
//                       <option value="behavioral">Behavioral</option>
//                       <option value="general">General</option>
//                       <option value="safety">Safety</option>
//                       <option value="other">Other</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Description *
//                     </label>
//                     <textarea
//                       value={formData.description}
//                       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                       rows="4"
//                       required
//                     />
//                   </div>
//                   <button
//                     type="submit"
//                     className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:shadow-lg transition"
//                   >
//                     Submit Concern
//                   </button>
//                 </form>
//               </div>
//             )}
//           </div>
//         )}

//         <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//             <h2 className="text-2xl font-bold text-primary-600">
//               {user?.role === 'guidance_counselor' ? 'All Concerns' : 'My Concerns'}
//             </h2>
            
//             {user?.role === 'guidance_counselor' && (
//               <button
//                 onClick={handleGenerateReport}
//                 className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
//               >
//                 📊 Generate Report
//               </button>
//             )}
//           </div>

//           {/* Filters and Sorting */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
//               >
//                 <option value="all">All Statuses</option>
//                 <option value="pending">Pending</option>
//                 <option value="read">Read</option>
//                 <option value="in_review">In Review</option>
//                 <option value="resolved">Resolved</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Category</label>
//               <select
//                 value={categoryFilter}
//                 onChange={(e) => setCategoryFilter(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
//               >
//                 <option value="all">All Categories</option>
//                 <option value="academic">Academic</option>
//                 <option value="behavioral">Behavioral</option>
//                 <option value="general">General</option>
//                 <option value="safety">Safety</option>
//                 <option value="other">Other</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
//               >
//                 <option value="createdAt">Date Created</option>
//                 <option value="updatedAt">Last Updated</option>
//                 <option value="title">Title</option>
//                 <option value="status">Status</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
//               <select
//                 value={sortOrder}
//                 onChange={(e) => setSortOrder(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
//               >
//                 <option value="DESC">Newest First</option>
//                 <option value="ASC">Oldest First</option>
//               </select>
//             </div>
//           </div>
          
//           {loading ? (
//             <div className="text-center py-8">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
//             </div>
//           ) : filteredConcerns.length === 0 ? (
//             <p className="text-gray-600 text-center py-8">No concerns found.</p>
//           ) : (
//             <div className="space-y-4">
//               {filteredConcerns.map((concern) => (
//                 <div key={concern.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="flex-1">
//                       <h3 className="text-xl font-semibold text-gray-800 mb-1">{concern.title}</h3>
//                       {user?.role === 'guidance_counselor' && (
//                         <p className="text-sm text-gray-600">
//                           Submitted by: {concern.firstName} {concern.lastName} 
//                           {concern.studentId && ` (LRN: ${concern.studentId})`}
//                         </p>
//                       )}
//                     </div>
//                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(concern.status)}`}>
//                       {getStatusLabel(concern.status)}
//                     </span>
//                   </div>
//                   <p className="text-gray-600 mb-3">{concern.description}</p>
//                   <div className="flex justify-between items-center">
//                     <div className="flex gap-4 text-sm text-gray-500">
//                       <span>Category: <span className="font-semibold capitalize">{concern.category}</span></span>
//                       <span>Created: {new Date(concern.createdAt).toLocaleDateString()}</span>
//                     </div>
//                     {user?.role === 'guidance_counselor' && (
//                       <div className="flex gap-2">
//                         {statusFlow.map((status, index) => {
//                           const currentIndex = statusFlow.indexOf(concern.status)
//                           if (index <= currentIndex) return null
//                           return (
//                             <button
//                               key={status}
//                               onClick={() => handleStatusUpdate(concern.id, status)}
//                               className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition"
//                             >
//                               Mark as {getStatusLabel(status)}
//                             </button>
//                           )
//                         })}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </main>

//       <Footer />
//     </PageBackground>
//   )
// }

// export default Dashboard