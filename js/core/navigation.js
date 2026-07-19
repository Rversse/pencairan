function hideAllSections() {
  dashboardSection.style.display = 'none'

  supplierSection.style.display = 'none'

  supplierMasterSection.style.display = 'none'

  reportSection.style.display = 'none'

  kitchenMasterSection.style.display = 'none'

  disbursementSection.style.display = 'none'

  incomeSection.style.display = 'none'

  bankTransactionSection.style.display = 'none'

  transactionFab.style.display = 'none'
}

function resetActiveTabs() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('active')
  })

  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    dropdown.classList.remove('active')
  })
}

function updateActiveDropdown() {
  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    const hasActive = dropdown.querySelector('.nav-link.active')

    dropdown.classList.toggle('active', !!hasActive)
  })
}

async function showDashboard() {
  await activateSection({
    section: dashboardSection,
    tab: dashboardTab,
    fab: true,
    onShow: async () => {
      await Promise.all([
        loadTransactions(),
        loadDashboard(),
        loadDailyStatus(),
        loadSupplierReport()
      ])
    }
  })
}

async function activateSection({ section, tab, fab = false, onShow }) {
  hideAllSections()
  resetActiveTabs()

  section.style.display = 'block'

  if (fab) {
    transactionFab.style.display = 'flex'
  }

  tab.classList.add('active')

  updateActiveDropdown()

  if (onShow) {
    await onShow()
  }
}

document.querySelectorAll('.nav-dropdown-toggle').forEach((button) => {
  button.addEventListener('click', (e) => {
    e.stopPropagation()

    const dropdown = button.parentElement

    document.querySelectorAll('.nav-dropdown').forEach((item) => {
      if (item !== dropdown) {
        item.classList.remove('open')
      }
    })

    dropdown.classList.toggle('open')
  })
})

document.querySelectorAll('.nav-dropdown-menu .nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown').forEach((item) => {
      item.classList.remove('open')
    })
  })
})

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return

  document.querySelectorAll('.nav-dropdown').forEach((item) => {
    item.classList.remove('open')
  })
})

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown').forEach((item) => {
    item.classList.remove('open')
  })
})

dashboardTab?.addEventListener('click', async (event) => {
  if (currentUser?.role === 'viewer') return

  event.preventDefault()

  await showDashboard()
})

supplierMasterTab?.addEventListener('click', async (event) => {
  event.preventDefault()

  await activateSection({
    section: supplierMasterSection,
    tab: supplierMasterTab,
    onShow: loadSupplierMaster
  })
})

supplierReportTab?.addEventListener('click', async (event) => {
  event.preventDefault()

  await activateSection({
    section: supplierSection,
    tab: supplierReportTab,
    onShow: loadSupplierReport
  })
})

incomeReportTab?.addEventListener('click', async (event) => {
  event.preventDefault()

  await activateSection({
    section: incomeSection,
    tab: incomeReportTab,
    onShow: loadIncomeReport
  })
})

reportTab?.addEventListener('click', async (event) => {
  if (currentUser?.role === 'viewer') return

  event.preventDefault()

  await activateSection({
    section: reportSection,
    tab: reportTab
  })
})

bankTransactionTab?.addEventListener('click', async (event) => {
  event.preventDefault()

  await activateSection({
    section: bankTransactionSection,
    tab: bankTransactionTab,
    onShow: loadBankTransactions
  })
})

updateActiveDropdown()
