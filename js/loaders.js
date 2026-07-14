let kitchenOptionsCache = null

let supplierOptionsCache = null

let accountRulesCache = []

let supplierRulesCache = []

async function init() {
  await loadKitchens()

  await loadSuppliers()

  await preloadMappings()

  await loadAccountsFiltered('pemasukan')
}

async function preloadMappings() {
  const [accountsResult, suppliersResult] = await Promise.all([
    supabaseClient.from('kitchen_account_rules').select(`
        kitchen_id,
        flow_type,
        account_id,
        accounts (
          id,
          name,
          bank,
          is_active,
          income_suppliers!accounts_supplier_id_fkey (
            owner_name
          )
        )
      `),

    supabaseClient.from('kitchen_supplier_rules').select(`
        kitchen_id,
        supplier_id,
        suppliers (
          id,
          name,
          is_active
        )
      `)
  ])

  if (!accountsResult.error) {
    accountRulesCache = accountsResult.data
  }

  if (!suppliersResult.error) {
    supplierRulesCache = suppliersResult.data
  }
}

async function loadKitchens() {
  if (kitchenOptionsCache) {
    renderKitchenOptions(kitchenOptionsCache)
    return
  }

  const { data, error } = await supabaseClient
    .from('kitchens')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error(error)

    return
  }

  kitchenOptionsCache = data

  renderKitchenOptions(data)
}

function renderKitchenOptions(data) {
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
  if (supplierOptionsCache) {
    renderSupplierOptions(supplierOptionsCache)
    return
  }

  const { data, error } = await supabaseClient
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error(error)

    return
  }

  supplierOptionsCache = data

  renderSupplierOptions(data)
}

function renderSupplierOptions(data) {
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

  const data = accountRulesCache.filter((item) => {
    return item.kitchen_id === kitchenId && item.flow_type === dbFlow
  })

  const uniqueAccounts = [
    ...new Map(
      data
        .filter((item) => item.accounts && item.accounts.is_active)
        .map((item) => [item.accounts.id, item.accounts])
    ).values()
  ]

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

  if (!uniqueAccounts.length) {
    accountSelect.innerHTML = `
      <option value="">
        Tidak tersedia
      </option>
    `

    accountSelect.disabled = true

    return
  }

  let options = ''

  uniqueAccounts.forEach((account) => {
    options += `
  <option value="${account.id}">
    ${account.name}${
      account.income_suppliers?.owner_name
        ? ` / ${account.income_suppliers.owner_name}`
        : ''
    } (${account.bank})
  </option>
`
  })

  accountSelect.innerHTML += options

  if (uniqueAccounts.length === 1) {
    accountSelect.value = uniqueAccounts[0].id

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

  const data = supplierRulesCache.filter((item) => {
    return item.kitchen_id === kitchenId
  })

  const uniqueSuppliers = [
    ...new Map(
      data
        .filter((item) => item.suppliers && item.suppliers.is_active)
        .map((item) => [item.suppliers.id, item.suppliers])
    ).values()
  ]

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

  if (!uniqueSuppliers.length) {
    supplierSelect.innerHTML = `
      <option value="">
        Tidak tersedia
      </option>
    `

    supplierSelect.disabled = true

    return
  }

  let options = ''

  uniqueSuppliers.forEach((supplier) => {
    options += `
      <option value="${supplier.id}">
        ${supplier.name}
      </option>
    `
  })

  supplierSelect.innerHTML += options

  if (uniqueSuppliers.length === 1) {
    supplierSelect.value = uniqueSuppliers[0].id

    supplierSelect.disabled = true
  } else {
    supplierSelect.disabled = false
  }
}
