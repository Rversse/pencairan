async function init() {
  await loadKitchens()

  await loadSuppliers()

  await loadAccountsFiltered('pemasukan')
}

async function startApp() {
  const authenticated = await initAuth()

  if (!authenticated) {
    return
  }

  applyRoleAccess()

  applyViewerBadge()

  await init()

  await loadTransactions()

  await loadDashboard()

  toggleFields()

  if (window.currentUser?.role !== 'viewer') {
    if (filterFlow.value) {
      summaryQuery = summaryQuery.eq('flow_type', filterFlow.value)
    }
  }

  lucide.createIcons()
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
