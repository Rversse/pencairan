const dailyStatusSummary = document.getElementById('dailyStatusSummary')
const dailyStatusPanel = document.getElementById('dailyStatusPanel')
const dailyStatusDate = document.getElementById('dailyStatusDate')

async function loadDailyStatus() {
  const dailyStatusList = document.getElementById('dailyStatusList')

  const dailyStatusSummaryEl = document.getElementById('dailyStatusSummary')

  if (!dailyStatusList || !dailyStatusSummaryEl) {
    return
  }

  const today = getTodayLocal()

  const selectedDate = filterDate?.value || today

  if (dailyStatusDate) {
    dailyStatusDate.textContent = formatDateShort(selectedDate)
  }

  const [{ data: kitchens }, { data: transactions }] = await Promise.all([
    supabaseClient
      .from('kitchens')
      .select('id,name')
      .eq('is_active', true)
      .order('name'),

    supabaseClient
      .from('transactions')
      .select('kitchen_id,flow_type')
      .eq('transaction_date', selectedDate)
  ])

  const transactionMap = new Map()

  transactions.forEach((item) => {
    if (!transactionMap.has(item.kitchen_id)) {
      transactionMap.set(item.kitchen_id, [])
    }

    transactionMap.get(item.kitchen_id).push(item)
  })

  if (!kitchens || !transactions) {
    return
  }

  let green = 0
  let yellow = 0
  let red = 0

  let html = ''

  const statusRows = []

  kitchens.forEach((kitchen) => {
    const kitchenTransactions = transactionMap.get(kitchen.id) ?? []

    const needsOperational = !['Sukaraja', 'Cihaur'].includes(kitchen.name)

    let hasIncome = false
    let hasExpense = false
    let hasOperational = false

    for (const item of kitchenTransactions) {
      if (item.flow_type === 'income') hasIncome = true
      else if (item.flow_type === 'expense') hasExpense = true
      else if (item.flow_type === 'neutral') hasOperational = true

      if (
        hasIncome &&
        hasExpense &&
        (needsOperational ? hasOperational : true)
      ) {
        break
      }
    }

    let completed = 0
    let required = needsOperational ? 3 : 2

    if (hasIncome) completed++
    if (hasExpense) completed++
    if (needsOperational && hasOperational) completed++

    let icon = ''
    let cssClass = ''

    if (completed === required) {
      green++
      icon = '🟢'
      cssClass = 'daily-status-green'
    } else if (completed === 0) {
      red++
      icon = '🔴'
      cssClass = 'daily-status-red'
    } else {
      yellow++
      icon = '🟡'
      cssClass = 'daily-status-yellow'
    }

    let statusText = ''

    if (needsOperational) {
      statusText = `
  B${hasIncome ? '🟢' : '🔴'}
  S${hasExpense ? '🟢' : '🔴'}
  O${hasOperational ? '🟢' : '🔴'}
`
    } else {
      statusText = `
  B${hasIncome ? '🟢' : '🔴'}
  S${hasExpense ? '🟢' : '🔴'}
`
    }

    statusRows.push({
      priority: completed === required ? 2 : completed === 0 ? 0 : 1,

      html: `
    <div
      class="daily-status-row ${cssClass}"
    >
      <span class="daily-kitchen-name">
        ${icon}
        ${kitchen.name}
      </span>

      <span class="daily-kitchen-status">
        ${statusText}
      </span>
    </div>
  `
    })
  })

  statusRows.sort((a, b) => a.priority - b.priority)

  html = statusRows.map((item) => item.html).join('')

  dailyStatusSummaryEl.innerHTML = `
  <div class="status-trigger">
    ❯
  </div>

  <div class="status-hover">
    <div class="status-item">
      <span class="green-dot"></span>
      <span>${green}</span>
    </div>

    <div class="status-item">
      <span class="yellow-dot"></span>
      <span>${yellow}</span>
    </div>

    <div class="status-item">
      <span class="red-dot"></span>
      <span>${red}</span>
    </div>
  </div>
`

  dailyStatusList.innerHTML = html
}

dailyStatusSummary?.addEventListener(
  'click',

  (event) => {
    event.stopPropagation()

    const isHidden = dailyStatusPanel.style.display === 'none'

    if (isHidden) {
      dailyStatusPanel.style.display = 'block'

      requestAnimationFrame(() => {
        dailyStatusPanel.classList.add('open')
      })

      dailyStatusSummary.style.display = 'none'
    } else {
      dailyStatusPanel.classList.remove('open')

      setTimeout(() => {
        dailyStatusPanel.style.display = 'none'
      }, 200)

      dailyStatusSummary.style.display = 'flex'
    }
  }
)

document.addEventListener(
  'click',

  (event) => {
    const widget = document.getElementById('dailyStatusWidget')

    if (widget && !widget.contains(event.target)) {
      dailyStatusPanel.style.display = 'none'

      dailyStatusSummary.style.display = 'flex'
    }
  }
)
