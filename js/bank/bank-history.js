let currentHistoryAccountId = null
let bankHistoryRequestId = 0

const bankHistoryModal = document.getElementById('bankHistoryModal')
const bankHistoryTitle = document.getElementById('bankHistoryTitle')
const bankHistoryContent = document.getElementById('bankHistoryContent')
const closeBankHistory = document.getElementById('closeBankHistory')

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
    bankHistoryContent.innerHTML = `
      <div class="history-error">
        <i data-lucide="triangle-alert"></i>
        <h3>Konfigurasi tanggal tidak ditemukan</h3>
        <p>Pastikan bank.js dan constants.js sudah termuat sebelum bank-history.js.</p>
      </div>
    `
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

    bankHistoryContent.innerHTML = `
    <div class="history-error">
      <i data-lucide="triangle-alert"></i>
      <h3>Gagal memuat rekening</h3>
      <p>Terjadi kesalahan saat mengambil data rekening.</p>
    </div>
  `

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
    return new Date(a.transaction_date) - new Date(b.transaction_date)
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

  const openingBalance = Number(account.opening_balance) || 0

  if (!transactions.length) {
    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryTitle.innerHTML = `
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
      Riwayat transaksi bank akan muncul di sini setelah anda
      melakukan transfer.
    </p>

  </div>
`

    lucide.createIcons()

    return
  }

  let historyBalance

  const disbursementIncome = (incomeResult.data ?? []).reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  )

  const transferIncome = transactions
    .filter((item) => item.historyType === 'in')
    .reduce((total, item) => total + Number(item.transfer_amount || 0), 0)

  const totalReceived = disbursementIncome + transferIncome

  const totalOut = transactions
    .filter((item) => item.historyType === 'out')
    .reduce((total, item) => {
      return (
        total +
        (Number(item.transfer_amount) || 0) +
        (Number(item.admin_fee) || 0)
      )
    }, 0)

  historyBalance = openingBalance + totalReceived - totalOut

  bankHistoryTitle.innerHTML = `
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

    const isIncoming = item.direction === 'in'

    const totalValue = isIncoming ? transferAmount : transferAmount + adminFee

    const paymentPurpose = item.payment_for?.trim()

    const transferLabel = isIncoming ? 'Dana Diterima' : 'Transfer Keluar'

    const totalLabel = 'Total Dana Terpotong'

    const cardClass = isIncoming
      ? 'history-card incoming'
      : 'history-card outgoing'

    const amountClass = isIncoming ? 'history-in' : 'history-out'

    const cardSaldo = cardBalance

    if (item.direction === 'in') {
      cardBalance -= transferAmount
    } else {
      cardBalance += transferAmount + adminFee
    }

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

  const totalExpense = transactions
    .filter((item) => item.direction === 'out')
    .reduce(
      (t, item) =>
        t + (Number(item.transfer_amount) || 0) + (Number(item.admin_fee) || 0),
      0
    )

  const totalTransferReceived = transactions
    .filter((item) => item.direction === 'in')
    .reduce((t, item) => t + (Number(item.transfer_amount) || 0), 0)

  bankHistoryContent.innerHTML = `

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
