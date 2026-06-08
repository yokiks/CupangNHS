import { useEffect, useState } from 'react'
import axios from 'axios'

const formatGradeSection = (gradeLevel, section) => {
  if (gradeLevel && section) return `Grade ${gradeLevel} - ${section}`
  if (gradeLevel) return `Grade ${gradeLevel}`
  return section || 'N/A'
}

const EnrollmentValidationHistory = ({ studentId }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId) return

    setLoading(true)
    setError('')
    axios
      .get(`/api/students/${studentId}/enrollment-history`)
      .then((res) => setHistory(res.data))
      .catch(() => setError('Unable to load enrollment validation history.'))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading enrollment history...</div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">{error}</div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No approved enrollment validations on record.</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th className="py-3 pr-4 font-semibold">School Year</th>
            <th className="py-3 pr-4 font-semibold">Grade & Section</th>
            <th className="py-3 pr-4 font-semibold">School ID</th>
            <th className="py-3 pr-4 font-semibold">Validation Date</th>
            <th className="py-3 font-semibold">Approved By</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record) => (
            <tr key={record.id} className="border-b border-gray-100 align-top">
              <td className="py-4 pr-4 text-gray-800">
                {record.schoolYear?.label || 'N/A'}
              </td>
              <td className="py-4 pr-4 text-gray-800">
                {formatGradeSection(record.gradeLevel, record.section)}
              </td>
              <td className="py-4 pr-4">
                {record.schoolIdProofUrl ? (
                  <a
                    href={record.schoolIdProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-700 font-medium hover:underline"
                  >
                    {record.schoolIdProofName || 'View School ID'}
                  </a>
                ) : (
                  <span className="text-gray-500">{record.schoolIdProofName || 'N/A'}</span>
                )}
              </td>
              <td className="py-4 pr-4 text-gray-700 whitespace-nowrap">
                {new Date(record.validatedAt).toLocaleString()}
              </td>
              <td className="py-4 text-gray-700">
                {record.approvedBy.firstName} {record.approvedBy.lastName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EnrollmentValidationHistory
