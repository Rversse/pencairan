amountInput.addEventListener('input', (event) => {
  const raw = event.target.value.replace(/\D/g, '')

  event.target.value = formatNumber(raw)
})

flowType.addEventListener('change', toggleFields)

applyDashboardFilter?.addEventListener(
  'click',

  async () => {
    if (applyDashboardFilter.disabled) {
      return
    }

    applyDashboardFilter.disabled = true

    const originalText = applyDashboardFilter.textContent

    applyDashboardFilter.textContent = 'Loading...'

    try {
      await loadDashboard()

      await loadDailyStatus()
    } finally {
      applyDashboardFilter.disabled = false

      applyDashboardFilter.textContent = originalText
    }
  }
)

const logoutButton = document.getElementById('logoutButton')

logoutButton?.addEventListener(
  'click',

  async () => {
    if (logoutButton.disabled) {
      return
    }

    logoutButton.disabled = true

    const originalText = logoutButton.textContent

    logoutButton.textContent = 'Logout...'

    try {
      const { error } = await supabaseClient.auth.signOut()

      if (error) {
        console.error(error)

        logoutButton.disabled = false

        logoutButton.textContent = originalText

        return
      }

      window.location.replace('login.html')
    } catch (error) {
      console.error(error)

      logoutButton.disabled = false

      logoutButton.textContent = originalText
    }
  }
)

dashboardStartDate?.addEventListener(
  'change',

  () => {
    if (!dashboardEndDate.dataset.modified) {
      dashboardEndDate.value = dashboardStartDate.value
    }
  }
)

dashboardEndDate?.addEventListener(
  'change',

  () => {
    dashboardEndDate.dataset.modified = 'true'
  }
)
