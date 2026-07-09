const mappingEditor = document.getElementById('mappingEditor')
const supplierModal = document.getElementById('supplierModal')
const closeSupplierModal = document.getElementById('closeSupplierModal')
const accountModal = document.getElementById('accountModal')
const accountEditor = document.getElementById('accountEditor')
const supplierBusinessName = document.getElementById('supplierBusinessName')
const supplierOwnerName = document.getElementById('supplierOwnerName')
const supplierProductType = document.getElementById('supplierProductType')
const supplierPhone = document.getElementById('supplierPhone')
const supplierAddress = document.getElementById('supplierAddress')
const supplierStatus = document.getElementById('supplierStatus')
const saveSupplierButton = document.getElementById('saveSupplierButton')
const supplierAccountsList = document.getElementById('supplierAccountsList')
const addAccountButton = document.getElementById('addAccountButton')
const accountModalTitle = document.getElementById('accountModalTitle')
const closeAccountModal = document.getElementById('closeAccountModal')
const accountBank = document.getElementById('accountBank')
const accountNumber = document.getElementById('accountNumber')
const accountStatus = document.getElementById('accountStatus')
const saveAccountButton = document.getElementById('saveAccountButton')
const kitchenMappingList = document.getElementById('kitchenMappingList')
const saveKitchenMappingButton = document.getElementById(
  'saveKitchenMappingButton'
)
const supplierModalTitle = document.getElementById('supplierModalTitle')

let currentAccountId = null

let supplierMaster = []

let supplierMode = 'edit'

let currentSupplierId = null

addAccountButton?.addEventListener('click', () => {
  if (currentUser?.role !== 'admin') {
    return
  }
  currentAccountId = null

  accountBank.value = 'BNI'
  accountNumber.value = ''
  accountStatus.value = 'true'

  accountEditor.style.display = 'block'

  accountBank.focus()
})

function openNewSupplierModal() {
  if (currentUser?.role !== 'admin') {
    return
  }

  supplierMode = 'add'
  currentSupplierId = null

  supplierBusinessName.value = ''
  supplierOwnerName.value = ''
  supplierProductType.value = ''
  supplierPhone.value = ''
  supplierAddress.value = ''
  supplierStatus.value = 'true'

  supplierModalTitle.textContent = 'Tambah Supplier'

  supplierModal.style.display = 'flex'

  resetModalScroll(supplierModal)
}

function renderSupplierAccounts(accounts) {
  if (!accounts.length) {
    supplierAccountsList.innerHTML = `
      <div class="empty-state">
        Supplier belum memiliki rekening.
      </div>
    `
    return
  }

  supplierAccountsList.innerHTML = accounts
    .map((account) => {
      const totalKitchens = new Set(
        account.kitchen_account_rules.map((rule) => rule.kitchen_id)
      ).size

      return `
<div class="supplier-account-card">

  <div class="account-info">

    <strong>${account.bank}</strong>

    <div class="account-number">
      ${account.account_number ?? '-'}
    </div>

    <div class="account-status">
      ${
        account.is_active
          ? '<span class="badge badge-income">Aktif</span>'
          : '<span class="badge badge-expense">Nonaktif</span>'
      }
    </div>

    <small>
      ${totalKitchens} dapur
    </small>

  </div>

  ${
    currentUser?.role === 'admin'
      ? `
      <div class="account-actions">

        <button
          class="editAccountButton"
          data-id="${account.id}"
        >
          ✏ Edit
        </button>

        <button
          class="mappingAccountButton"
          data-id="${account.id}"
        >
          🏠 Mapping
        </button>

      </div>
      `
      : ''
  }

</div>
`
    })
    .join('')

  document.querySelectorAll('.editAccountButton').forEach((button) => {
    button.addEventListener('click', () => {
      openAccountModal(button.dataset.id)
    })
  })

  document.querySelectorAll('.mappingAccountButton').forEach((button) => {
    button.addEventListener('click', () => {
      openKitchenMapping(button.dataset.id)
    })
  })
}

async function saveKitchenMapping() {
  if (currentUser?.role !== 'admin') {
    return
  }
  const checked = [
    ...document.querySelectorAll('#kitchenMappingList input:checked')
  ].map((item) => item.value)

  const { error: deleteError } = await supabaseClient
    .from('kitchen_account_rules')
    .delete()
    .eq('account_id', currentAccountId)
    .eq('flow_type', 'income')

  if (deleteError) {
    console.error(deleteError)
    alert('Gagal menghapus mapping lama.')
    return
  }

  if (checked.length) {
    const payload = checked.map((kitchenId) => ({
      account_id: currentAccountId,
      kitchen_id: kitchenId,
      flow_type: 'income'
    }))

    const { error: insertError } = await supabaseClient
      .from('kitchen_account_rules')
      .insert(payload)

    if (insertError) {
      console.error(insertError)
      alert('Gagal menyimpan mapping.')
      return
    }
  }

  alert('Mapping berhasil disimpan.')

  await loadSupplierMaster()

  openAccountManager(currentSupplierId)

  mappingEditor.style.display = 'none'
}

function resetAccountEditor() {
  currentAccountId = null

  accountEditor.style.display = 'none'
  mappingEditor.style.display = 'none'

  kitchenMappingList.innerHTML = ''

  accountBank.value = 'BNI'
  accountNumber.value = ''
  accountStatus.value = 'true'
}

async function openKitchenMapping(accountId) {
  if (currentUser?.role !== 'admin') {
    return
  }
  currentAccountId = accountId

  const { data: kitchens, error: kitchenError } = await supabaseClient
    .from('kitchens')
    .select('id,name')
    .eq('is_active', true)
    .order('name')

  if (kitchenError) {
    console.error(kitchenError)
    return
  }

  const { data: rules, error: ruleError } = await supabaseClient
    .from('kitchen_account_rules')
    .select('kitchen_id')
    .eq('account_id', accountId)

  if (ruleError) {
    console.error(ruleError)
    return
  }

  const selected = new Set(rules.map((rule) => rule.kitchen_id))

  kitchenMappingList.innerHTML = kitchens
    .map(
      (kitchen) => `
      <label class="mapping-item">
        <input
          type="checkbox"
          value="${kitchen.id}"
          ${selected.has(kitchen.id) ? 'checked' : ''}
        >
        ${kitchen.name}
      </label>
    `
    )
    .join('')

  accountEditor.style.display = 'none'
  mappingEditor.style.display = 'block'
}

function openAccountModal(id) {
  if (currentUser?.role !== 'admin') {
    return
  }

  currentAccountId = id

  const supplier = supplierMaster.find((supplier) =>
    supplier.accounts.some((account) => account.id === id)
  )

  if (!supplier) return

  const account = supplier.accounts.find((account) => account.id === id)

  if (!account) return

  accountBank.value = account.bank
  accountNumber.value = account.account_number ?? ''
  accountStatus.value = String(account.is_active)

  mappingEditor.style.display = 'none'
  accountEditor.style.display = 'block'
  accountModal.style.display = 'flex'
}

async function loadSupplierMaster() {
  const { data, error } = await supabaseClient
    .from('income_suppliers')
    .select(
      `
      *,
      accounts (
        id,
        bank,
        account_number,
        is_active,
        kitchen_account_rules (
          kitchen_id
        )
      )
    `
    )
    .order('business_name')

  if (error) {
    console.error(error)
    return
  }

  supplierMaster = data

  renderSupplierMaster()
}

function openAccountManager(id) {
  if (currentUser?.role !== 'admin') {
    return
  }

  resetAccountEditor()

  currentSupplierId = id

  const supplier = supplierMaster.find((item) => item.id === id)

  if (!supplier) return

  accountModalTitle.textContent = `Rekening - ${supplier.business_name}`

  renderSupplierAccounts(supplier.accounts)

  accountModal.style.display = 'flex'

  resetModalScroll(accountModal)
}

function renderSupplierMaster() {
  const isAdmin = currentUser?.role === 'admin'

  const keyword = supplierMasterSearch.value.trim().toLowerCase()

  let rows = ''

  supplierMaster
    .filter((supplier) => {
      return (
        supplier.business_name.toLowerCase().includes(keyword) ||
        (supplier.owner_name ?? '').toLowerCase().includes(keyword)
      )
    })
    .forEach((supplier) => {
      const activeAccounts = supplier.accounts.filter(
        (account) => account.is_active
      ).length

      const totalAccounts = supplier.accounts.length

      const totalKitchens = new Set(
        supplier.accounts.flatMap((account) =>
          account.kitchen_account_rules.map((rule) => rule.kitchen_id)
        )
      ).size

      rows += `
      <tr>

<tr>
  <td>${supplier.business_name}</td>

  <td>
    ${supplier.owner_name ?? '-'}
  </td>

  <td>
    ${supplier.product_type ?? '-'}
  </td>

  <td>
    ${supplier.phone ?? '-'}
  </td>

  <td>
    ${supplier.address ?? '-'}
  </td>

  <td class="text-center">
    ${activeAccounts}/${totalAccounts}
  </td>

  <td class="text-center">
    ${totalKitchens}
  </td>

  <td>
    ${
      supplier.is_active
        ? '<span class="badge badge-income">Aktif</span>'
        : '<span class="badge badge-expense">Nonaktif</span>'
    }
  </td>

  ${
    isAdmin
      ? `
<td class="text-center supplier-action-column">
  <button class="action-button editSupplierButton" data-id="${supplier.id}">✏ Edit</button>
  <button class="action-button manageAccountButton" data-id="${supplier.id}">💳 Rekening</button>
</td>
`
      : ''
  }
</tr>
    `
    })

  supplierMasterTable.innerHTML = `
    <div class="supplier-summary">

      <table class="summary-table">

        <thead>

<tr>
  <th>SUPPLIER</th>
  <th>PEMILIK</th>
  <th>PRODUK</th>
  <th>NO HP</th>
  <th>ALAMAT</th>
  <th>REKENING</th>
  <th>DAPUR</th>
  <th>STATUS</th>
  ${isAdmin ? '<th class="supplier-action-column">AKSI</th>' : ''}
</tr>

        </thead>

        <tbody>

          ${rows}

        </tbody>

      </table>

    </div>
  `

  document.querySelectorAll('.editSupplierButton').forEach((button) => {
    button.addEventListener('click', () => {
      openSupplierModal(button.dataset.id)
    })
  })

  document.querySelectorAll('.manageAccountButton').forEach((button) => {
    button.addEventListener('click', () => {
      openAccountManager(button.dataset.id)
    })
  })
}

function openSupplierModal(id) {
  if (currentUser?.role !== 'admin') {
    return
  }

  supplierMode = 'edit'

  supplierModalTitle.textContent = 'Edit Supplier'

  currentSupplierId = id

  const supplier = supplierMaster.find((item) => item.id === id)

  if (!supplier) return

  supplierBusinessName.value = supplier.business_name ?? ''
  supplierOwnerName.value = supplier.owner_name ?? ''
  supplierProductType.value = supplier.product_type ?? ''
  supplierPhone.value = supplier.phone ?? ''
  supplierAddress.value = supplier.address ?? ''
  supplierStatus.value = String(supplier.is_active)

  supplierModal.style.display = 'flex'

  resetModalScroll(supplierModal)
}

addSupplierButton?.addEventListener('click', openNewSupplierModal)

supplierMasterSearch?.addEventListener('input', () => {
  renderSupplierMaster()
})

function closeModal() {
  supplierMode = 'edit'

  supplierModal.style.display = 'none'

  closeAccountManager()
}

closeSupplierModal.addEventListener('click', closeModal)

function closeAccountManager() {
  resetAccountEditor()
  accountModal.style.display = 'none'
}

closeAccountModal.addEventListener('click', closeAccountManager)

window.addEventListener('click', (e) => {
  if (e.target === supplierModal) {
    closeModal()
  }

  if (e.target === accountModal) {
    closeAccountManager()
  }
})

async function saveSupplier() {
  if (currentUser?.role !== 'admin') {
    return
  }

  if (supplierMode === 'add') {
    await insertSupplier()
  } else {
    await updateSupplier()
  }
}

async function updateSupplier() {
  if (currentUser?.role !== 'admin') {
    return
  }
  if (!supplierBusinessName.value.trim()) {
    alert('Nama supplier wajib diisi.')
    supplierBusinessName.focus()
    return
  }

  const { error } = await supabaseClient
    .from('income_suppliers')
    .update({
      business_name: supplierBusinessName.value.trim(),
      owner_name: supplierOwnerName.value.trim(),
      product_type: supplierProductType.value.trim(),
      phone: supplierPhone.value.trim(),
      address: supplierAddress.value.trim(),
      is_active: supplierStatus.value === 'true',
      updated_at: new Date().toISOString()
    })
    .eq('id', currentSupplierId)

  if (error) {
    console.error(error)
    alert('Gagal memperbarui supplier.')
    return
  }

  closeModal()

  await loadSupplierMaster()
}

async function insertSupplier() {
  if (currentUser?.role !== 'admin') {
    return
  }
  if (!supplierBusinessName.value.trim()) {
    alert('Nama supplier wajib diisi.')
    supplierBusinessName.focus()
    return
  }

  const { error } = await supabaseClient.from('income_suppliers').insert({
    business_name: supplierBusinessName.value.trim(),
    owner_name: supplierOwnerName.value.trim(),
    product_type: supplierProductType.value.trim(),
    phone: supplierPhone.value.trim() || null,
    address: supplierAddress.value.trim() || null,
    is_active: supplierStatus.value === 'true'
  })

  if (error) {
    console.error(error)
    alert('Gagal menambahkan supplier.')
    return
  }

  closeModal()

  supplierMode = 'edit'

  await loadSupplierMaster()

  alert('Supplier berhasil ditambahkan.')
}

async function saveAccount() {
  if (currentUser?.role !== 'admin') {
    return
  }
  if (!accountBank.value) {
    alert('Bank wajib dipilih.')
    accountBank.focus()
    return
  }

  if (!accountNumber.value.trim()) {
    alert('Nomor rekening wajib diisi.')
    accountNumber.focus()
    return
  }

  let error

  const duplicate = supplierMaster
    .find((s) => s.id === currentSupplierId)
    .accounts.find((account) => {
      if (account.id === currentAccountId) return false

      return (
        account.bank === accountBank.value &&
        (account.account_number ?? '') === accountNumber.value.trim()
      )
    })

  if (duplicate) {
    alert('Rekening dengan bank dan nomor tersebut sudah ada.')
    return
  }

  if (currentAccountId) {
    const result = await supabaseClient
      .from('accounts')
      .update({
        bank: accountBank.value,
        account_number: accountNumber.value.trim(),
        is_active: accountStatus.value === 'true'
      })
      .eq('id', currentAccountId)

    error = result.error
  } else {
    const result = await supabaseClient.from('accounts').insert({
      name: supplierMaster.find((s) => s.id === currentSupplierId)
        .business_name,

      bank: accountBank.value,

      account_number: accountNumber.value.trim(),

      supplier_id: currentSupplierId,

      is_active: accountStatus.value === 'true'
    })

    error = result.error
  }

  if (error) {
    console.error(error)
    alert('Gagal menyimpan rekening.')
    return
  }

  resetAccountEditor()

  await loadSupplierMaster()

  openAccountManager(currentSupplierId)
}

saveKitchenMappingButton.addEventListener('click', saveKitchenMapping)
saveSupplierButton.addEventListener('click', saveSupplier)
saveAccountButton.addEventListener('click', saveAccount)
