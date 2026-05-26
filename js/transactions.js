async function loadTransactions() {
  transactionsContainer.innerHTML = `
    <div class="transaction-card">
      Memuat transaksi...
    </div>
  `

  let query = supabaseClient.from('transactions').select(`
      *,
      kitchens(name),
      accounts(name, bank),
      suppliers(name)
    `)

  if (currentUser.role === 'viewer') {
    query = query
      .eq('flow_type', 'expense')
      .eq('supplier_id', '3e80a99f-a5af-499e-bad5-32cce54c7361')
  }

  if (filterKitchen.value) {
    query = query.eq('kitchen_id', filterKitchen.value)
  }

  if (filterFlow.value) {
    query = query.eq('flow_type', filterFlow.value)
  }

  if (filterDate.value) {
    query = query.eq('transaction_date', filterDate.value)
  }

  const { data, error } = await query
    .order('created_at', {
      ascending: false,
    })
    .limit(transactionLimit)

  const latestTransaction = data?.[0]

  if (error) {
    console.error(error)

    transactionsContainer.innerHTML = `
      <div class="transaction-card">
        Gagal memuat transaksi
      </div>
      `

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

    let label = 'Pemasukan'

    if (transaction.flow_type === 'expense') {
      badgeClass = 'badge-expense'

      label = 'Pengeluaran'
    }

    if (transaction.flow_type === 'neutral') {
      badgeClass = 'badge-gas'

      label = 'Gas'
    }

    const target = transaction.accounts
      ? `${transaction.accounts.name} (${transaction.accounts.bank})`
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

        <div class="transaction-target">
          ${target}
        </div>

        <small class="transaction-date">
          Diinput pada:
          ${new Date(transaction.transaction_date)
            .toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
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
                onclick='editTransaction(${JSON.stringify(transaction)})'
              >
                ✏️
              </button>

              <button
                onclick="openDeleteModal('${transaction.id}')"
              >
                🗑
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

      await loadTransactions()
    } finally {
      loadMoreButton.disabled = false

      loadMoreButton.textContent = originalText
    }
  }
)
