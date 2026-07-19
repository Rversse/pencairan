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

async function fetchBankTransactions() {
  return await Promise.all([
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
}

function checkBankQueryError(...results) {
  for (const result of results) {
    if (result.error) {
      console.error(result.error)
      return true
    }
  }

  return false
}

async function loadBankTransactions() {
  if (!bankStartDate.value) {
    bankStartDate.value = getTodayLocal()
  }

  if (!bankEndDate.value) {
    bankEndDate.value = bankStartDate.value
  }

  const [accountsResult, incomeResult, expenseResult] =
    await fetchBankTransactions()

  if (checkBankQueryError(accountsResult, incomeResult, expenseResult)) {
    return
  }

  bankAccounts = accountsResult.data ?? []
  currentBankIncomes = incomeResult.data ?? []
  currentBankExpenses = expenseResult.data ?? []

  populateBankAccountDropdown()

  renderBankTransactionSummary(
    bankAccounts,
    currentBankIncomes,
    currentBankExpenses
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

function getBankTransactionPayload() {
  return {
    transaction_date: bankTransactionDate.value,
    account_id: bankAccountSelect.value,
    recipient_name: destinationName.value.trim(),
    transfer_amount: parseNumber(transferAmount.value),
    admin_fee: parseNumber(adminFee.value),
    payment_for: paymentFor.value.trim(),
    created_by: window.currentUser.id
  }
}

function validateBankTransaction(payload) {
  if (!payload.transaction_date) {
    alert('Tanggal wajib diisi.')
    return false
  }

  if (!payload.account_id) {
    alert('Pilih nama pengirim.')
    return false
  }

  if (!payload.recipient_name) {
    alert('Nama penerima wajib diisi.')
    return false
  }

  if (payload.transfer_amount <= 0) {
    alert('Nominal transfer harus lebih dari 0.')
    return false
  }

  return true
}

async function persistBankTransaction(payload) {
  if (editingBankTransactionId) {
    return await supabaseClient
      .from('bank_transactions')
      .update(payload)
      .eq('id', editingBankTransactionId)
  }

  return await supabaseClient.from('bank_transactions').insert(payload)
}

async function saveBankTransaction() {
  const payload = getBankTransactionPayload()

  if (!validateBankTransaction(payload)) {
    return
  }

  const result = await persistBankTransaction(payload)

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

bankStartDate?.addEventListener('change', async () => {
  bankEndDate.value = bankStartDate.value

  await loadBankTransactions()
})

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
