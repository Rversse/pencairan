let currentHistoryAccountId = null
let bankHistoryRequestId = 0

const bankHistoryModal = document.getElementById('bankHistoryModal')
const bankHistoryTitle = document.getElementById('bankHistoryTitle')
const bankHistoryContent = document.getElementById('bankHistoryContent')
const closeBankHistory = document.getElementById('closeBankHistory')

async function openBankHistory(accountId) {
  const requestId = ++bankHistoryRequestId

  currentHistoryAccountId = accountId

  const effectiveStartDate =
    bankStartDate.value < BANK_MODULE_START_DATE
      ? BANK_MODULE_START_DATE
      : bankStartDate.value

  // Bersihkan dulu
  bankHistoryTitle.textContent = 'History Rekening'
  bankHistoryContent.innerHTML = ''

  // Isi skeleton
  renderHistorySkeleton()

  // Baru tampilkan modal
  bankHistoryModal.classList.add('show')

  const periodLabel =
    effectiveStartDate === bankEndDate.value
      ? `${formatDateShort(effectiveStartDate)}`
      : `${formatDateShort(effectiveStartDate)} - ${formatDateShort(bankEndDate.value)}`

  const [transactionResult, incomeResult, accountResult] = await Promise.all([
    supabaseClient
      .from('bank_transactions')
      .select(
        `
        *,
accounts(
  bank,
  account_number,
  opening_balance,
  income_suppliers(owner_name)
)
      `
      )
      .eq('account_id', accountId)
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', bankEndDate.value)
      .order('transaction_date', { ascending: true }),

    supabaseClient
      .from('transactions')
      .select('amount')
      .in('flow_type', ['income', 'neutral'])
      .eq('account_id', accountId)
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', bankEndDate.value),

    supabaseClient
      .from('accounts')
      .select(
        `
name,
bank,
account_number,
opening_balance,
account_category,
income_suppliers(owner_name)
`
      )
      .eq('id', accountId)
      .single()
  ])

  if (requestId !== bankHistoryRequestId) return

  if (transactionResult.error) {
    console.error(transactionResult.error)

    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryContent.innerHTML = `
  <div class="history-error">

    <i data-lucide="triangle-alert"></i>

    <h3>Gagal memuat riwayat</h3>

    <p>
      Terjadi kesalahan saat mengambil data transaksi.
      Silakan coba lagi.
    </p>

  </div>
`

    lucide.createIcons()

    return
  }

  const account = accountResult.data

  const canManageBank =
    currentUser?.role === 'admin' || currentUser?.role === 'operator'

  const isHoldingAccount = account?.account_category === 'holding'

  let transactions = []

  if (isHoldingAccount) {
    const [incomingResult, outgoingResult] = await Promise.all([
      supabaseClient
        .from('bank_transactions')
        .select(
          `
        *,
        accounts(
          bank,
          account_number,
          opening_balance,
          account_category,
          income_suppliers(owner_name)
        )
      `
        )
        .eq('transfer_type', 'holding')
        .gte('transaction_date', effectiveStartDate)
        .lte('transaction_date', bankEndDate.value),

      supabaseClient
        .from('bank_transactions')
        .select(
          `
        *,
        accounts(
          bank,
          account_number,
          opening_balance,
          account_category,
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

    if (outgoingResult.error) {
      console.error(outgoingResult.error)
      return
    }

    transactions = [
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
      return new Date(a.transaction_date) - new Date(b.transaction_date)
    })
  } else {
    transactions = transactionResult.data ?? []
  }

  if (isHoldingAccount) {
    transactions = transactions.map((item) => {
      const transferAmount = Number(item.transfer_amount) || 0
      const adminFee = Number(item.admin_fee) || 0

      return {
        ...item,

        direction: item.historyType,

        amount: transferAmount,
        admin: adminFee,
        total: transferAmount + adminFee,

        partner:
          item.historyType === 'in'
            ? (item.accounts?.income_suppliers?.owner_name ??
              item.accounts?.name ??
              '-')
            : (item.recipient_name ?? '-')
      }
    })
  }

  const openingBalance = Number(account.opening_balance) || 0

  if (!transactions.length) {
    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryTitle.innerHTML = `
  <div class="history-account-title">
    ${
      account.account_category === 'holding'
        ? account.name
        : (account.income_suppliers?.owner_name ?? '-')
    }
  </div>

  <div class="history-account-subtitle">
    ${account.bank} • ${getLastFiveDigits(account.account_number)}
  </div>

<div class="history-account-period">
    <span>Periode</span>
    <strong>${periodLabel}</strong>
</div>
`

    bankHistoryContent.innerHTML = `

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
      Riwayat transaksi bank akan muncul di sini setelah Anda
      melakukan transfer.
    </p>

  </div>
`

    lucide.createIcons()

    return
  }

  const totalIncome = (incomeResult.data ?? []).reduce(
    (total, item) => total + (Number(item.amount) || 0),
    0
  )

  let historyBalance

  if (isHoldingAccount) {
    const totalIn = transactions
      .filter((item) => item.historyType === 'in')
      .reduce((total, item) => {
        return total + (Number(item.transfer_amount) || 0)
      }, 0)

    const totalOut = transactions
      .filter((item) => item.historyType === 'out')
      .reduce((total, item) => {
        return (
          total +
          (Number(item.transfer_amount) || 0) +
          (Number(item.admin_fee) || 0)
        )
      }, 0)

    historyBalance = openingBalance + totalIn - totalOut
  } else {
    const totalIncome = (incomeResult.data ?? []).reduce(
      (total, item) => total + (Number(item.amount) || 0),
      0
    )

    const totalExpense = transactions.reduce((total, item) => {
      return (
        total +
        (Number(item.transfer_amount) || 0) +
        (Number(item.admin_fee) || 0)
      )
    }, 0)

    historyBalance = openingBalance + totalIncome - totalExpense
  }

  bankHistoryTitle.innerHTML = `
    <div class="history-account-title">
      ${
        account.account_category === 'holding'
          ? account.name
          : (account.income_suppliers?.owner_name ?? '-')
      }
    </div>

    <div class="history-account-subtitle">
      ${account.bank} • ${getLastFiveDigits(account.account_number)}
    </div>

<div class="history-account-period">
    <span>Periode</span>
    <strong>${periodLabel}</strong>
</div>
  `

  // Order transaksi per tanggal dihitung dari urutan ASC (kronologis)
  const dailyTransactionOrder = new Map()

  transactions.forEach((item) => {
    const dateKey = item.transaction_date

    const order = (dailyTransactionOrder.get(dateKey) ?? 0) + 1

    dailyTransactionOrder.set(dateKey, order)

    item.order = order
  })

  // Card ditampilkan dari transaksi terbaru ke terlama (seperti mutasi bank).
  // Saldo pada tiap card adalah saldo SETELAH transaksi tersebut terjadi,
  // dihitung mundur mulai dari historyBalance (saldo saat ini).
  let cardBalance = historyBalance

  const historyCards = [...transactions].reverse().map((item, index) => {
    const order = item.order

    const transferAmount = Number(item.transfer_amount) || 0

    const adminFee = Number(item.admin_fee) || 0

    const isIncoming = isHoldingAccount && item.direction === 'in'

    const totalValue = isIncoming ? transferAmount : transferAmount + adminFee

    const paymentPurpose = item.payment_for?.trim()

    const transferLabel = isIncoming ? 'Dana Diterima' : 'Transfer Keluar'

    const totalLabel = 'Total Dana Terpotong'

    const cardClass = isIncoming
      ? 'history-card incoming'
      : 'history-card outgoing'

    const amountClass = isIncoming ? 'history-in' : 'history-out'

    const cardSaldo = cardBalance

    if (isIncoming) {
      cardBalance -= transferAmount
    } else {
      cardBalance += totalValue
    }

    return `
<div class="${cardClass}">

  <div class="history-header">

<div>

  <div class="history-recipient-row">

      <div class="history-recipient">
          ${
            isHoldingAccount
              ? item.partner || '-'
              : item.recipient_name || 'Penerima tidak diketahui'
          }
      </div>

      <div class="history-badges">

          ${
            index === 0
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

<button class="secondary-button edit-bank-transaction" data-id="${item.id}" title="Edit">
  <i data-lucide="pencil"></i>
</button>

<button class="danger-button delete-bank-transaction" data-id="${item.id}" title="Hapus">
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

  const html = historyCards.join('')

  const totalTransfer = transactions.reduce(
    (t, item) => t + (Number(item.transfer_amount) || 0),
    0
  )

  const totalAdmin = transactions.reduce(
    (t, item) => t + (Number(item.admin_fee) || 0),
    0
  )

  const totalExpense = isHoldingAccount
    ? transactions
        .filter((item) => item.direction === 'out')
        .reduce(
          (t, item) =>
            t +
            (Number(item.transfer_amount) || 0) +
            (Number(item.admin_fee) || 0),
          0
        )
    : totalTransfer + totalAdmin

  const totalReceived = isHoldingAccount
    ? transactions
        .filter((item) => item.direction === 'in')
        .reduce((t, item) => t + (Number(item.transfer_amount) || 0), 0)
    : totalIncome

  bankHistoryContent.innerHTML = `

<div class="history-summary">

    <div class="history-summary-main">

        <small>Saldo Saat Ini</small>

        <h2 class="history-current-balance">
            ${formatRupiah(historyBalance)}
        </h2>

    </div>

    <div class="history-summary-stats">

        <div class="history-stat">
            <span>Saldo Awal</span>
            <strong>${formatRupiah(openingBalance)}</strong>
        </div>

        <div class="history-stat">
            <span>${isHoldingAccount ? 'Dana Masuk' : 'Income'}</span>
            <strong class="income">
                ${formatRupiah(totalReceived)}
            </strong>
        </div>

        <div class="history-stat">
            <span>${isHoldingAccount ? 'Dana Keluar' : 'Transfer'}</span>
            <strong class="expense">
                ${formatRupiah(totalExpense)}
            </strong>
        </div>

    </div>

</div>

${html}
`

  lucide.createIcons()

  const transactionMap = new Map(
    transactions.map((item) => [String(item.id), item])
  )

  bankHistoryContent
    .querySelectorAll('.edit-bank-transaction')
    .forEach((button) => {
      button.onclick = () => {
        const trx = transactionMap.get(button.dataset.id)

        if (trx) {
          openEditBankTransaction(trx)
        }
      }
    })

  bankHistoryContent
    .querySelectorAll('.delete-bank-transaction')
    .forEach((button) => {
      button.onclick = () => {
        deleteBankTransaction(button.dataset.id)
      }
    })
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
