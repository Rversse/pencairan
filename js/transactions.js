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

  const sortValue = sortTransactions?.value || 'newest'

  let orderColumn = 'transaction_date'

  let ascending = false

  if (sortValue === 'oldest') {
    ascending = true
  }

  if (sortValue === 'highest') {
    orderColumn = 'amount'

    ascending = false
  }

  if (sortValue === 'lowest') {
    orderColumn = 'amount'

    ascending = true
  }

  const { data, error } = await query
    .order(orderColumn, {
      ascending,
    })
    .order('created_at', {
      ascending: false,
    })
    .limit(transactionLimit)

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
      <div class="transaction-card">
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

      label = 'GAS'
    }

    const target = transaction.accounts
      ? `${transaction.accounts.name} (${transaction.accounts.bank})`
      : transaction.suppliers?.name || '-'

    const canManage = currentUser.role === 'admin'

    transactionsContainer.innerHTML += `
      <div class="transaction-card">

        <div class="transaction-top">

          <strong>
            ${transaction.kitchens.name}
          </strong>

          <span class="badge ${badgeClass}">
            ${label}
          </span>

        </div>

        <div>
          ${target}
        </div>

        <div class="amount">
          ${formatRupiah(transaction.amount)}
        </div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
          "
        >

          <small>
            ${new Date(transaction.transaction_date)
              .toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
              .replace(/\//g, '-')}
          </small>

          ${
            canManage
              ? `
              <div
                style="
                  display:flex;
                  gap:8px;
                "
              >

                <button
                  onclick='editTransaction(${JSON.stringify(transaction)})'
                >
                  ✏️ Edit
                </button>

                <button
                  onclick="openDeleteModal('${transaction.id}')"
                >
                  🗑 Hapus
                </button>

              </div>
              `
              : ''
          }

        </div>

      </div>
    `
  })
}

loadMoreButton.addEventListener('click', async () => {
  transactionLimit += 5

  await loadTransactions()
})
