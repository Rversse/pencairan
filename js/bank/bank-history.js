let currentHistoryAccountId = null

const bankHistoryModal = document.getElementById('bankHistoryModal')
const bankHistoryTitle = document.getElementById('bankHistoryTitle')
const bankHistoryContent = document.getElementById('bankHistoryContent')
const closeBankHistory = document.getElementById('closeBankHistory')

async function openBankHistory(accountId) {
  currentHistoryAccountId = accountId

  const effectiveStartDate =
    bankStartDate.value < BANK_MODULE_START_DATE
      ? BANK_MODULE_START_DATE
      : bankStartDate.value

  bankHistoryModal.classList.add('show')

  bankHistoryTitle.textContent = 'History Rekening'

  renderHistorySkeleton()

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
      .eq('flow_type', 'income')
      .eq('account_id', accountId)
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', bankEndDate.value),

    supabaseClient
      .from('accounts')
      .select(
        `
    bank,
    account_number,
    opening_balance,
    income_suppliers(owner_name)
  `
      )
      .eq('id', accountId)
      .single()
  ])

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

  const transactions = transactionResult.data ?? []

  const account = accountResult.data

  const openingBalance = Number(account.opening_balance) || 0

  if (!transactions.length) {
    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryTitle.innerHTML = `
  <div class="history-account-title">
    ${account.income_suppliers?.owner_name ?? '-'}
  </div>

  <div class="history-account-subtitle">
    ${account.bank} • ${getLastFiveDigits(account.account_number)}
  </div>
`

    bankHistoryContent.innerHTML = `
  <div class="history-summary">

    <div class="history-summary-info">

      <small>Saldo Awal</small>
      <h3>${formatRupiah(openingBalance)}</h3>

      <small style="margin-top:12px;">Saldo Saat Ini</small>
      <h2>${formatRupiah(openingBalance)}</h2>

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

  const totalExpense = transactions.reduce((total, item) => {
    const transferAmount = Number(item.transfer_amount) || 0
    const adminFee = Number(item.admin_fee) || 0

    return total + transferAmount + adminFee
  }, 0)

  const historyBalance = openingBalance + totalIncome - totalExpense

  let runningBalance = openingBalance + totalIncome

  bankHistoryTitle.innerHTML = `
    <div class="history-account-title">
      ${account.income_suppliers?.owner_name ?? '-'}
    </div>

    <div class="history-account-subtitle">
      ${account.bank} • ${getLastFiveDigits(account.account_number)}
    </div>
  `

  const historyCards = transactions
    .map((item) => {
      const transferAmount = Number(item.transfer_amount) || 0
      const adminFee = Number(item.admin_fee) || 0
      const totalOut = transferAmount + adminFee

      const paymentPurpose = item.payment_for?.trim()

      runningBalance -= totalOut

      return `
<div class="history-card">

  <div class="history-header">

    <div>

      <div class="history-recipient">
        ${item.recipient_name || 'Penerima tidak diketahui'}
      </div>

      <div class="history-date">
        ${formatDateShort(item.transaction_date)}
        •
        ${formatTime(item.created_at)}
      </div>

    </div>

    <div class="history-actions">

      <button
        class="secondary-button edit-bank-transaction"
        data-id="${item.id}"
      >
        ✏ Edit
      </button>

      <button
        class="danger-button delete-bank-transaction"
        data-id="${item.id}"
      >
        🗑 Hapus
      </button>

    </div>

  </div>

  <div class="history-details">

    <div class="history-row">
      <span>Transfer</span>
      <strong class="history-transfer">
        ${formatRupiah(transferAmount)}
      </strong>
    </div>

    <div class="history-row">
      <span>Admin</span>
      <strong class="history-admin">
        ${formatRupiah(adminFee)}
      </strong>
    </div>

    <div class="history-divider"></div>

    <div class="history-row">
      <span>Total Keluar</span>
      <strong class="history-out">
        ${formatRupiah(totalOut)}
      </strong>
    </div>

    <div class="history-row">
      <span>Saldo</span>
      <strong class="history-balance">
        ${formatRupiah(runningBalance)}
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
    .reverse()

  const html = historyCards.join('')

  bankHistoryContent.innerHTML = `
<div class="history-summary">

  <div class="history-summary-info">

    <small>Saldo Awal</small>
    <h3>${formatRupiah(openingBalance)}</h3>

    <small style="margin-top:12px;">Saldo Saat Ini</small>
    <h2>${formatRupiah(historyBalance)}</h2>

  </div>

</div>

${html}
`

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
