const nextTransactionButton = document.getElementById('nextTransactionButton')

let keepModalOpen = false

function updateFlowOptions() {
  const selectedKitchen =
    kitchenSelect.options[kitchenSelect.selectedIndex]?.text || ''

  const hasGas =
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

  if (hasGas) {
    flowType.innerHTML += `
      <option value="gas">
        BELANJA GAS
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

  if (flowType.value === 'pemasukan' || flowType.value === 'gas') {
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

    updateFormFlow()

    return
  }

  // ======================
  // GAS
  // ======================

  if (flow === 'gas') {
    accountSelect.style.display = 'block'

    await loadAccountsFiltered(flow)

    const gasAccount = Array.from(accountSelect.options).find(
      (option) => option.value && option.text.includes('BNI')
    )

    if (gasAccount) {
      accountSelect.value = gasAccount.value
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

    updateFormFlow()

    return
  }

  updateFormFlow()
}

function resetFormState() {
  const currentKitchen = kitchenSelect.value

  const currentDate = transactionDate.value

  const currentFlow = flowType.value

  const currentAccount = accountSelect.value

  const currentSupplier = supplierSelect.value

  editingTransactionId = null

  submitButton.disabled = false

  submitButton.textContent = 'Simpan'

  transactionForm.reset()

  transactionDate.value = new Date().toISOString().split('T')[0]

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

    if (flowType.value === 'gas') {
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

  if (flowType.value === 'pemasukan' || flowType.value === 'gas') {
    accountSelect.disabled = isEditing
  }
}

async function editTransaction(transaction) {
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

  if (transaction.flow_type === 'income') {
    flowType.value = 'pemasukan'
  }

  if (transaction.flow_type === 'expense') {
    flowType.value = 'pengeluaran'
  }

  if (transaction.flow_type === 'neutral') {
    flowType.value = 'gas'
  }

  await toggleFields()

  if (transaction.account_id) {
    accountSelect.value = transaction.account_id
  }

  if (transaction.supplier_id) {
    supplierSelect.value = transaction.supplier_id
  }

  // ======================
  // GAS LOCK
  // ======================

  const isGas = transaction.flow_type === 'neutral'

  flowType.disabled = isGas

  accountSelect.disabled = isGas

  supplierSelect.disabled = isGas

  amountInput.value = formatNumber(String(transaction.amount))

  submitButton.textContent = 'Update'

  lockTransactionFields(true)

  openModal()
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

  if (!kitchenSelect.value) {
    showToast('Pilih dapur')

    return
  }

  if (!amountInput.value) {
    showToast('Nominal wajib diisi')

    return
  }

  if (flow === 'pemasukan' || flow === 'gas') {
    if (!accountSelect.value) {
      showToast('Rekening wajib dipilih')

      return
    }
  }

  if (flow === 'pengeluaran') {
    if (!supplierSelect.value) {
      showToast('Supplier wajib dipilih')

      return
    }
  }

  const payload = {
    transaction_date: transactionDate.value,

    kitchen_id: kitchenSelect.value,

    amount: Number(amountInput.value.replace(/\./g, ''))
  }

  if (flow === 'pemasukan') {
    payload.flow_type = 'income'

    payload.category = 'RAB'

    payload.account_id = accountSelect.value

    payload.supplier_id = null
  }

  if (flow === 'pengeluaran') {
    payload.flow_type = 'expense'

    payload.category = 'Supplier'

    payload.account_id = null

    payload.supplier_id = supplierSelect.value
  }

  if (flow === 'gas') {
    payload.flow_type = 'neutral'

    payload.category = 'GAS'

    payload.account_id = accountSelect.value

    payload.supplier_id = null
  }

  submitButton.disabled = true

  const originalText = submitButton.textContent

  submitButton.textContent = 'Menyimpan...'

  try {
    let duplicateCheckQuery = supabaseClient
      .from('transactions')
      .select('id')
      .eq('transaction_date', payload.transaction_date)
      .eq('kitchen_id', payload.kitchen_id)
      .eq('flow_type', payload.flow_type)
      .eq('amount', payload.amount)

    if (payload.flow_type === 'expense') {
      duplicateCheckQuery = duplicateCheckQuery.eq(
        'supplier_id',
        payload.supplier_id
      )
    }

    if (payload.flow_type === 'income' || payload.flow_type === 'neutral') {
      duplicateCheckQuery = duplicateCheckQuery.eq(
        'account_id',
        payload.account_id
      )
    }

    const duplicateCheck = await duplicateCheckQuery.limit(1)

    if (duplicateCheck.data?.length && !editingTransactionId) {
      const proceed = confirm('Kemungkinan transaksi duplikat. Tetap simpan?')

      if (!proceed) {
        return
      }
    }

    let query = supabaseClient.from('transactions')

    if (editingTransactionId) {
      query = query.update(payload).eq('id', editingTransactionId)
    } else {
      query = query.insert(payload)
    }

    const { error } = await query

    if (error) {
      console.error(error)

      showToast('Gagal simpan transaksi')

      return
    }

    showToast('Transaksi berhasil disimpan')

    if (keepModalOpen && !editingTransactionId) {
      resetFormState()

      amountInput.value = ''

      amountInput.focus()
    } else {
      closeModal()

      resetFormState()
    }

    await loadTransactions()

    await loadDashboard()

    await loadDailyStatus()
  } catch (error) {
    console.error(error)

    showToast('Terjadi kesalahan')
  } finally {
    submitButton.disabled = false

    submitButton.textContent = originalText

    keepModalOpen = false
  }
})

transactionForm.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return

  if (event.target !== amountInput) return

  event.preventDefault()

  keepModalOpen = true

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

nextTransactionButton?.addEventListener(
  'click',

  () => {
    keepModalOpen = true

    transactionForm.requestSubmit()
  }
)
