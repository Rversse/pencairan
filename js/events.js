amountInput.addEventListener('input', (event) => {
  const raw = event.target.value.replace(/\D/g, '')

  event.target.value = formatNumber(raw)
})

flowType.addEventListener('change', toggleFields)

applyDashboardFilter?.addEventListener('click', async () => {
  await loadDashboard()
})

const logoutButton = document.getElementById('logoutButton')

logoutButton?.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signOut()

  if (error) {
    console.error(error)

    return
  }

  window.location.replace('login.html')
})

dashboardStartDate?.addEventListener('change', () => {
  if (!dashboardEndDate.dataset.modified) {
    dashboardEndDate.value = dashboardStartDate.value
  }
})

dashboardEndDate?.addEventListener('change', () => {
  dashboardEndDate.dataset.modified = 'true'
})
