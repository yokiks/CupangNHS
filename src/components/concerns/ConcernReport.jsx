const STATUS_LABELS = {
  pending: 'Pending',
  read: 'Read',
  in_review: 'In Review',
  resolved: 'Resolved',
}

/**
 * Opens a new browser window with a print-friendly report rendered from
 * server-persisted data. Called from CounselorReviewPanel after save.
 */
export function openPrintableReport(data, counselorName) {
  if (!data) return

  const { concern, student, report, statusHistory, files } = data

  const reportHtml = `
    <html>
      <head>
        <title>Concern Report - ${concern.title}</title>
        <style>
          @page { size: A4; margin: 1cm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            margin: 0 auto;
            font-size: 12px;
            line-height: 1.5;
            max-width: 1200px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #16a34a;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 { color: #16a34a; font-size: 24px; margin: 5px 0; }
          .header p { margin: 5px 0; font-size: 12px; }
          .section { margin: 15px 0; page-break-inside: avoid; }
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
          .info-value { flex: 1; font-size: 12px; }
          .description-box {
            border: 1px solid #ddd;
            padding: 10px;
            background-color: #f9f9f9;
            margin: 10px 0;
            font-size: 12px;
            white-space: pre-wrap;
          }
          .timeline-item {
            padding: 8px;
            border-left: 3px solid #16a34a;
            margin-left: 15px;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .content-box {
            border: 1px solid #ddd;
            padding: 10px;
            margin: 10px 0;
            min-height: 40px;
            background-color: #fafafa;
            font-size: 12px;
            white-space: pre-wrap;
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
          .attachment-img {
            max-width: 100%;
            max-height: 400px;
            margin: 8px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            page-break-inside: avoid;
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
            body { padding: 20px; }
            button, .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="position:fixed;top:15px;right:15px;z-index:1000;display:flex;gap:8px">
          <button onclick="window.print()" style="padding:8px 15px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;background:#16a34a;color:white">Print</button>
          <button onclick="window.close()" style="padding:8px 15px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;background:#dc2626;color:white">Close</button>
        </div>

        <div class="header">
          <h1>STUDENT CONCERN REPORT</h1>
          <p><strong>Report ID:</strong> CR-${concern.id}-${new Date().getFullYear()} | <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
          <div class="section-title">I. STUDENT INFORMATION</div>
          <div class="info-grid">
            <div class="info-row">
              <div class="info-label">Student Name:</div>
              <div class="info-value">${student.firstName} ${student.lastName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Student ID/LRN:</div>
              <div class="info-value">${student.lrn || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Grade/Section:</div>
              <div class="info-value">${student.gradeLevel && student.section ? student.gradeLevel + ' - ' + student.section : 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Date Submitted:</div>
              <div class="info-value">${new Date(concern.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">II. CONCERN DETAILS</div>
          <div class="info-row">
            <div class="info-label">Title:</div>
            <div class="info-value"><strong>${concern.title}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">Category:</div>
            <div class="info-value" style="text-transform:capitalize">${concern.category}</div>
          </div>
          <div class="description-box"><strong>Description:</strong> ${concern.description}</div>
          ${files && files.length > 0
            ? `<div style="margin-top:10px;font-size:12px">
                <strong>Attached Files (${files.length}):</strong>
                ${files.map(f => {
                  if (f.mimeType && f.mimeType.startsWith('image/')) {
                    return `<div style="margin:8px 0">
                      <div class="file-item">${f.name}</div>
                      <img src="${f.url}" alt="${f.name}" class="attachment-img" />
                    </div>`
                  }
                  return `<div class="file-item">${f.name}</div>`
                }).join('')}
              </div>`
            : '<p style="font-size:12px;margin:10px 0"><em>No files attached</em></p>'
          }
        </div>

        <div class="section">
          <div class="section-title">III. STATUS TIMELINE</div>
          ${statusHistory && statusHistory.length > 0
            ? statusHistory.map(h => `
                <div class="timeline-item">
                  <strong style="text-transform:capitalize">${h.newStatus.replace('_', ' ')}</strong>
                  ${h.oldStatus ? '<span style="color:#666"> (from ' + h.oldStatus.replace('_', ' ') + ')</span>' : ''}
                  <br>${new Date(h.timestamp).toLocaleString()} &mdash; by ${h.changedBy}
                </div>
              `).join('')
            : `<div class="timeline-item">
                <strong>Submitted</strong><br>${new Date(concern.createdAt).toLocaleString()}
              </div>`
          }
        </div>

        <div class="section">
          <div class="section-title">IV. COUNSELOR NOTES / REMARKS</div>
          <div class="content-box">${report?.adminNotes || '<em>No notes recorded</em>'}</div>
        </div>

        <div class="section">
          <div class="section-title">V. SUMMARY OF FINDINGS</div>
          <div class="content-box">${report?.findings || '<em>No findings recorded</em>'}</div>
        </div>

        <div class="section">
          <div class="section-title">VI. RECOMMENDATIONS / ACTIONS</div>
          <div class="content-box">${report?.recommendations || '<em>No recommendations recorded</em>'}</div>
        </div>

        <div class="section">
          <div class="section-title">VII. CLOSING REMARKS</div>
          <div class="content-box">${report?.closingRemarks || '<em>No closing remarks</em>'}</div>
          <div class="info-row" style="margin-top:10px">
            <div class="info-label">Status:</div>
            <div class="info-value">${concern.status === 'resolved' ? 'RESOLVED' : 'IN PROGRESS'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Follow-up Required:</div>
            <div class="info-value">${report?.followUpRequired ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div class="signature-section">
          <div>
            <div class="signature-line">
              Guidance Counselor<br>
              <strong>${counselorName || ''}</strong>
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
      </body>
    </html>
  `

  const reportWindow = window.open('', '_blank')
  reportWindow.document.write(reportHtml)
  reportWindow.document.close()
}

/**
 * Opens a new browser window with the overall concerns summary report.
 */
export function openOverallReport(data) {
  if (!data) return

  const reportHtml = `
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
          @media print { body { padding: 20px; } button, .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="position:fixed;top:15px;right:15px;z-index:1000;display:flex;gap:8px">
          <button onclick="window.print()" style="padding:8px 15px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;background:#16a34a;color:white">Print</button>
          <button onclick="window.close()" style="padding:8px 15px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;background:#dc2626;color:white">Close</button>
        </div>

        <div class="header">
          <h1>STUDENT CONCERNS - OVERALL SYSTEM REPORT</h1>
          <p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
        </div>

        <div class="stats">
          <div class="stat-box"><strong>Total Concerns</strong><div class="number">${data.summary.total}</div></div>
          <div class="stat-box"><strong>Pending</strong><div class="number">${data.summary.byStatus.pending || 0}</div></div>
          <div class="stat-box"><strong>Read</strong><div class="number">${data.summary.byStatus.read || 0}</div></div>
          <div class="stat-box"><strong>In Review</strong><div class="number">${data.summary.byStatus.in_review || 0}</div></div>
          <div class="stat-box"><strong>Resolved</strong><div class="number">${data.summary.byStatus.resolved || 0}</div></div>
        </div>

        <h2>Category Breakdown</h2>
        <table>
          <tr><th>Category</th><th>Count</th></tr>
          <tr><td>Academic</td><td>${data.summary.byCategory?.academic || 0}</td></tr>
          <tr><td>Behavioral</td><td>${data.summary.byCategory?.behavioral || 0}</td></tr>
          <tr><td>General</td><td>${data.summary.byCategory?.general || 0}</td></tr>
          <tr><td>Safety</td><td>${data.summary.byCategory?.safety || 0}</td></tr>
          <tr><td>Other</td><td>${data.summary.byCategory?.other || 0}</td></tr>
        </table>

        <h2>All Concerns</h2>
        <table>
          <tr><th>ID</th><th>Title</th><th>Student</th><th>Category</th><th>Status</th><th>Date</th></tr>
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
  `

  const reportWindow = window.open('', '_blank')
  reportWindow.document.write(reportHtml)
  reportWindow.document.close()
  reportWindow.print()
}
