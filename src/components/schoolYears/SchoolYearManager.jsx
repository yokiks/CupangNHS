import { useEffect, useState } from 'react'
import axios from 'axios'
import { useToast } from '../../context/ToastContext'

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-700',
}

const formatActivationMessage = (data, prefix = 'School year activated.') => {
  const revalidationCount = data?.revalidationCount || 0
  const graduatedCount = data?.graduatedCount || 0
  const details = []

  if (revalidationCount > 0) {
    details.push(`${revalidationCount} student${revalidationCount === 1 ? '' : 's'} marked for revalidation`)
  }
  if (graduatedCount > 0) {
    details.push(`${graduatedCount} Grade 10 student${graduatedCount === 1 ? '' : 's'} marked as graduated`)
  }

  return details.length ? `${prefix} ${details.join('; ')}.` : prefix
}

const getSchoolYearStart = (label) => {
  const match = String(label || '').match(/^(\d{4})-(\d{4})$/)
  return match ? Number.parseInt(match[1], 10) : null
}

const formatCount = (value) => Number(value || 0).toLocaleString()

const renderCountRows = (data = {}) => {
  const entries = Object.entries(data)
  if (!entries.length) return '<tr><td colspan="2">No records</td></tr>'
  return entries.map(([label, count]) => `
    <tr>
      <td>${String(label).replaceAll('_', ' ')}</td>
      <td>${formatCount(count)}</td>
    </tr>
  `).join('')
}

const openSchoolYearReport = (data) => {
  if (!data) return

  const reportHtml = `
    <html>
      <head>
        <title>School Year Report - ${data.schoolYear.label}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; color: #111827; }
          h1 { color: #047857; border-bottom: 3px solid #16a34a; padding-bottom: 10px; }
          h2 { color: #047857; margin-top: 28px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
          th, td { border: 1px solid #d1d5db; padding: 9px; text-align: left; }
          th { background: #16a34a; color: white; }
          tr:nth-child(even) { background: #f9fafb; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
          .stat { border: 2px solid #bbf7d0; border-radius: 8px; padding: 14px; background: #f0fdf4; }
          .stat strong { display: block; color: #4b5563; font-size: 12px; }
          .stat span { display: block; color: #047857; font-size: 26px; font-weight: 700; margin-top: 4px; }
          .meta { color: #4b5563; font-size: 13px; line-height: 1.6; }
          .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 12px; }
          @media print { body { padding: 20px; } button, .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="position:fixed;top:15px;right:15px;z-index:1000;display:flex;gap:8px">
          <button onclick="window.print()" style="padding:8px 15px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;background:#16a34a;color:white">Print</button>
          <button onclick="window.close()" style="padding:8px 15px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;background:#dc2626;color:white">Close</button>
        </div>

        <h1>School Year Summary Report</h1>
        <div class="meta">
          <p><strong>School Year:</strong> ${data.schoolYear.label} (${data.schoolYear.status})</p>
          <p><strong>Report Date:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
          <p><strong>Concern Matching:</strong> Direct school-year tag${data.dateRange ? `, with date fallback for older untagged records (${new Date(data.dateRange.start).toLocaleDateString()} to ${new Date(data.dateRange.end).toLocaleDateString()})` : ''}</p>
        </div>

        <div class="stats">
          <div class="stat"><strong>Total Validations</strong><span>${formatCount(data.summary.totalValidations)}</span></div>
          <div class="stat"><strong>Validated Students</strong><span>${formatCount(data.summary.validatedStudents)}</span></div>
          <div class="stat"><strong>Concerns Submitted</strong><span>${formatCount(data.summary.concerns.total)}</span></div>
          <div class="stat"><strong>Approved Revalidations</strong><span>${formatCount(data.summary.revalidationsByStatus.approved)}</span></div>
        </div>

        <h2>Current Student Status Linked to This School Year</h2>
        <table><tr><th>Status</th><th>Count</th></tr>${renderCountRows(data.summary.currentStudentsByStatus)}</table>

        <h2>Revalidation Request Summary</h2>
        <table><tr><th>Status</th><th>Count</th></tr>${renderCountRows(data.summary.revalidationsByStatus)}</table>

        <h2>Concern Status Summary</h2>
        <table><tr><th>Status</th><th>Count</th></tr>${renderCountRows(data.summary.concerns.byStatus)}</table>

        <h2>Concern Category Summary</h2>
        <table><tr><th>Category</th><th>Count</th></tr>${renderCountRows(data.summary.concerns.byCategory)}</table>

        <h2>Students by Grade Level</h2>
        <table>
          <tr><th>Grade Level</th><th>Count</th></tr>
          ${data.gradeBreakdown.length ? data.gradeBreakdown.map(row => `<tr><td>${row.gradeLevel || 'N/A'}</td><td>${formatCount(row.count)}</td></tr>`).join('') : '<tr><td colspan="2">No records</td></tr>'}
        </table>

        <h2>Students by Grade and Section</h2>
        <table>
          <tr><th>Grade Level</th><th>Section</th><th>Count</th></tr>
          ${data.sectionBreakdown.length ? data.sectionBreakdown.map(row => `<tr><td>${row.gradeLevel || 'N/A'}</td><td>${row.section || 'N/A'}</td><td>${formatCount(row.count)}</td></tr>`).join('') : '<tr><td colspan="3">No records</td></tr>'}
        </table>

        <h2>Enrollment Validation Records</h2>
        <table>
          <tr><th>Student</th><th>LRN</th><th>Grade / Section</th><th>Validated At</th><th>Approved By</th></tr>
          ${data.validations.length ? data.validations.map(row => `
            <tr>
              <td>${row.studentName}</td>
              <td>${row.lrn || 'N/A'}</td>
              <td>${row.gradeLevel || 'N/A'} - ${row.section || 'N/A'}</td>
              <td>${new Date(row.validatedAt).toLocaleString()}</td>
              <td>${row.approvedBy || 'N/A'}</td>
            </tr>
          `).join('') : '<tr><td colspan="5">No records</td></tr>'}
        </table>

        <h2>Concerns Submitted During This School Year</h2>
        <table>
          <tr><th>ID</th><th>Title</th><th>Student</th><th>Category</th><th>Status</th><th>Date</th><th>Source</th></tr>
          ${data.concerns.length ? data.concerns.map(row => `
            <tr>
              <td>${row.id}</td>
              <td>${row.title}</td>
              <td>${row.studentName}</td>
              <td>${row.category}</td>
              <td>${row.status}</td>
              <td>${new Date(row.createdAt).toLocaleDateString()}</td>
              <td>${row.schoolYearLinked ? 'Linked' : 'Date fallback'}</td>
            </tr>
          `).join('') : '<tr><td colspan="7">No concerns found for this school year</td></tr>'}
        </table>

        <div class="footer">
          <p><strong>Confidential Document</strong> - System-generated school year report</p>
        </div>
      </body>
    </html>
  `

  const reportWindow = window.open('', '_blank')
  reportWindow.document.write(reportHtml)
  reportWindow.document.close()
}

const SchoolYearManager = () => {
  const [schoolYears, setSchoolYears] = useState([])
  const [activeSchoolYear, setActiveSchoolYear] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [reportLoadingId, setReportLoadingId] = useState(null)
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [creating, setCreating] = useState(false)
  const { showToast } = useToast()

  const fetchSchoolYears = async () => {
    setLoading(true)
    try {
      const [listRes, activeRes] = await Promise.all([
        axios.get('/api/school-years'),
        axios.get('/api/school-years/active'),
      ])
      setSchoolYears(listRes.data)
      setActiveSchoolYear(activeRes.data.schoolYear)
    } catch (error) {
      showToast('Unable to load school years. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchoolYears()
  }, [])

  const handleStartYearChange = (value) => {
    setStartYear(value)
    if (/^\d{4}$/.test(value)) {
      setEndYear(String(Number(value) + 1))
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!startYear || !endYear) {
      showToast('Please enter both start and end years.', 'error')
      return
    }

    const label = `${startYear}-${endYear}`
    setCreating(true)
    try {
      const createRes = await axios.post('/api/school-years', { label })
      const createdYear = createRes.data.schoolYear
      const activateRes = await axios.patch(`/api/school-years/${createdYear.id}/activate`)
      showToast(formatActivationMessage(activateRes.data, 'School year created and activated.'), 'success')
      setStartYear('')
      setEndYear('')
      fetchSchoolYears()
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to create school year.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleActivate = async (id) => {
    setActionLoadingId(id)
    try {
      const activateRes = await axios.patch(`/api/school-years/${id}/activate`)
      showToast(formatActivationMessage(activateRes.data), 'success')
      fetchSchoolYears()
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to activate school year.', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleArchive = async (id) => {
    setActionLoadingId(id)
    try {
      await axios.patch(`/api/school-years/${id}/archive`)
      showToast('School year archived.', 'success')
      fetchSchoolYears()
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to archive school year.', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleViewReport = async (id) => {
    setReportLoadingId(id)
    try {
      const res = await axios.get(`/api/school-years/${id}/report`)
      openSchoolYearReport(res.data)
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to generate school year report.', 'error')
    } finally {
      setReportLoadingId(null)
    }
  }

  const activeStart = getSchoolYearStart(activeSchoolYear?.label)
  const latestStart = Math.max(
    ...schoolYears.map((year) => getSchoolYearStart(year.label)).filter(Number.isInteger),
    0
  )

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-primary-700">Current School Year</h2>
        <p className="text-gray-600 mt-1">Only one school year can be active at a time.</p>
        <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 px-5 py-4">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : activeSchoolYear ? (
            <p className="text-xl font-semibold text-primary-800">
              {activeSchoolYear.label} <span className="text-green-700">(Active)</span>
            </p>
          ) : (
            <p className="text-gray-600">No active school year. Create one and activate it to get started.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-primary-700">Create School Year</h2>
        <p className="text-gray-600 mt-1">Creating a new school year activates it and starts annual revalidation.</p>
        <form onSubmit={handleCreate} className="mt-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 mb-1">
              Start Year
            </label>
            <input
              id="startYear"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={startYear}
              onChange={(e) => handleStartYearChange(e.target.value.replace(/\D/g, ''))}
              placeholder="2026"
              className="w-full rounded-xl border border-gray-300 px-4 py-2"
            />
          </div>
          <div className="flex-1 w-full">
            <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 mb-1">
              End Year
            </label>
            <input
              id="endYear"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={endYear}
              onChange={(e) => setEndYear(e.target.value.replace(/\D/g, ''))}
              placeholder="2027"
              className="w-full rounded-xl border border-gray-300 px-4 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-semibold"
          >
            {creating ? 'Creating...' : 'Create & Activate'}
          </button>
        </form>
        {startYear && endYear && (
          <p className="mt-3 text-sm text-gray-500">
            Preview: <span className="font-semibold text-gray-700">{startYear}-{endYear}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-primary-700">All School Years</h2>
        <p className="text-gray-600 mt-1">
          Past school years are archived for records and cannot be reactivated.
        </p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading school years...</div>
        ) : schoolYears.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No school years yet.</div>
        ) : (
          <div className="mt-6 space-y-4">
            {schoolYears.map((year) => (
              (() => {
                const yearStart = getSchoolYearStart(year.label)
                const canActivate = year.status !== 'active' &&
                  yearStart === latestStart &&
                  (!Number.isInteger(activeStart) || yearStart > activeStart)
                return (
              <div
                key={year.id}
                className="border border-gray-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{year.label}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${STATUS_STYLES[year.status]}`}>
                      {year.status}
                    </span>
                    {!canActivate && year.status !== 'active' && (
                      <span className="text-xs font-medium text-gray-500">View-only archived year</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewReport(year.id)}
                    disabled={reportLoadingId === year.id}
                    className="px-4 py-2 bg-white text-primary-700 rounded-xl border border-primary-200 hover:bg-primary-50 disabled:opacity-50"
                  >
                    {reportLoadingId === year.id ? 'Loading...' : 'View Report'}
                  </button>
                  {year.status !== 'active' && canActivate && (
                    <button
                      type="button"
                      onClick={() => handleActivate(year.id)}
                      disabled={actionLoadingId === year.id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
                    >
                      {actionLoadingId === year.id ? 'Processing...' : 'Activate'}
                    </button>
                  )}
                  {year.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(year.id)}
                      disabled={actionLoadingId === year.id}
                      className="px-4 py-2 bg-white text-primary-700 rounded-xl border border-primary-200 hover:bg-primary-50 disabled:opacity-50"
                    >
                      {actionLoadingId === year.id ? 'Processing...' : 'Archive'}
                    </button>
                  )}
                </div>
              </div>
                )
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SchoolYearManager
