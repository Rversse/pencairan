async function init() {
  await loadKitchens()

  await loadSuppliers()

  await loadAccountsFiltered('pemasukan')
}

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

  await loadTransactions()

  await loadDashboard()

  await loadDailyStatus()

  await loadSupplierReport()

  toggleFields()

  lucide.createIcons()

  document.body.style.visibility = 'visible'
}

function applyRoleAccess() {
  const dashboardLink = document.getElementById('dashboardTab')

  const reportLink = document.getElementById('reportTab')

  const dashboard = document.querySelector('.dashboard')

  const adminSection = document.getElementById('adminTransactionsSection')

  const fabButton = document.querySelector('.fab-button')

  if (window.currentUser?.role === 'viewer') {
    // Hide menu
    dashboardLink?.style.setProperty('display', 'none')

    reportLink?.style.setProperty('display', 'none')

    // Hide dashboard content
    dashboard?.style.setProperty('display', 'none')

    adminSection?.style.setProperty('display', 'none')

    fabButton?.style.setProperty('display', 'none')

    // Force supplier page
    if (dashboardSection) {
      dashboardSection.style.display = 'none'
    }

    if (reportSection) {
      reportSection.style.display = 'none'
    }

    if (supplierSection) {
      supplierSection.style.display = 'block'
    }

    // Active tab
    dashboardTab?.classList.remove('active')

    reportTab?.classList.remove('active')

    supplierReportTab?.classList.add('active')
  } else {
    dashboardLink?.style.setProperty('display', '')

    reportLink?.style.setProperty('display', '')

    dashboard?.style.setProperty('display', '')

    adminSection?.style.setProperty('display', '')

    fabButton?.style.setProperty('display', '')
  }
}

function applyViewerBadge() {
  if (window.currentUser?.role === 'viewer') {
    viewerBadge.innerHTML = `
      <div class="viewer-badge">
        Viewer Mode
      </div>
    `
  }
}

startApp()
