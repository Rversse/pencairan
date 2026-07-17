let editingBankTransactionId = null

const applyBankFilter = document.getElementById('applyBankFilter')
const bankSearch = document.getElementById('bankSearch')

const bankAccountSelect = document.getElementById('bankAccountSelect')

const bankStartDate = document.getElementById('bankStartDate')
const bankEndDate = document.getElementById('bankEndDate')

const addBankTransactionButton = document.getElementById(
  'addBankTransactionButton'
)

const bankTransactionModal = document.getElementById('bankTransactionModal')
const bankTransactionForm = document.getElementById('bankTransactionForm')

const bankTransactionDate = document.getElementById('bankTransactionDate')
const destinationName = document.getElementById('destinationName')
const transferAmount = document.getElementById('transferAmount')
const adminFee = document.getElementById('adminFee')
const paymentFor = document.getElementById('paymentFor')
const cancelBankTransaction = document.getElementById('cancelBankTransaction')

const bankTransactionTableContainer = document.getElementById(
  'bankTransactionTableContainer'
)

async function loadBankTransactions() {
  if (!bankStartDate.value) {
    bankStartDate.value = getTodayLocal()
  }

  if (!bankEndDate.value) {
    bankEndDate.value = bankStartDate.value
  }

  const [accountsResult, incomeResult, expenseResult] = await Promise.all([
    supabaseClient
      .from('accounts')
      .select(
        `
        id,
        bank,
        account_number,
        supplier_id,
        income_suppliers (
          id,
          owner_name
        )
      `
      )
      .eq('is_active', true),

    supabaseClient
      .from('transactions')
      .select('account_id, amount')
      .eq('flow_type', 'income')
      .gte('transaction_date', bankStartDate.value)
      .lte('transaction_date', bankEndDate.value),

    supabaseClient
      .from('bank_transactions')
      .select(
        `
        id,
        account_id,
        transfer_amount,
        admin_fee
      `
      )
      .gte('transaction_date', bankStartDate.value)
      .lte('transaction_date', bankEndDate.value)
  ])

  if (accountsResult.error) {
    console.error(accountsResult.error)
    return
  }

  if (incomeResult.error) {
    console.error(incomeResult.error)
    return
  }

  if (expenseResult.error) {
    console.error(expenseResult.error)
    return
  }

  bankAccounts = accountsResult.data ?? []

  currentBankIncomes = incomeResult.data ?? []
  currentBankExpenses = expenseResult.data ?? []

  populateBankAccountDropdown()

  renderBankTransactionSummary(
    bankAccounts,
    incomeResult.data ?? [],
    expenseResult.data ?? []
  )
}

function openBankTransactionModal() {
  editingBankTransactionId = null

  bankTransactionForm.reset()

  bankTransactionDate.value = getTodayLocal()

  populateBankAccountDropdown()

  bankAccountSelect.selectedIndex = 0

  transferAmount.value = ''

  adminFee.value = ''

  destinationName.value = ''

  paymentFor.value = ''

  bankTransactionModal.querySelector('button[type="submit"]').textContent =
    'Simpan Transaksi'

  bankTransactionModal.classList.add('show')

  requestAnimationFrame(() => {
    bankAccountSelect.focus()
  })
}

function openEditBankTransaction(transaction) {
  editingBankTransactionId = transaction.id

  populateBankAccountDropdown()

  bankTransactionDate.value = transaction.transaction_date

  bankAccountSelect.value = transaction.account_id

  destinationName.value = transaction.recipient_name

  transferAmount.value = formatNumber(String(transaction.transfer_amount))

  adminFee.value =
    Number(transaction.admin_fee) === 0
      ? ''
      : formatNumber(String(transaction.admin_fee))

  paymentFor.value = transaction.payment_for ?? ''

  bankTransactionModal.querySelector('button[type="submit"]').textContent =
    'Update Transaksi'

  bankHistoryModal.classList.remove('show')

  bankTransactionModal.classList.add('show')
}

function closeBankTransactionModal() {
  bankTransactionForm.reset()

  bankTransactionModal.classList.remove('show')
}

async function saveBankTransaction() {
  console.log('saveBankTransaction() terpanggil')

  const transactionDate = bankTransactionDate.value

  const accountId = bankAccountSelect.value

  const recipientName = destinationName.value.trim()

  const transfer = parseNumber(transferAmount.value)

  const fee = parseNumber(adminFee.value)

  const purpose = paymentFor.value.trim()

  if (!transactionDate) {
    alert('Tanggal wajib diisi.')
    return
  }

  if (!accountId) {
    alert('Pilih nama pengirim.')
    return
  }

  if (!recipientName) {
    alert('Nama penerima wajib diisi.')
    return
  }

  if (transfer <= 0) {
    alert('Nominal transfer harus lebih dari 0.')
    return
  }

  const payload = {
    transaction_date: transactionDate,
    account_id: accountId,
    recipient_name: recipientName,
    transfer_amount: transfer,
    admin_fee: fee,
    payment_for: purpose,
    created_by: window.currentUser.id
  }

  let result

  if (editingBankTransactionId) {
    result = await supabaseClient
      .from('bank_transactions')
      .update(payload)
      .eq('id', editingBankTransactionId)
  } else {
    result = await supabaseClient.from('bank_transactions').insert(payload)
  }

  if (result.error) {
    console.error(result.error)

    showToast(
      editingBankTransactionId
        ? 'Gagal mengubah transaksi.'
        : 'Gagal menyimpan transaksi.',
      'error'
    )

    return
  }

  const edited = editingBankTransactionId !== null

  editingBankTransactionId = null

  closeBankTransactionModal()

  await loadBankTransactions()

  showToast(
    edited ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil disimpan.'
  )

  if (edited && currentHistoryAccountId) {
    await openBankHistory(currentHistoryAccountId)
  }
}

function clearDefaultAdminFee() {
  if (adminFee.value.replace(/\./g, '') === '0') {
    adminFee.value = ''
  }
}

applyBankFilter?.addEventListener('click', async () => {
  await loadBankTransactions()
})

addBankTransactionButton?.addEventListener('click', () => {
  openBankTransactionModal()
})

cancelBankTransaction?.addEventListener('click', () => {
  closeBankTransactionModal()
})

bankTransactionForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  await saveBankTransaction()
})

transferAmount?.addEventListener('input', (event) => {
  event.target.value = formatNumber(event.target.value)
})

adminFee?.addEventListener('input', (event) => {
  event.target.value = formatNumber(event.target.value)
})

adminFee?.addEventListener('focus', clearDefaultAdminFee)
adminFee?.addEventListener('click', clearDefaultAdminFee)

adminFee?.addEventListener('blur', () => {
  if (!adminFee.value.trim()) {
    adminFee.value = '0'
  }
})
