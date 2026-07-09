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
  } catch (err) {
    console.error('startApp gagal:', err)
    alert('Terjadi kesalahan saat memuat aplikasi. Coba refresh halaman.')
  } finally {
    document.body.style.visibility = 'visible'
  }
}

function applyRoleAccess() {
  const isViewer = window.currentUser?.role === 'viewer'

  // Tabs
  dashboardTab?.style.setProperty('display', isViewer ? 'none' : '')
  reportTab?.style.setProperty('display', isViewer ? 'none' : '')
  disbursementTab?.style.setProperty('display', isViewer ? 'none' : '')
  supplierMasterTab?.style.setProperty('display', '')
  kitchenMasterTab?.style.setProperty('display', '')

  // Dashboard
  document
    .querySelector('.dashboard')
    ?.style.setProperty('display', isViewer ? 'none' : '')

  // Transaksi
  document
    .getElementById('adminTransactionsSection')
    ?.style.setProperty('display', isViewer ? 'none' : '')

  // Floating Action Button
  document
    .querySelector('.fab-button')
    ?.style.setProperty('display', isViewer ? 'none' : '')

  // Supplier Master
  addSupplierButton?.style.setProperty('display', isViewer ? 'none' : '')

  // Kitchen Master
  addKitchenButton?.style.setProperty('display', isViewer ? 'none' : '')
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
