async function init() {
  await loadKitchens()

  await loadSuppliers()

  await loadAccountsFiltered('pemasukan')
}

async function loadKitchens() {
  const { data, error } = await supabaseClient
    .from('kitchens')
    .select('*')
    .order('name')

  if (error) {
    console.error(error)

    return
  }

  kitchenSelect.innerHTML = `
    <option
      value=""
      disabled
      selected
      hidden
    >
      Pilih Dapur
    </option>
    `

  filterKitchen.innerHTML = `
    <option value="">
      Semua Dapur
    </option>
    `

  data.forEach((kitchen) => {
    filterKitchen.innerHTML += `
      <option value="${kitchen.id}">
        ${kitchen.name}
      </option>
    `

    kitchenSelect.innerHTML += `
      <option value="${kitchen.id}">
        ${kitchen.name}
      </option>
    `
  })
}

async function loadSuppliers() {
  const { data, error } = await supabaseClient
    .from('suppliers')
    .select('*')
    .order('name')

  if (error) {
    console.error(error)

    return
  }

  supplierSelect.innerHTML = `
    <option value="">
      Pilih Supplier
    </option>
    `

  data.forEach((supplier) => {
    supplierSelect.innerHTML += `
      <option value="${supplier.id}">
        ${supplier.name}
      </option>
    `
  })
}

async function loadAccountsFiltered(flow) {
  const kitchenId = kitchenSelect.value

  if (!kitchenId) {
    accountSelect.innerHTML = ''

    return
  }

  const flowMap = {
    pemasukan: 'income',
    gas: 'neutral'
  }

  const dbFlow = flowMap[flow]

  const { data, error } = await supabaseClient
    .from('kitchen_account_rules')
    .select(
      `
        account_id,
        accounts (
          id,
          name,
          bank
        )
      `
    )
    .eq('kitchen_id', kitchenId)
    .eq('flow_type', dbFlow)

  if (error) {
    console.error(error)

    return
  }

  accountSelect.innerHTML = `
<option
  value=""
  disabled
  selected
  hidden
>
  Pilih Rekening
</option>
    `

  if (!data.length) {
    accountSelect.innerHTML = `
      <option value="">
        Tidak tersedia
      </option>
      `

    accountSelect.disabled = true

    return
  }

  data.forEach((item) => {
    const account = item.accounts

    if (!account) {
      return
    }

    accountSelect.innerHTML += `
    <option value="${account.id}">
      ${account.name} (${account.bank})
    </option>
  `
  })

  const validAccounts = data.filter((item) => item.accounts)

  if (validAccounts.length === 1) {
    accountSelect.value = validAccounts[0].accounts.id

    accountSelect.disabled = true
  } else {
    accountSelect.disabled = false
  }
}

async function loadSuppliersFiltered() {
  const kitchenId = kitchenSelect.value

  if (!kitchenId) {
    supplierSelect.innerHTML = ''

    return
  }

  const { data, error } = await supabaseClient
    .from('kitchen_supplier_rules')
    .select(
      `
        supplier_id,
        suppliers (
          id,
          name
        )
      `
    )
    .eq('kitchen_id', kitchenId)

  if (error) {
    console.error(error)

    return
  }

  supplierSelect.innerHTML = `
    <option
      value=""
      disabled
      selected
      hidden
    >
      Pilih Supplier
    </option>
    `

  if (!data.length) {
    supplierSelect.innerHTML = `
      <option value="">
        Tidak tersedia
      </option>
      `

    supplierSelect.disabled = true

    return
  }

  data.forEach((item) => {
    const supplier = item.suppliers

    supplierSelect.innerHTML += `
      <option value="${supplier.id}">
        ${supplier.name}
      </option>
    `
  })

  if (data.length === 1) {
    supplierSelect.value = data[0].suppliers.id

    supplierSelect.disabled = true
  } else {
    supplierSelect.disabled = false
  }
}
