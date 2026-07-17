let currentHistoryAccountId = null

const bankHistoryModal = document.getElementById('bankHistoryModal')
const bankHistoryTitle = document.getElementById('bankHistoryTitle')
const bankHistoryContent = document.getElementById('bankHistoryContent')
const closeBankHistory = document.getElementById('closeBankHistory')

async function openBankHistory(accountId) {
  currentHistoryAccountId = accountId

  bankHistoryModal.classList.add('show')

  bankHistoryTitle.textContent = 'Memuat...'

  bankHistoryContent.innerHTML = `
    <div style="padding:32px;text-align:center">
      Memuat history...
    </div>
  `

  const [transactionResult, incomeResult] = await Promise.all([
    supabaseClient
      .from('bank_transactions')
      .select(
        `
        *,
        accounts(
          bank,
          account_number,
          income_suppliers(owner_name)
        )
      `
      )
      .eq('account_id', accountId)
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true }),

    supabaseClient
      .from('transactions')
      .select('amount')
      .eq('flow_type', 'income')
      .eq('account_id', accountId)
  ])

  if (transactionResult.error) {
    console.error(transactionResult.error)

    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryContent.innerHTML = `
      <div style="padding:32px;text-align:center">
        Gagal memuat history.
      </div>
    `

    return
  }

  const transactions = transactionResult.data ?? []

  if (!transactions.length) {
    bankHistoryTitle.textContent = 'History Rekening'

    bankHistoryContent.innerHTML = `
      <div style="padding:32px;text-align:center">
        Belum ada transaksi.
      </div>
    `

    return
  }

  const account = transactions[0].accounts

  const totalIncome = (incomeResult.data ?? []).reduce(
    (total, item) => total + Number(item.amount),
    0
  )

  const totalExpense = transactions.reduce(
    (total, item) =>
      total + Number(item.transfer_amount) + Number(item.admin_fee),
    0
  )

  let runningBalance = totalIncome

  bankHistoryTitle.innerHTML = `
    <div class="history-account-title">
      ${account.income_suppliers?.owner_name ?? '-'}
    </div>

    <div class="history-account-subtitle">
      ${account.bank} • ${getLastFiveDigits(account.account_number)}
    </div>
  `

  const html = transactions
    .map((item) => {
      const totalOut = Number(item.transfer_amount) + Number(item.admin_fee)

      runningBalance -= totalOut

      return `
        <div class="history-card">

          <div class="history-date">
            ${formatDateShort(item.transaction_date)}
          </div>

          <div class="history-recipient">
            ${item.recipient_name}
          </div>

          <div class="history-grid">

            <span>Transfer</span>
            <strong>${formatRupiah(item.transfer_amount)}</strong>

            <span>Biaya Admin</span>
            <strong>${formatRupiah(item.admin_fee)}</strong>

            <span>Total Keluar</span>
            <strong>${formatRupiah(totalOut)}</strong>

            <span>Saldo Setelah</span>
            <strong class="history-balance">
              ${formatRupiah(runningBalance)}
            </strong>

          </div>

          ${
            item.payment_for
              ? `
                <div class="history-purpose">
                  ${item.payment_for}
                </div>
              `
              : ''
          }

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
      `
    })
    .reverse()
    .join('')

  bankHistoryContent.innerHTML = `
    <div class="history-summary">

      <div class="history-summary-info">

        <small>Saldo Saat Ini</small>

        <h2>${formatRupiah(totalIncome - totalExpense)}</h2>

      </div>

      <div class="history-summary-badge">
        AKTIF
      </div>

    </div>

    ${html}
  `

  bankHistoryContent
    .querySelectorAll('.edit-bank-transaction')
    .forEach((button) => {
      const trx = transactions.find((item) => item.id === button.dataset.id)

      button.onclick = () => openEditBankTransaction(trx)
    })

  bankHistoryContent
    .querySelectorAll('.delete-bank-transaction')
    .forEach((button) => {
      button.onclick = () => deleteBankTransaction(button.dataset.id)
    })
}

async function deleteBankTransaction(id) {
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
}

closeBankHistory?.addEventListener('click', () => {
  bankHistoryModal.classList.remove('show')
})
