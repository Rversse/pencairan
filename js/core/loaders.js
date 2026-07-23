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

function cacheMappings(accountsResult, suppliersResult) {
  if (!accountsResult.error) {
    accountRulesCache = accountsResult.data
  }

  if (!suppliersResult.error) {
    supplierRulesCache = suppliersResult.data
  }
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
          account_number,
          income_suppliers!accounts_supplier_id_fkey (
            owner_name,
            is_active
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

  cacheMappings(accountsResult, suppliersResult)
}

async function fetchKitchens() {
  return await supabaseClient
    .from('kitchens')
    .select('*')
    .eq('is_active', true)
    .order('name')
}

function useKitchenCache() {
  if (!kitchenOptionsCache) {
    return false
  }

  renderKitchenOptions(kitchenOptionsCache)

  return true
}

function handleLoaderError(error) {
  console.error(error)
}

async function loadKitchens() {
  if (useKitchenCache()) {
    return
  }

  const { data, error } = await fetchKitchens()

  if (error) {
    handleLoaderError(error)

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

async function fetchSuppliers() {
  return await supabaseClient
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name')
}

function useSupplierCache() {
  if (!supplierOptionsCache) {
    return false
  }

  renderSupplierOptions(supplierOptionsCache)

  return true
}

async function loadSuppliers() {
  if (useSupplierCache()) {
    return
  }

  const { data, error } = await fetchSuppliers()

  if (error) {
    handleLoaderError(error)

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

function renderAccountPlaceholder() {
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
}

function renderEmptyAccount() {
  accountSelect.innerHTML = `
    <option value="">
      Tidak tersedia
    </option>
  `

  accountSelect.disabled = true
}

function buildAccountOptions(accounts) {
  let options = ''

  accounts.forEach((account) => {
    options += `
      <option value="${account.id}">
        ${account.name}${
          account.income_suppliers?.owner_name
            ? ` / ${account.income_suppliers.owner_name}`
            : ''
        } (${account.bank} - ${account.account_number})
      </option>
    `
  })

  return options
}

async function loadAccountsFiltered(flow) {
  const kitchenId = kitchenSelect.value

  if (!kitchenId) {
    accountSelect.innerHTML = ''
    return
  }

  const flowMap = {
    pemasukan: 'income',
    operational: 'neutral'
  }

  const dbFlow = flowMap[flow]

  const data = accountRulesCache.filter((item) => {
    return item.kitchen_id === kitchenId && item.flow_type === dbFlow
  })

  const uniqueAccounts = [
    ...new Map(
      data
        .filter(
          (item) =>
            item.accounts &&
            item.accounts.income_suppliers &&
            item.accounts.income_suppliers.is_active
        )
        .map((item) => [item.accounts.id, item.accounts])
    ).values()
  ].sort((a, b) => a.name.localeCompare(b.name, 'id'))

  renderAccountPlaceholder()

  if (!uniqueAccounts.length) {
    renderEmptyAccount()
    return
  }

  accountSelect.innerHTML += buildAccountOptions(uniqueAccounts)

  if (uniqueAccounts.length === 1) {
    accountSelect.value = uniqueAccounts[0].id
    accountSelect.disabled = true
  } else {
    accountSelect.disabled = false
  }
}

function renderSupplierPlaceholder() {
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
}

function renderEmptySupplier() {
  supplierSelect.innerHTML = `
    <option value="">
      Tidak tersedia
    </option>
  `

  supplierSelect.disabled = true
}

function buildSupplierOptions(suppliers) {
  let options = ''

  suppliers.forEach((supplier) => {
    options += `
      <option value="${supplier.id}">
        ${supplier.name}
      </option>
    `
  })

  return options
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

  renderSupplierPlaceholder()

  if (!uniqueSuppliers.length) {
    renderEmptySupplier()

    return
  }

  supplierSelect.innerHTML += buildSupplierOptions(uniqueSuppliers)

  if (uniqueSuppliers.length === 1) {
    supplierSelect.value = uniqueSuppliers[0].id

    supplierSelect.disabled = true
  } else {
    supplierSelect.disabled = false
  }
}
