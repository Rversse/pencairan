async function startApp() {
  document.body.style.visibility = 'hidden'

  const authenticated = await initAuth()

  if (!authenticated) {
    return
  }

  ;['click', 'keydown', 'mousemove', 'touchstart'].forEach((event) => {
    window.addEventListener(event, resetInactivityTimer)
  })

  resetInactivityTimer()

  applyRoleAccess()

  applyViewerBadge()

  await init()

  // Reset semua section
  dashboardSection.style.display = 'none'
  supplierSection.style.display = 'none'
  reportSection.style.display = 'none'
  disbursementSection.style.display = 'none'
  incomeSection.style.display = 'none'
  supplierMasterSection.style.display = 'none'

  if (currentUser?.role === 'viewer') {
    incomeSection.style.display = 'block'

    dashboardTab?.classList.remove('active')
    supplierMasterTab?.classList.remove('active')
    supplierReportTab?.classList.remove('active')
    reportTab?.classList.remove('active')
    disbursementTab?.classList.remove('active')

    incomeReportTab?.classList.add('active')

    await loadIncomeReport()
    await loadSupplierReport()
  } else {
    dashboardSection.style.display = 'block'

    dashboardTab?.classList.add('active')
    supplierMasterTab?.classList.remove('active')
    supplierReportTab?.classList.remove('active')
    incomeReportTab?.classList.remove('active')
    reportTab?.classList.remove('active')
    disbursementTab?.classList.remove('active')

    await loadTransactions()
    await loadDashboard()
    await loadDailyStatus()
    await loadSupplierReport()
  }

  toggleFields()

  lucide.createIcons()

  document.body.style.visibility = 'visible'
}

function applyRoleAccess() {
  const dashboardLink = document.getElementById('dashboardTab')
  const reportLink = document.getElementById('reportTab')
  const disbursementLink = document.getElementById('disbursementTab')

  const dashboard = document.querySelector('.dashboard')
  const adminSection = document.getElementById('adminTransactionsSection')
  const fabButton = document.querySelector('.fab-button')

  const isViewer = window.currentUser?.role === 'viewer'

  dashboardLink?.style.setProperty('display', isViewer ? 'none' : '')
  reportLink?.style.setProperty('display', isViewer ? 'none' : '')
  disbursementLink?.style.setProperty('display', isViewer ? 'none' : '')

  dashboard?.style.setProperty('display', isViewer ? 'none' : '')
  adminSection?.style.setProperty('display', isViewer ? 'none' : '')
  fabButton?.style.setProperty('display', isViewer ? 'none' : '')
}

function applyViewerBadge() {
  viewerBadge.innerHTML =
    window.currentUser?.role === 'viewer'
      ? `
      <div class="viewer-badge">
        Viewer Mode
      </div>
    `
      : ''
}

startApp()
