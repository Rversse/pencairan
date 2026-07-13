async function loadTransactions(showLoading = true) {
  let loadingTimer = null

  if (showLoading) {
    loadMoreButton.style.display = 'none'

    // baru tampilin "Memuat..." kalau fetch lebih dari 250ms
    loadingTimer = setTimeout(() => {
      transactionsContainer.innerHTML = `
        <div class="transaction-card">
          Memuat transaksi...
        </div>
      `
    }, 250)
  }

  let query = supabaseClient.from('transactions').select(`
      *,
      kitchens(name),
      accounts(
  name,
  bank,
  income_suppliers!accounts_supplier_id_fkey(
    owner_name
  )
),
      suppliers(name)
    `)

  if (currentUser?.role === 'viewer') {
    query = query.eq('flow_type', 'expense')
  }
  if (filterKitchen.value) query = query.eq('kitchen_id', filterKitchen.value)
  if (filterFlow.value) query = query.eq('flow_type', filterFlow.value)
  if (filterDate.value) query = query.eq('transaction_date', filterDate.value)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(transactionLimit)

  clearTimeout(loadingTimer) // batalin placeholder kalau belum sempat muncul

  if (error) {
    console.error(error)
    transactionsContainer.innerHTML = `<div class="transaction-card">Gagal memuat transaksi</div>`
    return
  }

  transactionsContainer.innerHTML = ''

  if (!data.length) {
    transactionsContainer.innerHTML = `
<div class="empty-state">
  Tidak ada transaksi
  untuk filter ini
</div>
      `

    loadMoreButton.style.display = 'none'

    return
  }

  if (data.length < transactionLimit) {
    loadMoreButton.style.display = 'none'
  } else {
    loadMoreButton.style.display = 'block'
  }

  data.forEach((transaction) => {
    let badgeClass = 'badge-income'

    let label = 'BGN'

    if (transaction.flow_type === 'expense') {
      badgeClass = 'badge-expense'

      label = 'SUPPLIER'
    }

    if (transaction.flow_type === 'neutral') {
      badgeClass = 'badge-gas'

      label = 'GAS'
    }

    const target = transaction.accounts
      ? `${transaction.accounts.name}${
          transaction.accounts.income_suppliers?.owner_name
            ? ` / ${transaction.accounts.income_suppliers.owner_name}`
            : ''
        } (${transaction.accounts.bank})`
      : transaction.suppliers?.name || '-'

    const isLocked = isTransactionLocked(transaction.transaction_date)

    const canManage = currentUser.role === 'admin' && !isLocked

    transactionsContainer.innerHTML += `
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

<div
  class="
    transaction-target
    ${
      transaction.flow_type === 'income'
        ? 'target-income'
        : transaction.flow_type === 'neutral'
          ? 'target-gas'
          : 'target-expense'
    }
  "
>
  ${target}
</div>

<small class="transaction-date">
          ${new Date(transaction.transaction_date)
            .toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
            .replace(/\//g, '-')}
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
  })
  lucide.createIcons()

  document.querySelectorAll('.editTransactionButton').forEach((button) => {
    button.addEventListener('click', () => {
      const transaction = data.find((item) => item.id === button.dataset.id)

      if (transaction) {
        editTransaction(transaction)
      }
    })
  })
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
