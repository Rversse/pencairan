let currentHistoryAccountId = null
let bankHistoryRequestId = 0

const HISTORY_PAGE_SIZE = 10

let historyTransactions = []
let historyCurrentPage = 1
let historyRenderState = null

const bankHistoryModal = document.getElementById('bankHistoryModal')
const bankHistoryTitle = document.getElementById('bankHistoryTitle')
const bankHistoryContent = document.getElementById('bankHistoryContent')
const closeBankHistory = document.getElementById('closeBankHistory')

function buildHistoryTitle(account, periodLabel) {
  return `
    <div class="history-account-title">
      ${account.income_suppliers?.owner_name ?? account.name ?? '-'}
    </div>

    <div class="history-account-subtitle">
      ${account.bank} • ${getLastThreeDigits(account.account_number)}
    </div>

    <div class="history-account-period">
      <span>Periode</span>
      <strong>${periodLabel}</strong>
    </div>
  `
}

function buildEmptyHistory(openingBalance) {
  return `
    <div class="history-summary">

      <div class="history-summary-info">

        <small>Saldo Saat Ini</small>

        <h2 class="history-current-balance">
          ${formatRupiah(openingBalance)}
        </h2>

      </div>

    </div>

    <div class="history-empty">

      <i data-lucide="receipt"></i>

      <h3>Belum ada riwayat transfer</h3>

      <p>
        Riwayat transaksi bank akan muncul di sini setelah anda
        melakukan transfer.
      </p>

    </div>
  `
}

function buildHistoryCards(transactions, canManageBank, latestTransactionId) {
  return transactions
    .map((item, index) => {
      const order = item.order

      const transferAmount = Number(item.transfer_amount) || 0
      const adminFee = Number(item.admin_fee) || 0

      const isIncoming = item.direction === 'in'

      const totalValue = isIncoming ? transferAmount : transferAmount + adminFee

      const paymentPurpose = item.payment_for?.trim()

      const transferLabel = isIncoming ? 'Dana Diterima' : 'Transfer Keluar'

      const totalLabel = 'Total Dana Terpotong'

      const cardClass = isIncoming
        ? 'history-card incoming'
        : 'history-card outgoing'

      const amountClass = isIncoming ? 'history-in' : 'history-out'

      const cardSaldo = item.runningBalance

      return `
<div class="${cardClass}">

  <div class="history-header">

<div>

  <div class="history-recipient-row">

      <div class="history-recipient">
          ${item.partner || '-'}
      </div>

      <div class="history-badges">

        ${
          item.id === latestTransactionId
            ? `<span class="history-latest-badge">TERBARU</span>`
            : ''
        }

        <span class="history-order">
            #${order}
        </span>

      </div>

  </div>

  <div class="history-date">
    ${formatDateShort(item.transaction_date)}
    •
    ${formatTime(item.created_at)}
  </div>

</div>

${
  canManageBank
    ? `
<div class="history-actions">

<button
  class="secondary-button edit-bank-transaction"
  data-id="${item.id}"
  title="Edit"
>
  <i data-lucide="pencil"></i>
</button>

<button
  class="danger-button delete-bank-transaction"
  data-id="${item.id}"
  title="Hapus"
>
  <i data-lucide="trash-2"></i>
</button>

</div>
`
    : ''
}

  </div>

  <div class="history-details">

    <div class="history-row">
      <span>${transferLabel}</span>
      <strong class="${amountClass}">
        ${formatRupiah(transferAmount)}
      </strong>
    </div>

${
  !isIncoming
    ? `
<div class="history-row">
  <span>Biaya Admin</span>
  <strong class="history-admin">
    ${formatRupiah(adminFee)}
  </strong>
</div>

<div class="history-divider"></div>
`
    : ''
}

${
  !isIncoming
    ? `
<div class="history-row">
  <span>${totalLabel}</span>
  <strong class="history-out">
    ${formatRupiah(totalValue)}
  </strong>
</div>
`
    : ''
}

    <div class="history-row">
      <span>Saldo</span>
      <strong class="history-balance">
        ${formatRupiah(cardSaldo)}
      </strong>
    </div>

  </div>

${
  paymentPurpose
    ? `
<div class="history-purpose">
  <span title="${paymentPurpose}">
    ${paymentPurpose}
  </span>
</div>
`
    : ''
}

</div>
`
    })
    .join('')
}

function buildHistorySummary(
  openingBalance,
  disbursementIncome,
  transferIncome,
  totalExpense,
  historyBalance
) {
  return `
<div class="history-summary">

    <div class="history-summary-main">

        <small>SALDO SAAT INI</small>

        <h2 class="history-current-balance">
            ${formatRupiah(historyBalance)}
        </h2>

    </div>

    <div class="history-summary-stats">

<div class="history-stat opening">
    <span>SALDO AWAL</span>
    <strong>${formatRupiah(openingBalance)}</strong>
</div>

<div class="history-stat income">
    <span>PENCAIRAN MASUK</span>
    <strong class="income">
        ${formatRupiah(disbursementIncome)}
    </strong>
</div>

<div class="history-stat income">
    <span>TRANSFER MASUK</span>
    <strong class="income">
        ${formatRupiah(transferIncome)}
    </strong>
</div>

<div class="history-stat expense">
    <span>TRANSFER KELUAR</span>
    <strong class="expense">
        ${formatRupiah(totalExpense)}
    </strong>
</div>

    </div>

</div>
`
}

function renderHistoryPage(
  openingBalance,
  disbursementIncome,
  transferIncome,
  totalExpense,
  historyBalance,
  canManageBank
) {
  const start = (historyCurrentPage - 1) * HISTORY_PAGE_SIZE
  const end = start + HISTORY_PAGE_SIZE

  const pageTransactions = historyTransactions.slice(start, end)

  const latestTransactionId = historyTransactions[0]?.id

  const html =
    buildHistoryCards(pageTransactions, canManageBank, latestTransactionId) +
    buildHistoryPagination()

  bankHistoryContent.innerHTML =
    buildHistorySummary(
      openingBalance,
      disbursementIncome,
      transferIncome,
      totalExpense,
      historyBalance
    ) + html

  lucide.createIcons()

  bindHistoryActions(bankHistoryContent, pageTransactions)
  bindHistoryPagination()
}

function buildHistoryPagination() {
  const totalItems = historyTransactions.length
  const totalPages = Math.ceil(totalItems / HISTORY_PAGE_SIZE)

  if (totalPages <= 1) {
    return ''
  }

  const start = (historyCurrentPage - 1) * HISTORY_PAGE_SIZE + 1
  const end = Math.min(historyCurrentPage * HISTORY_PAGE_SIZE, totalItems)

  let pages = ''

  const addPage = (page) => {
    pages += `
    <button
      class="history-page-button ${page === historyCurrentPage ? 'active' : ''}"
      data-page="${page}">
      ${page}
    </button>
  `
  }

  const addDots = () => {
    pages += `<span class="history-page-dots">…</span>`
  }

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      addPage(i)
    }
  } else if (historyCurrentPage <= 4) {
    for (let i = 1; i <= 5; i++) {
      addPage(i)
    }

    addDots()

    addPage(totalPages)
  } else if (historyCurrentPage >= totalPages - 3) {
    addPage(1)

    addDots()

    for (let i = totalPages - 4; i <= totalPages; i++) {
      addPage(i)
    }
  } else {
    addPage(1)

    addDots()

    for (let i = historyCurrentPage - 1; i <= historyCurrentPage + 1; i++) {
      addPage(i)
    }

    addDots()

    addPage(totalPages)
  }

  return `
    <div class="history-pagination">

      <div class="history-pagination-info">
        Menampilkan ${start}–${end} dari ${totalItems} transaksi
      </div>

      <div class="history-pagination-buttons">

<button
  class="history-page-button ${historyCurrentPage === 1 ? 'disabled' : ''}"
  data-page="prev"
  ${historyCurrentPage === 1 ? 'disabled' : ''}>
  ←
</button>

        ${pages}

<button
  class="history-page-button ${
    historyCurrentPage === totalPages ? 'disabled' : ''
  }"
  data-page="next"
  ${historyCurrentPage === totalPages ? 'disabled' : ''}>
  →
</button>

      </div>

    </div>
  `
}

function bindHistoryPagination() {
  bankHistoryContent
    .querySelectorAll('.history-page-button:not(.disabled)')
    .forEach((button) => {
      button.onclick = () => {
        const totalPages = Math.ceil(
          historyTransactions.length / HISTORY_PAGE_SIZE
        )

        const action = button.dataset.page

        if (action === 'prev') {
          historyCurrentPage = Math.max(1, historyCurrentPage - 1)
        } else if (action === 'next') {
          historyCurrentPage = Math.min(totalPages, historyCurrentPage + 1)
        } else {
          historyCurrentPage = Number(action)
        }

        renderHistoryPage(
          historyRenderState.openingBalance,
          historyRenderState.disbursementIncome,
          historyRenderState.transferIncome,
          historyRenderState.totalExpense,
          historyRenderState.historyBalance,
          historyRenderState.canManageBank
        )

        const firstCard = bankHistoryContent.querySelector('.history-card')

        firstCard?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    })
}

function bindHistoryActions(container, transactions) {
  const transactionMap = new Map(
    transactions.map((item) => [String(item.id), item])
  )

  container.querySelectorAll('.edit-bank-transaction').forEach((button) => {
    button.onclick = () => {
      const transaction = transactionMap.get(button.dataset.id)

      if (transaction) {
        openEditBankTransaction(transaction)
      }
    }
  })

  container.querySelectorAll('.delete-bank-transaction').forEach((button) => {
    button.onclick = () => {
      deleteBankTransaction(button.dataset.id)
    }
  })
}

function calculateHistorySummary(
  openingBalance,
  incomeTransactions,
  transactions
) {
  const disbursementIncome = incomeTransactions.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  )

  const transferIncome = transactions
    .filter((item) => item.historyType === 'in')
    .reduce((total, item) => total + Number(item.transfer_amount || 0), 0)

  const totalExpense = transactions
    .filter((item) => item.direction === 'out')
    .reduce(
      (total, item) =>
        total +
        (Number(item.transfer_amount) || 0) +
        (Number(item.admin_fee) || 0),
      0
    )

  const historyBalance =
    openingBalance + disbursementIncome + transferIncome - totalExpense

  return {
    disbursementIncome,
    transferIncome,
    totalExpense,
    historyBalance
  }
}

function buildHistoryError(title, message) {
  return `
    <div class="history-error">
      <i data-lucide="triangle-alert"></i>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `
}

async function openBankHistory(accountId) {
  const requestId = ++bankHistoryRequestId

  currentHistoryAccountId = accountId

  // Tampilkan modal DULUAN, sebelum baris lain yang bisa throw
  // (kalau ada error di bawah sebelum ini, modal gak akan pernah kebuka)
  bankHistoryTitle.textContent = 'History Rekening'
  bankHistoryContent.innerHTML = ''
  renderHistorySkeleton()
  bankHistoryModal.classList.add('show')

  if (
    !bankStartDate ||
    !bankEndDate ||
    typeof BANK_MODULE_START_DATE === 'undefined'
  ) {
    bankHistoryContent.innerHTML = buildHistoryError(
      'Konfigurasi tanggal tidak ditemukan',
      'Pastikan bank.js dan constants.js sudah termuat sebelum bank-history.js.'
    )
    lucide.createIcons()
    return
  }

  const effectiveStartDate =
    bankStartDate.value < BANK_MODULE_START_DATE
      ? BANK_MODULE_START_DATE
      : bankStartDate.value

  const periodLabel =
    effectiveStartDate === bankEndDate.value
      ? `${formatDateShort(effectiveStartDate)}`
      : `${formatDateShort(effectiveStartDate)} - ${formatDateShort(bankEndDate.value)}`

  const [accountResult] = await Promise.all([
    supabaseClient
      .from('accounts')
      .select(
        `
name,
bank,
account_number,
opening_balance,
income_suppliers(owner_name)
`
      )
      .eq('id', accountId)
      .single()
  ])

  if (requestId !== bankHistoryRequestId) return

  if (accountResult.error) {
    console.error(accountResult.error)

    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryContent.innerHTML = buildHistoryError(
      'Gagal memuat rekening',
      'Terjadi kesalahan saat mengambil data rekening.'
    )
    lucide.createIcons()
    return
  }

  const account = accountResult.data

  const canManageBank =
    currentUser?.role === 'admin' || currentUser?.role === 'operator'

  const [incomeResult, incomingResult, outgoingResult] = await Promise.all([
    supabaseClient
      .from('transactions')
      .select('account_id,amount')
      .eq('account_id', accountId)
      .in('flow_type', ['income', 'neutral'])
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', bankEndDate.value),

    supabaseClient
      .from('bank_transactions')
      .select(
        `
      *,
      sender:accounts!bank_transactions_account_fkey(
        id,
        name,
        bank,
        account_number,
        account_category,
        is_holding_destination,
        income_suppliers(owner_name)
      )
    `
      )
      .eq('recipient_account_id', accountId)
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', bankEndDate.value),

    supabaseClient
      .from('bank_transactions')
      .select(
        `
      *,
      sender:accounts!bank_transactions_account_fkey(
        id,
        name,
        bank,
        account_number,
        account_category,
        is_holding_destination,
        income_suppliers(owner_name)
      ),
      recipient:accounts!bank_transactions_recipient_account_fkey(
        id,
        name,
        bank,
        account_number,
        account_category,
        is_holding_destination,
        income_suppliers(owner_name)
      )
    `
      )
      .eq('account_id', accountId)
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', bankEndDate.value)
  ])

  if (incomingResult.error) {
    console.error(incomingResult.error)
    return
  }

  if (incomeResult.error) {
    console.error(incomeResult.error)
    return
  }

  if (outgoingResult.error) {
    console.error(outgoingResult.error)
    return
  }

  let transactions = [
    ...(incomingResult.data ?? []).map((item) => ({
      ...item,
      historyType: 'in'
    })),
    ...(outgoingResult.data ?? []).map((item) => ({
      ...item,
      historyType: 'out'
    }))
  ]

  transactions.sort((a, b) => {
    const dateCompare =
      new Date(b.transaction_date) - new Date(a.transaction_date)

    if (dateCompare !== 0) {
      return dateCompare
    }

    return new Date(b.created_at) - new Date(a.created_at)
  })

  transactions = transactions.map((item) => {
    const transferAmount = Number(item.transfer_amount) || 0
    const adminFee = Number(item.admin_fee) || 0

    const isIncoming = item.historyType === 'in'

    const partner = isIncoming
      ? (item.sender?.income_suppliers?.owner_name ?? item.sender?.name ?? '-')
      : (item.recipient?.income_suppliers?.owner_name ??
        item.recipient?.name ??
        item.recipient_name ??
        '-')

    return {
      ...item,

      direction: item.historyType,

      amount: transferAmount,

      admin: adminFee,

      total: transferAmount + adminFee,

      partner,

      isHoldingTransfer:
        item.sender?.is_holding_destination &&
        item.recipient?.is_holding_destination,

      isSupplierToHolding:
        item.sender?.account_category === 'supplier' &&
        !item.sender?.is_holding_destination &&
        item.recipient?.is_holding_destination,

      isHoldingToOutside:
        item.sender?.is_holding_destination && !item.recipient_account_id
    }
  })

  let runningBalance = 0

  const openingBalance = Number(account.opening_balance) || 0

  if (!transactions.length) {
    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryTitle.innerHTML = buildHistoryTitle(account, periodLabel)

    bankHistoryContent.innerHTML = buildEmptyHistory(openingBalance)

    lucide.createIcons()

    return
  }

  const { disbursementIncome, transferIncome, totalExpense, historyBalance } =
    calculateHistorySummary(
      openingBalance,
      incomeResult.data ?? [],
      transactions
    )

  runningBalance = historyBalance

  for (const item of transactions) {
    item.runningBalance = runningBalance

    if (item.direction === 'in') {
      runningBalance -= Number(item.transfer_amount) || 0
    } else {
      runningBalance +=
        (Number(item.transfer_amount) || 0) + (Number(item.admin_fee) || 0)
    }
  }

  bankHistoryTitle.innerHTML = buildHistoryTitle(account, periodLabel)

  const dailyTransactionOrder = new Map()

  transactions.forEach((item) => {
    const dateKey = item.transaction_date

    const order = (dailyTransactionOrder.get(dateKey) ?? 0) + 1

    dailyTransactionOrder.set(dateKey, order)

    item.order = order
  })

  historyTransactions = transactions
  historyCurrentPage = 1

  historyRenderState = {
    openingBalance,
    disbursementIncome,
    transferIncome,
    totalExpense,
    historyBalance,
    canManageBank
  }

  renderHistoryPage(
    openingBalance,
    disbursementIncome,
    transferIncome,
    totalExpense,
    historyBalance,
    canManageBank
  )
}

async function deleteBankTransaction(id) {
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'operator') {
    return
  }

  const deleteButtons = bankHistoryContent.querySelectorAll(
    '.delete-bank-transaction'
  )

  deleteButtons.forEach((btn) => {
    btn.disabled = true
  })

  try {
    const confirmed = await showConfirm('Yakin ingin menghapus transaksi ini?')

    if (!confirmed) return

    const { error } = await supabaseClient
      .from('bank_transactions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      showToast('Gagal menghapus transaksi.', 'error')
      return
    }

    await loadBankTransactions()

    showToast('Transaksi berhasil dihapus.')

    if (currentHistoryAccountId) {
      await openBankHistory(currentHistoryAccountId)
    }
  } finally {
    deleteButtons.forEach((btn) => {
      btn.disabled = false
    })
  }
}

function renderHistorySkeleton() {
  bankHistoryContent.innerHTML = `
    ${Array.from({ length: 3 })
      .map(
        () => `
      <div class="history-card history-skeleton">

        <div class="skeleton skeleton-title"></div>

        <div class="skeleton skeleton-text"></div>

        <div class="skeleton skeleton-box"></div>

        <div class="skeleton skeleton-badge"></div>

      </div>
    `
      )
      .join('')}
  `
}

closeBankHistory?.addEventListener('click', () => {
  bankHistoryModal.classList.remove('show')
})
