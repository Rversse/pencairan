let editingBankTransactionId = null

let recipientHistory = []

const bankSearch = document.getElementById('bankSearch')
const bankAccountSelect = document.getElementById('bankAccountSelect')
const bankCurrentBalance = document.getElementById('bankCurrentBalance')
const bankStartDate = document.getElementById('bankStartDate')
const bankEndDate = document.getElementById('bankEndDate')
const addBankTransactionButton = document.getElementById(
  'addBankTransactionButton'
)
const bankTransactionModal = document.getElementById('bankTransactionModal')
const bankTransactionForm = document.getElementById('bankTransactionForm')
const bankTransactionDate = document.getElementById('bankTransactionDate')
const destinationName = document.getElementById('destinationName')
const isHoldingTransfer = document.getElementById('isHoldingTransfer')
const transferAmount = document.getElementById('transferAmount')
const adminFee = document.getElementById('adminFee')
const paymentFor = document.getElementById('paymentFor')
const cancelBankTransaction = document.getElementById('cancelBankTransaction')
const bankTransactionTableContainer = document.getElementById(
  'bankTransactionTableContainer'
)

function getHoldingAccount() {
  return bankAccounts.find((account) => account.account_category === 'holding')
}

async function loadRecipientHistory() {
  const { data, error } = await supabaseClient
    .from('bank_transactions')
    .select('recipient_name, transaction_date')
    .gte('transaction_date', BANK_MODULE_START_DATE)
    .order('transaction_date', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  const used = new Set()

  recipientHistory = []

  for (const item of data ?? []) {
    const name = item.recipient_name?.trim().replace(/\s+/g, ' ')

    if (!name) continue

    const key = name.toLowerCase()

    if (used.has(key)) continue

    used.add(key)
    recipientHistory.push(name)
  }

  renderRecipientHistory()
}

function renderRecipientHistory() {
  const datalist = document.getElementById('recipientHistoryList')

  if (!datalist) return

  datalist.innerHTML = recipientHistory
    .map((name) => `<option value="${name}">`)
    .join('')
}

async function fetchBankTransactions() {
  const effectiveStartDate =
    bankStartDate.value < BANK_MODULE_START_DATE
      ? BANK_MODULE_START_DATE
      : bankStartDate.value

  const endDate = bankEndDate.value

  return Promise.all([
    supabaseClient
      .from('accounts')
      .select(
        `
  id,
  name,
  bank,
  account_number,
  opening_balance,
  supplier_id,
  account_category,
  income_suppliers (
    id,
    owner_name
  )
`
      )
      .eq('is_active', true)
      .order('bank')
      .order('account_number'),

    supabaseClient
      .from('transactions')
      .select('account_id,amount')
      .in('flow_type', ['income', 'neutral'])
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', endDate),

    supabaseClient
      .from('bank_transactions')
      .select(
        `
    id,
    account_id,
    recipient_name,
    payment_for,
    transfer_amount,
    admin_fee,
    transfer_type,
    transaction_date,
    created_at
`
      )
      .gte('transaction_date', effectiveStartDate)
      .lte('transaction_date', endDate)
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

function validateBankModuleDate(date) {
  if (date >= BANK_MODULE_START_DATE) {
    return true
  }

  showToast(
    `Data transaksi bank tersedia mulai ${formatDateShort(
      BANK_MODULE_START_DATE
    )}.`,
    'warning'
  )

  return false
}

async function loadBankTransactions() {
  if (!bankStartDate.value) {
    bankStartDate.value = getTodayLocal()
  }

  if (!bankEndDate.value) {
    bankEndDate.value = bankStartDate.value
  }

  if (bankStartDate.value < BANK_MODULE_START_DATE) {
    bankStartDate.value = BANK_MODULE_START_DATE
  }

  if (bankEndDate.value < BANK_MODULE_START_DATE) {
    bankEndDate.value = BANK_MODULE_START_DATE
  }

  addBankTransactionButton.disabled = true

  bankTransactionTableContainer.style.opacity = '.6'
  bankTransactionTableContainer.style.pointerEvents = 'none'

  try {
    const [accountsResult, incomeResult, expenseResult] =
      await fetchBankTransactions()

    if (checkBankQueryError(accountsResult, incomeResult, expenseResult)) {
      return
    }

    bankAccounts = accountsResult.data ?? []
    currentBankIncomes = incomeResult.data ?? []
    currentBankExpenses = expenseResult.data ?? []

    renderBankTransactionSummary(
      bankAccounts,
      currentBankIncomes,
      currentBankExpenses
    )

    populateBankAccountDropdown()

    await loadRecipientHistory()
  } finally {
    addBankTransactionButton.disabled = false

    bankTransactionTableContainer.style.opacity = ''
    bankTransactionTableContainer.style.pointerEvents = ''
  }
}

function openBankTransactionModal() {
  editingBankTransactionId = null

  bankTransactionForm.reset()

  bankTransactionDate.value = getTodayLocal()

  populateBankAccountDropdown()

  bankAccountSelect.disabled = false
  isHoldingTransfer.disabled = false

  bankAccountSelect.selectedIndex = 0

  updateBankCurrentBalance()

  transferAmount.value = ''

  adminFee.value = '0'

  isHoldingTransfer.checked = false
  updateHoldingTransferState()

  paymentFor.value = ''

  const submitButton = bankTransactionModal.querySelector(
    'button[type="submit"]'
  )

  submitButton.textContent = 'Simpan Transaksi'

  bankTransactionModal.classList.add('show')

  requestAnimationFrame(() => {
    destinationName.focus()
  })
}

function openEditBankTransaction(transaction) {
  editingBankTransactionId = transaction.id

  populateBankAccountDropdown()

  bankTransactionDate.value = transaction.transaction_date

  bankAccountSelect.value = transaction.account_id

  bankAccountSelect.disabled = true
  isHoldingTransfer.disabled = true

  updateBankCurrentBalance()

  isHoldingTransfer.checked = transaction.transfer_type === 'holding'

  updateHoldingTransferState()

  if (!isHoldingTransfer.checked) {
    destinationName.value = transaction.recipient_name ?? ''
  }

  transferAmount.value = formatNumber(String(transaction.transfer_amount))

  adminFee.value =
    Number(transaction.admin_fee) > 0
      ? formatNumber(String(transaction.admin_fee))
      : '0'

  paymentFor.value = transaction.payment_for ?? ''

  const submitButton = bankTransactionModal.querySelector(
    'button[type="submit"]'
  )

  submitButton.textContent = 'Update Transaksi'

  bankHistoryModal.classList.remove('show')

  bankTransactionModal.classList.add('show')

  bankTransactionForm.scrollTop = 0

  requestAnimationFrame(() => {
    transferAmount.focus()
  })
}

function closeBankTransactionModal() {
  editingBankTransactionId = null

  bankTransactionForm.reset()

  isHoldingTransfer.checked = false
  updateHoldingTransferState()

  if (bankCurrentBalance) {
    bankCurrentBalance.value = ''
  }

  bankAccountSelect.disabled = false
  isHoldingTransfer.disabled = false

  bankTransactionModal.classList.remove('show')
}

function getBankTransactionPayload() {
  const selectedAccount = bankAccounts.find(
    (account) => account.id === bankAccountSelect.value
  )

  const isHoldingSender = selectedAccount?.account_category === 'holding'

  return {
    transaction_date: bankTransactionDate.value,
    account_id: bankAccountSelect.value,
    recipient_name: destinationName.value.trim().replace(/\s+/g, ' '),
    transfer_amount: parseNumber(transferAmount.value),
    admin_fee: parseNumber(adminFee.value),
    payment_for: paymentFor.value.trim(),

    transfer_type: isHoldingSender
      ? 'normal'
      : isHoldingTransfer.checked
        ? 'holding'
        : 'normal',

    created_by: window.currentUser.id
  }
}

function validateBankTransaction(payload) {
  if (!payload.transaction_date) {
    showToast('Tanggal wajib diisi.', 'error')
    bankTransactionDate.focus()
    return false
  }

  if (!payload.account_id) {
    showToast('Pilih rekening pengirim.', 'error')
    bankAccountSelect.focus()
    return false
  }

  if (!payload.recipient_name) {
    showToast('Nama penerima wajib diisi.', 'error')
    destinationName.focus()
    return false
  }

  if (payload.transfer_amount <= 0) {
    showToast('Nominal transfer harus lebih dari 0.', 'error')
    transferAmount.focus()
    return false
  }

  if (payload.admin_fee < 0) {
    showToast('Biaya admin tidak boleh negatif.', 'error')
    adminFee.focus()
    return false
  }

  const currentBalance = getCurrentBankBalance(payload.account_id)
  const totalOut = payload.transfer_amount + payload.admin_fee

  let availableBalance = currentBalance

  if (editingBankTransactionId) {
    const oldTransaction = currentBankExpenses.find(
      (item) => item.id === editingBankTransactionId
    )

    if (oldTransaction) {
      availableBalance +=
        (Number(oldTransaction.transfer_amount) || 0) +
        (Number(oldTransaction.admin_fee) || 0)
    }
  }

  if (totalOut > availableBalance) {
    showToast(
      `Saldo tidak mencukupi. Saldo tersedia ${formatRupiah(availableBalance)}.`,
      'error'
    )

    transferAmount.focus()
    return false
  }

  return true
}

function getCurrentBankBalance(accountId) {
  const account = currentBankSummary.find(
    (item) => item.accountId === accountId
  )

  return account ? account.balance : 0
}

function updateBankCurrentBalance() {
  if (!bankCurrentBalance) return

  const accountId = bankAccountSelect.value

  if (!accountId) {
    bankCurrentBalance.value = ''
    return
  }

  bankCurrentBalance.value = formatRupiah(getCurrentBankBalance(accountId))
}

function updateHoldingTransferState() {
  const selectedAccount = bankAccounts.find(
    (account) => account.id === bankAccountSelect.value
  )

  const holdingAccount = getHoldingAccount()
  const isHoldingSender = selectedAccount?.account_category === 'holding'

  const card = document.getElementById('holdingTransferCard')

  if (!holdingAccount) {
    isHoldingTransfer.checked = false
    isHoldingTransfer.disabled = true

    destinationName.readOnly = false
    destinationName.classList.remove('field-locked')
    destinationName.value = ''

    card?.classList.remove('active')
    card?.classList.add('disabled')

    return
  }

  if (isHoldingSender) {
    isHoldingTransfer.checked = false
    isHoldingTransfer.disabled = true

    destinationName.readOnly = false
    destinationName.classList.remove('field-locked')
    destinationName.value = ''

    card?.classList.remove('active')
    card?.classList.add('disabled')

    return
  }

  isHoldingTransfer.disabled = editingBankTransactionId !== null

  if (isHoldingTransfer.checked) {
    destinationName.value = holdingAccount.name
  } else {
    destinationName.value = ''
  }

  destinationName.readOnly =
    isHoldingTransfer.checked || isHoldingTransfer.disabled

  destinationName.classList.toggle('field-locked', destinationName.readOnly)

  card?.classList.toggle('active', isHoldingTransfer.checked)
  card?.classList.toggle('disabled', isHoldingTransfer.disabled)
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
  const submitButton = bankTransactionForm.querySelector(
    'button[type="submit"]'
  )

  const originalText = submitButton.textContent

  submitButton.disabled = true
  submitButton.textContent = editingBankTransactionId
    ? 'Mengupdate...'
    : 'Menyimpan...'

  try {
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
  } finally {
    submitButton.disabled = false
    submitButton.textContent = originalText
  }
}

function clearDefaultAdminFee() {
  if (adminFee.value.replace(/\./g, '') === '0') {
    adminFee.value = ''
  }
}

const holdingTransferCard = document.getElementById('holdingTransferCard')

holdingTransferCard?.addEventListener('click', (e) => {
  if (isHoldingTransfer.disabled) return

  if (
    e.target.closest('.switch') ||
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'LABEL'
  ) {
    return
  }

  isHoldingTransfer.checked = !isHoldingTransfer.checked
  updateHoldingTransferState()
})

bankCurrentBalance?.addEventListener('dblclick', () => {
  navigator.clipboard.writeText(
    parseNumber(bankCurrentBalance.value).toString()
  )

  showToast('Saldo berhasil disalin.')
})

function focusNextOnEnter(currentElement, nextElement) {
  currentElement?.addEventListener('keydown', (e) => {
    if (e.isComposing) return
    if (e.key !== 'Enter') return

    e.preventDefault()

    if (typeof nextElement === 'function') {
      nextElement()
    } else {
      nextElement?.focus()
    }
  })
}

focusNextOnEnter(destinationName, paymentFor)
focusNextOnEnter(paymentFor, transferAmount)
focusNextOnEnter(transferAmount, adminFee)

focusNextOnEnter(adminFee, () => {
  bankTransactionForm.requestSubmit()
})

bankAccountSelect?.addEventListener('change', () => {
  updateBankCurrentBalance()
  updateHoldingTransferState()

  if (isHoldingTransfer.checked) {
    transferAmount.focus()
  } else {
    destinationName.focus()
  }
})

isHoldingTransfer?.addEventListener('change', () => {
  updateHoldingTransferState()
})

bankStartDate?.addEventListener('change', async (event) => {
  if (!validateBankModuleDate(event.target.value)) {
    bankStartDate.value = BANK_MODULE_START_DATE
  }

  bankEndDate.value = bankStartDate.value

  await loadBankTransactions()

  requestAnimationFrame(() => event.target.blur())
})

bankEndDate?.addEventListener('change', async (event) => {
  if (!validateBankModuleDate(event.target.value)) {
    bankEndDate.value = BANK_MODULE_START_DATE
  }

  await loadBankTransactions()

  requestAnimationFrame(() => event.target.blur())
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

document
  .getElementById('cancelBankTransactionTop')
  ?.addEventListener('click', () => {
    closeBankTransactionModal()
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
