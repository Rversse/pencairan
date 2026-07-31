function showTransactionLoading(showLoading) {
  if (!showLoading) return null

  loadMoreButton.style.display = 'none'

  return setTimeout(() => {
    transactionsContainer.innerHTML = `
    <div class="transaction-card">
      Memuat transaksi...
    </div>
  `
  }, 250)
}

async function fetchTransactions() {
  let query = supabaseClient.from('transactions').select(`
    *,
    kitchens(name),
    suppliers!transactions_supplier_id_fkey(
      name
    ),
    accounts(
      id,
      name,
      bank,
      account_number,
      income_suppliers!accounts_supplier_id_fkey(
        business_name,
        owner_name
      )
    )
  `)

  if (currentUser?.role === 'viewer') {
    query = query.eq('flow_type', 'expense')
  }

  if (filterKitchen.value) {
    query = query.eq('kitchen_id', filterKitchen.value)
  }

  if (filterFlow.value) {
    query = query.eq('flow_type', filterFlow.value)
  }

  query = query
    .gte('transaction_date', dashboardStartDate.value)
    .lte('transaction_date', dashboardEndDate.value)

  return query.order('created_at', { ascending: false })
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text ?? ''
  return div.innerHTML
}

function renderTransactionCards(data) {
  let html = ''

  for (const transaction of data) {
    let badgeClass = 'badge-income'
    let label = 'BGN'

    switch (transaction.flow_type) {
      case 'expense':
        badgeClass = 'badge-expense'
        label = 'SUPPLIER'
        break

      case 'neutral':
        badgeClass = 'badge-operational'
        label = 'OPS'
        break
    }

    const targetClass =
      transaction.flow_type === 'income'
        ? 'target-income'
        : transaction.flow_type === 'neutral'
          ? 'target-operational'
          : 'target-expense'

    const supplierName =
      transaction.accounts?.income_suppliers?.business_name?.trim() || ''

    const ownerName =
      transaction.accounts?.income_suppliers?.owner_name?.trim() || ''

    const target =
      transaction.flow_type === 'neutral' &&
      !['Sukaraja', 'Cihaur'].includes(transaction.kitchens?.name)
        ? `
          <span class="supplier-name">
            ${supplierName || 'Arutala'}
          </span>

          <span class="target-separator">•</span>

          <span class="transaction-owner">
            ${ownerName || '-'}
          </span>

          <span class="target-separator">•</span>

          <span class="transaction-bank">
            ${transaction.accounts?.bank} - ${transaction.accounts?.account_number}
          </span>
        `
        : transaction.accounts
          ? `
            ${
              supplierName
                ? `
                  <span class="supplier-name">
                    ${supplierName}
                  </span>
                `
                : ''
            }

            ${
              ownerName
                ? `
                  <span class="target-separator">•</span>

                  <span class="transaction-owner">
                    ${ownerName}
                  </span>
                `
                : ''
            }

            <span class="target-separator">•</span>

            <span class="transaction-bank">
              ${transaction.accounts.bank} - ${transaction.accounts.account_number}
            </span>
          `
          : `
            <span class="supplier-name">
              ${transaction.suppliers?.name || '-'}
            </span>
          `

    const isLocked = isTransactionLocked(transaction.transaction_date)
    const canManage = currentUser?.role === 'admin' && !isLocked

    html += `
    <div class="transaction-card">

      <div class="transaction-layout">

        <div class="transaction-left">

          <div class="transaction-header">

            <strong>
              ${transaction.kitchens.name}
            </strong>

            <span class="badge ${badgeClass}">
              ${label}
            </span>

          </div>

          <div class="transaction-target ${targetClass}">
            ${target}
          </div>

          <small class="transaction-date">
            ${formatDateTime(transaction.created_at)}
          </small>

          <small class="transaction-note">
            Catatan: ${escapeHtml(transaction.note) || '-'}
          </small>

        </div>

        <div class="transaction-right">

          <div class="amount">
            ${formatRupiah(transaction.amount)}
          </div>

          ${
            canManage
              ? `
              <div class="transaction-actions">

                <button
                  class="editTransactionButton"
                  data-id="${transaction.id}"
                >
                  <i data-lucide="pencil"></i>
                </button>

                <button
                  onclick="openDeleteModal('${transaction.id}')"
                >
                  <i data-lucide="trash-2"></i>
                </button>

              </div>
              `
              : ''
          }

        </div>

      </div>

    </div>
  `
  }

  return html
}

function bindEditButtons(data) {
  document.querySelectorAll('.editTransactionButton').forEach((button) => {
    button.addEventListener('click', () => {
      const transaction = data.find((item) => item.id === button.dataset.id)

      if (transaction) {
        editTransaction(transaction)
      }
    })
  })
}

let transactionsRequestId = 0

async function loadTransactions(showLoading = true) {
  const requestId = ++transactionsRequestId

  const loadingTimer = showTransactionLoading(showLoading)

  const { data, error } = await fetchTransactions()

  clearTimeout(loadingTimer)

  if (requestId !== transactionsRequestId) {
    return
  }

  if (error) {
    console.error(error)
    transactionsContainer.innerHTML =
      '<div class="transaction-card">Gagal memuat transaksi</div>'
    return
  }

  const selectedSupplier = filterSupplier.value

  const filteredData = selectedSupplier
    ? data.filter((row) => {
        if (row.flow_type === 'income') {
          return row.account_id === selectedSupplier
        }

        if (row.flow_type === 'expense') {
          return row.suppliers?.name === selectedSupplier
        }

        return false
      })
    : data

  if (requestId !== transactionsRequestId) {
    return
  }

  transactionsContainer.innerHTML = ''

  if (!filteredData.length) {
    transactionsContainer.innerHTML = `
      <div class="empty-state">
        Tidak ada transaksi
        untuk tanggal ini
      </div>
    `

    loadMoreButton.style.display = 'none'
    return
  }

  loadMoreButton.style.display =
    filteredData.length >= transactionLimit ? 'block' : 'none'

  const visibleTransactions = filteredData.slice(0, transactionLimit)

  transactionsContainer.innerHTML = renderTransactionCards(visibleTransactions)

  if (window.lucide) {
    lucide.createIcons()
  }

  bindEditButtons(visibleTransactions)
}

loadMoreButton.addEventListener(
  'click',

  async () => {
    if (loadMoreButton.disabled) {
      return
    }

    loadMoreButton.disabled = true

    const originalText = loadMoreButton.textContent

    loadMoreButton.textContent = 'Memuat...'

    try {
      transactionLimit += 5

      await loadTransactions(false)
    } finally {
      loadMoreButton.disabled = false

      loadMoreButton.textContent = originalText
    }
  }
)
