function resetModalScroll(modalEl) {
  const scrollable = modalEl.querySelector('.modal-content > *:last-child')
  if (scrollable) scrollable.scrollTop = 0
}

async function startApp() {
  document.body.style.visibility = 'hidden'

  try {
    const authenticated = await initAuth()
    if (!authenticated) return
    ;['click', 'keydown', 'mousemove', 'touchstart'].forEach((event) => {
      window.addEventListener(event, resetInactivityTimer)
    })

    resetInactivityTimer()
    applyRoleAccess()
    applyViewerBadge()
    await init()

    dashboardSection.style.display = 'none'
    supplierSection.style.display = 'none'
    reportSection.style.display = 'none'
    disbursementSection.style.display = 'none'
    incomeSection.style.display = 'none'
    supplierMasterSection.style.display = 'none'
    kitchenMasterSection.style.display = 'none'

    if (currentUser?.role === 'viewer') {
      kitchenMasterSection.style.display = 'block'

      dashboardTab?.classList.remove('active')
      supplierMasterTab?.classList.remove('active')
      supplierReportTab?.classList.remove('active')
      incomeReportTab?.classList.remove('active')
      reportTab?.classList.remove('active')
      disbursementTab?.classList.remove('active')

      kitchenMasterTab?.classList.add('active')
      updateActiveDropdown()

      await loadKitchenMaster()
    } else {
      dashboardSection.style.display = 'block'

      transactionFab.style.display = 'flex'

      dashboardTab?.classList.add('active')
      supplierMasterTab?.classList.remove('active')
      supplierReportTab?.classList.remove('active')
      incomeReportTab?.classList.remove('active')
      reportTab?.classList.remove('active')
      disbursementTab?.classList.remove('active')

      await Promise.all([
        loadTransactions(),
        loadDashboard(),
        loadDailyStatus(),
        loadSupplierReport()
      ])
    }

    toggleFields()
    lucide.createIcons()
  } catch (err) {
    console.error('startApp gagal:', err)
    alert('Terjadi kesalahan saat memuat aplikasi. Coba refresh halaman.')
  } finally {
    document.body.style.visibility = 'visible'
  }
}

function applyRoleAccess() {
  const isViewer = window.currentUser?.role === 'viewer'

  document.querySelectorAll('[data-role]').forEach((element) => {
    const role = element.dataset.role

    const visible =
      role === 'both' ||
      (role === 'admin' && !isViewer) ||
      (role === 'viewer' && isViewer)

    element.style.display = visible ? '' : 'none'
  })

  document
    .querySelector('.dashboard')
    ?.style.setProperty('display', isViewer ? 'none' : '')

  document
    .getElementById('adminTransactionsSection')
    ?.style.setProperty('display', isViewer ? 'none' : '')

  document
    .querySelector('.fab-button')
    ?.style.setProperty('display', isViewer ? 'none' : '')

  addSupplierButton?.style.setProperty('display', isViewer ? 'none' : '')

  addKitchenButton?.style.setProperty('display', isViewer ? 'none' : '')
}

document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  const hasVisibleChild = [...dropdown.querySelectorAll('.nav-link')].some(
    (link) => getComputedStyle(link).display !== 'none'
  )

  dropdown.style.display = hasVisibleChild ? '' : 'none'
})

function applyViewerBadge() {
  viewerBadge.innerHTML =
    window.currentUser?.role === 'viewer'
      ? `
      <div class="viewer-badge">
        Guest Mode
      </div>
    `
      : ''
}

startApp()
