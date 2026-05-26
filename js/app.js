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

  toggleFields()

  lucide.createIcons()

  document.body.style.visibility = 'visible'
}

function applyRoleAccess() {
  const dashboardLink = document.querySelector('a[href="index.html"]')

  const dashboard = document.querySelector('.dashboard')

  const reportLink = document.querySelector('a[href="report.html"]')

  const adminSection = document.getElementById('adminTransactionsSection')

  const fabButton = document.querySelector('.fab-button')

  if (window.currentUser?.role === 'viewer') {
    if (dashboardLink) {
      dashboardLink.style.display = 'none'
    }

    if (dashboard) {
      dashboard.style.display = 'none'
    }

    if (reportLink) {
      reportLink.style.display = 'none'
    }

    if (adminSection) {
      adminSection.style.display = 'none'
    }

    if (fabButton) {
      fabButton.style.display = 'none'
    }
  } else {
    if (dashboardLink) {
      dashboardLink.style.display = ''
    }

    if (dashboard) {
      dashboard.style.display = ''
    }

    if (reportLink) {
      reportLink.style.display = ''
    }

    if (adminSection) {
      adminSection.style.display = ''
    }

    if (fabButton) {
      fabButton.style.display = ''
    }
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
