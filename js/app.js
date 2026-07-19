function resetModalScroll(modalEl) {
  const scrollable = modalEl.querySelector('.modal-content > *:last-child')
  if (scrollable) scrollable.scrollTop = 0
}

function registerActivityListeners() {
  ;['click', 'keydown', 'mousemove', 'touchstart'].forEach((event) => {
    window.addEventListener(event, resetInactivityTimer)
  })

  resetInactivityTimer()
}

async function initializeUserView() {
  const role = currentUser?.role

  if (role === 'viewer' || role === 'operator') {
    await activateSection({
      section: incomeSection,
      tab: incomeReportTab,
      onShow: loadIncomeReport
    })

    return
  }

  await showDashboard()
}

async function initializeApplication() {
  applyRoleAccess()
  applyViewerBadge()

  await init()

  hideAllSections()

  await initializeUserView()

  toggleFields()

  lucide.createIcons()
}

async function startApp() {
  document.body.style.visibility = 'hidden'

  try {
    const authenticated = await initAuth()
    if (!authenticated) return

    registerActivityListeners()

    await initializeApplication()
  } catch (err) {
    console.error('startApp gagal:', err)

    alert('Terjadi kesalahan saat memuat aplikasi. Coba refresh halaman.')
  } finally {
    document.body.style.visibility = 'visible'
  }
}

function applyRoleAccess() {
  const role = window.currentUser?.role

  const isAdmin = role === 'admin'
  const isOperator = role === 'operator'
  const isViewer = role === 'viewer'

  document.querySelectorAll('[data-role]').forEach((element) => {
    const targetRole = element.dataset.role

    let visible = false

    switch (targetRole) {
      case 'admin':
        visible = isAdmin
        break

      case 'operator':
        visible = isOperator
        break

      case 'viewer':
        visible = isViewer
        break

      case 'admin-operator':
        visible = isAdmin || isOperator
        break

      case 'operator-viewer':
        visible = isOperator || isViewer
        break

      case 'all':
        visible = true
        break
    }

    element.style.display = visible ? '' : 'none'
  })

  // Dashboard
  document
    .querySelector('.dashboard')
    ?.style.setProperty('display', isAdmin ? '' : 'none')

  // Input transaksi operasional Dashboard (FAB)
  document
    .querySelector('.fab-button')
    ?.style.setProperty('display', isAdmin ? '' : 'none')

  document
    .getElementById('adminTransactionsSection')
    ?.style.setProperty('display', isAdmin ? '' : 'none')

  // CRUD Master
  addSupplierButton?.style.setProperty('display', isAdmin ? '' : 'none')

  addKitchenButton?.style.setProperty('display', isAdmin ? '' : 'none')

  // Tombol tambah Transaksi Bank
  addBankTransactionButton?.style.setProperty(
    'display',
    isAdmin || isOperator ? '' : 'none'
  )
}

document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  const hasVisibleChild = [...dropdown.querySelectorAll('.nav-link')].some(
    (link) => getComputedStyle(link).display !== 'none'
  )

  dropdown.style.display = hasVisibleChild ? '' : 'none'
})

function applyViewerBadge() {
  const role = window.currentUser?.role

  let label = ''

  switch (role) {
    case 'admin':
      label = 'Administrator'
      break

    case 'operator':
      label = 'Operator'
      break

    case 'viewer':
      label = 'Guest'
      break
  }

  viewerBadge.innerHTML = label
    ? `
      <div class="viewer-badge">
        ${label}
      </div>
    `
    : ''
}

startApp()
