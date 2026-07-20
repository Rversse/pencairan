function updateFlowOptions() {
  const selectedKitchen =
    kitchenSelect.options[kitchenSelect.selectedIndex]?.text || ''

  const hasOperational =
    !selectedKitchen.includes('Sukaraja') && !selectedKitchen.includes('Cihaur')

  flowType.innerHTML = `
    <option
      value=""
      disabled
      selected
      hidden
    >
      Pilih Transaksi
    </option>

    <option value="pemasukan">
      BELANJA BGN
    </option>

    <option value="pengeluaran">
      BELANJA SUPPLIER
    </option>
    `

  if (hasOperational) {
    flowType.innerHTML += `
    <option value="operational">
      OPERASIONAL
    </option>
  `
  }
}

function updateFormFlow() {
  const selectedKitchen =
    kitchenSelect.options[kitchenSelect.selectedIndex]?.text || ''

  const isSukaraja = selectedKitchen.includes(SUKARAJA_NAME)

  kitchenSelect.disabled = !transactionDate.value

  flowType.disabled = !kitchenSelect.value

  amountInput.disabled = true

  submitButton.disabled = true

  const flowSelected = !!flowType.value

  if (!flowSelected) {
    accountSelect.disabled = true

    supplierSelect.disabled = true

    amountInput.disabled = true

    submitButton.disabled = true

    return
  }

  if (flowType.value === 'pemasukan' || flowType.value === 'operational') {
    if (isSukaraja) {
      amountInput.disabled = !accountSelect.value

      submitButton.disabled = !accountSelect.value

      if (accountSelect.value) {
        amountInput.focus()
      }
    } else {
      amountInput.disabled = false

      submitButton.disabled = false

      amountInput.focus()
    }

    return
  }

  if (flowType.value === 'pengeluaran') {
    amountInput.disabled = !supplierSelect.value

    submitButton.disabled = !supplierSelect.value

    if (supplierSelect.value) {
      amountInput.focus()
    }
  }
}

async function toggleFields() {
  const flow = flowType.value

  accountSelect.style.display = 'none'

  supplierSelect.style.display = 'none'

  accountSelect.disabled = false

  supplierSelect.disabled = false

  if (!kitchenSelect.value) {
    updateFormFlow()

    return
  }

  // ======================
  // PEMASUKAN
  // ======================

  if (flow === 'pemasukan') {
    accountSelect.style.display = 'block'

    await loadAccountsFiltered(flow)

    const accounts = Array.from(accountSelect.options).filter(
      (option) => option.value
    )

    if (accounts.length === 1) {
      accountSelect.value = accounts[0].value
    }

    updateFormFlow()

    return
  }

  // ======================
  // OPERASIONAL
  // ======================

  if (flow === 'operational') {
    accountSelect.style.display = 'block'

    await loadAccountsFiltered(flow)

    const operationalAccount = Array.from(accountSelect.options).find(
      (option) => option.value && option.text.includes('BNI')
    )

    if (operationalAccount) {
      accountSelect.value = operationalAccount.value
    }

    updateFormFlow()

    return
  }

  // ======================
  // PENGELUARAN
  // ======================

  if (flow === 'pengeluaran') {
    supplierSelect.style.display = 'block'

    await loadSuppliersFiltered()

    const suppliers = Array.from(supplierSelect.options).filter(
      (option) => option.value
    )

    if (suppliers.length === 1) {
      supplierSelect.value = suppliers[0].value
    }

    updateFormFlow()

    return
  }

  updateFormFlow()
}

function resetFormState() {
  const currentKitchen = kitchenSelect.value

  const currentFlow = flowType.value

  const currentDate = transactionDate.value

  const currentAccount = accountSelect.value

  const currentSupplier = supplierSelect.value

  editingTransactionId = null

  submitButton.disabled = false

  submitButton.textContent = 'Simpan'

  transactionForm.reset()

  kitchenSelect.value = currentKitchen

  updateFlowOptions()

  flowType.value = currentFlow

  transactionDate.value = currentDate

  toggleFields().then(() => {
    if (flowType.value === 'pengeluaran') {
      supplierSelect.value = ''

      supplierSelect.focus()

      return
    }

    if (flowType.value === 'pemasukan') {
      accountSelect.value = ''

      accountSelect.focus()

      return
    }

    if (flowType.value === 'operational') {
      amountInput.focus()
    }
  })

  amountInput.value = ''

  updateFormFlow()

  lockTransactionFields(false)
}

function lockTransactionFields(isEditing) {
  kitchenSelect.disabled = isEditing

  flowType.disabled = isEditing

  if (flowType.value === 'pengeluaran') {
    supplierSelect.disabled = isEditing
  }

  if (flowType.value === 'pemasukan' || flowType.value === 'operational') {
    accountSelect.disabled = isEditing
  }
}

function setTransactionFlow(flowTypeValue) {
  switch (flowTypeValue) {
    case 'income':
      flowType.value = 'pemasukan'
      break

    case 'expense':
      flowType.value = 'pengeluaran'
      break

    case 'neutral':
      flowType.value = 'operational'
      break
  }
}

async function editTransaction(transaction) {
  submitButton.disabled = true
  if (window.currentUser?.role !== 'admin') {
    return
  }
  if (isTransactionLocked(transaction.transaction_date)) {
    showToast('Transaksi sudah dikunci')

    return
  }

  editingTransactionId = transaction.id

  transactionDate.value = transaction.transaction_date

  kitchenSelect.value = transaction.kitchen_id

  updateFlowOptions()

  setTransactionFlow(transaction.flow_type)

  await toggleFields()

  submitButton.disabled = false

  if (transaction.account_id) {
    accountSelect.value = transaction.account_id
  }

  if (transaction.supplier_id) {
    supplierSelect.value = transaction.supplier_id
  }

  // ======================
  // OPERASIONAL LOCK
  // ======================

  const isOperational = transaction.flow_type === 'neutral'

  flowType.disabled = isOperational
  accountSelect.disabled = isOperational
  supplierSelect.disabled = isOperational

  amountInput.value = formatNumber(String(transaction.amount))

  submitButton.textContent = 'Update'

  lockTransactionFields(true)

  openModal()

  // Fokus & blok seluruh nominal
  setTimeout(() => {
    amountInput.focus()
    amountInput.select()
  }, 50)
}

function getTransactionType(flow) {
  switch (flow) {
    case 'pemasukan':
      return {
        flow_type: 'income',
        category: 'RAB',
        account_id: accountSelect.value,
        supplier_id: null
      }

    case 'pengeluaran':
      return {
        flow_type: 'expense',
        category: 'Supplier',
        account_id: null,
        supplier_id: supplierSelect.value
      }

    case 'operational':
      return {
        flow_type: 'neutral',
        category: 'OPS',
        account_id: accountSelect.value,
        supplier_id: null
      }
  }
}

function getTransactionPayload(flow, amount) {
  const payload = {
    transaction_date: transactionDate.value,
    kitchen_id: kitchenSelect.value,
    amount: amount
  }

  const transactionType = getTransactionType(flow)

  payload.flow_type = transactionType.flow_type
  payload.category = transactionType.category
  payload.account_id = transactionType.account_id
  payload.supplier_id = transactionType.supplier_id

  return payload
}

function getTransactionAmount() {
  return Number(amountInput.value.replace(/\./g, ''))
}

function validateTransaction(flow, amount) {
  if (!kitchenSelect.value) {
    showToast('Pilih dapur')
    return false
  }

  if (amount <= 0) {
    showToast('Nominal harus lebih dari 0')
    return false
  }

  if (
    (flow === 'pemasukan' || flow === 'operational') &&
    !accountSelect.value
  ) {
    showToast('Rekening wajib dipilih')
    return false
  }

  if (flow === 'pengeluaran' && !supplierSelect.value) {
    showToast('Supplier wajib dipilih')
    return false
  }

  return true
}

async function hasDuplicateTransaction(payload) {
  let query = supabaseClient
    .from('transactions')
    .select('id')
    .eq('transaction_date', payload.transaction_date)
    .eq('kitchen_id', payload.kitchen_id)
    .eq('flow_type', payload.flow_type)
    .eq('amount', payload.amount)

  if (payload.flow_type === 'expense') {
    query = query.eq('supplier_id', payload.supplier_id)
  }

  if (payload.flow_type === 'income' || payload.flow_type === 'neutral') {
    query = query.eq('account_id', payload.account_id)
  }

  const { data } = await query.limit(1)

  return data?.length > 0
}

async function confirmDuplicateTransaction(payload) {
  if (editingTransactionId) {
    return true
  }

  if (!(await hasDuplicateTransaction(payload))) {
    return true
  }

  return confirm('Kemungkinan transaksi duplikat. Tetap simpan?')
}

async function persistTransaction(payload) {
  if (editingTransactionId) {
    return await supabaseClient
      .from('transactions')
      .update(payload)
      .eq('id', editingTransactionId)
  }

  return await supabaseClient.from('transactions').insert(payload)
}

async function handleTransactionSuccess(isEditing) {
  showToast('Transaksi berhasil disimpan')

  if (!isEditing) {
    resetFormState()

    amountInput.value = ''

    amountInput.focus()
  } else {
    hideTransactionModal()
  }

  await loadTransactions()
  await loadDashboard()
  await loadDailyStatus()
}

function setTransactionSubmitState(disabled, text) {
  submitButton.disabled = disabled
  submitButton.textContent = text
}

function handleTransactionError(error) {
  console.error(error)
  showToast('Terjadi kesalahan')
}

transactionForm.addEventListener('submit', async (event) => {
  if (window.currentUser?.role !== 'admin') {
    showToast('Akses ditolak')
    return
  }

  event.preventDefault()

  if (submitButton.disabled) {
    return
  }

  const flow = flowType.value

  const amount = getTransactionAmount()

  if (!validateTransaction(flow, amount)) {
    return
  }

  const payload = getTransactionPayload(flow, amount)

  setTransactionSubmitState(true, 'Menyimpan...')

  try {
    if (!(await confirmDuplicateTransaction(payload))) {
      return
    }

    const isEditing = Boolean(editingTransactionId)

    const { error } = await persistTransaction(payload)

    if (error) {
      handleTransactionError(error)

      return
    }

    await handleTransactionSuccess(isEditing)
  } catch (error) {
    handleTransactionError(error)
  } finally {
    setTransactionSubmitState(false, editingTransactionId ? 'Update' : 'Simpan')
  }
})

transactionForm.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return

  if (event.target !== amountInput) return

  event.preventDefault()

  transactionForm.requestSubmit()
})

kitchenSelect.addEventListener('change', async () => {
  updateFlowOptions()

  flowType.value = ''

  await toggleFields()

  updateFormFlow()
})

transactionDate.addEventListener('change', updateFormFlow)

flowType.addEventListener('change', updateFormFlow)

accountSelect.addEventListener('change', updateFormFlow)

supplierSelect.addEventListener('change', updateFormFlow)
