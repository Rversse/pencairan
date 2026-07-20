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
const deleteSupplierButton = document.getElementById('deleteSupplierButton')
const supplierAccountsList = document.getElementById('supplierAccountsList')
const addAccountButton = document.getElementById('addAccountButton')
const accountModalTitle = document.getElementById('accountModalTitle')
const closeAccountModal = document.getElementById('closeAccountModal')
const accountBank = document.getElementById('accountBank')
const accountNumber = document.getElementById('accountNumber')
const accountOpeningBalance = document.getElementById('accountOpeningBalance')
const accountStatus = document.getElementById('accountStatus')
const saveAccountButton = document.getElementById('saveAccountButton')
const kitchenMappingList = document.getElementById('kitchenMappingList')
const saveKitchenMappingButton = document.getElementById(
  'saveKitchenMappingButton'
)
const supplierModalTitle = document.getElementById('supplierModalTitle')

const accountPreviewModal = document.getElementById('accountPreviewModal')
const accountPreviewContent = document.getElementById('accountPreviewContent')
const closeAccountPreview = document.getElementById('closeAccountPreview')
const accountPreviewSubtitle = document.getElementById('accountPreviewSubtitle')
const accountPreviewTitle = document.getElementById('accountPreviewTitle')

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
  accountOpeningBalance.value = formatNumber('0')
  accountStatus.value = 'true'

  accountEditor.style.display = 'block'

  accountNumber.focus()
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

  deleteSupplierButton.style.display = 'none'

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
      const kitchenNames = [
        ...new Map(
          account.kitchen_account_rules.map((rule) => [
            rule.kitchen_id,
            rule.kitchens?.name
          ])
        ).values()
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'id'))

      return `
<div class="supplier-account-card ${account.is_active ? '' : 'inactive'}">

  <div class="account-info">

    <strong>🏦 ${account.bank}</strong>

<div
  class="account-number copyAccountNumber"
  data-number="${account.account_number ?? ''}"
  title="Klik untuk menyalin"
>
  ${account.account_number ?? '-'}
</div>

<div class="account-status">
  ${
    account.is_active
      ? '<span class="badge badge-income">Aktif</span>'
      : '<span class="badge badge-expense">Nonaktif</span>'
  }
</div>

<div class="account-kitchens">
    ${kitchenNames.length ? kitchenNames.join(', ') : 'Belum dipetakan'}
</div>

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

        <button
          class="deleteAccountButton"
          data-id="${account.id}"
          ${kitchenNames.length > 0 ? 'disabled' : ''}
        >
          🗑 Hapus
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

  document.querySelectorAll('.deleteAccountButton').forEach((button) => {
    button.addEventListener('click', () => {
      deleteAccount(button.dataset.id)
    })
  })

  document.querySelectorAll('.copyAccountNumber').forEach((item) => {
    item.addEventListener('click', async () => {
      const number = item.dataset.number

      if (!number) return

      try {
        await navigator.clipboard.writeText(number)

        showToast('Nomor rekening disalin.')
      } catch (err) {
        console.error(err)

        alert('Gagal menyalin nomor rekening.')
      }
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

  showToast('Mapping berhasil disimpan.')

  await loadSupplierMaster(true)

  openAccountManager(currentSupplierId)
}

function resetAccountEditor() {
  currentAccountId = null

  accountEditor.style.display = 'none'
  mappingEditor.style.display = 'none'

  kitchenMappingList.innerHTML = ''

  accountBank.value = 'BNI'
  accountNumber.value = ''
  accountOpeningBalance.value = formatNumber('0')
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

  accountOpeningBalance.value = formatNumber(
    String(Number(account.opening_balance) || 0)
  )

  mappingEditor.style.display = 'none'
  accountEditor.style.display = 'block'
  accountModal.style.display = 'flex'
  resetModalScroll(accountModal)
}

async function loadSupplierMaster(forceReload = false) {
  if (supplierMaster.length && !forceReload) {
    renderSupplierMaster()
    return
  }

  const { data, error } = await supabaseClient
    .from('income_suppliers')
    .select(
      `
      *,
accounts (
  id,
  bank,
  account_number,
  opening_balance,
  is_active,
  kitchen_account_rules (
    kitchen_id,
    kitchens (
      name
    )
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

function openAccountPreview(supplierId) {
  const supplier = supplierMaster.find((item) => item.id === supplierId)

  if (!supplier) return

  const activeAccounts = supplier.accounts.filter(
    (account) => account.is_active
  ).length

  accountPreviewTitle.textContent = supplier.business_name

  accountPreviewSubtitle.textContent = `${supplier.accounts.length} Rekening • ${activeAccounts} Aktif`

  accountPreviewContent.innerHTML = supplier.accounts
    .slice()
    .sort((a, b) => {
      const bank = a.bank.localeCompare(b.bank, 'id')

      if (bank !== 0) return bank

      return (a.account_number ?? '').localeCompare(
        b.account_number ?? '',
        'id'
      )
    })
    .map((account) => {
      const kitchenNames = [
        ...new Map(
          account.kitchen_account_rules.map((rule) => [
            rule.kitchen_id,
            rule.kitchens?.name
          ])
        ).values()
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'id'))

      return `
<div class="preview-account-item">

  <div class="preview-account-top">

    <div class="preview-account-bank">
      🏦 ${account.bank}
    </div>

    ${
      account.is_active
        ? '<span class="badge badge-income">Aktif</span>'
        : '<span class="badge badge-expense">Nonaktif</span>'
    }

  </div>

<div
  class="preview-account-number copyPreviewAccountNumber"
  data-number="${account.account_number ?? ''}"
  title="Klik untuk menyalin"
>
  ${account.account_number ?? '-'}
</div>

<div class="preview-account-kitchens">

<strong>
🏠 ${kitchenNames.length} Dapur
</strong>

<div class="preview-kitchen-list">
  ${kitchenNames.length ? kitchenNames.join(', ') : 'Belum dipetakan'}
</div>

</div>

</div>
`
    })
    .join('')

  document.querySelectorAll('.copyPreviewAccountNumber').forEach((item) => {
    item.addEventListener('click', async () => {
      const number = item.dataset.number

      if (!number) return

      try {
        await navigator.clipboard.writeText(number)

        showToast('Nomor rekening disalin.')
      } catch (err) {
        console.error(err)

        alert('Gagal menyalin nomor rekening.')
      }
    })
  })

  accountPreviewModal.style.display = 'flex'

  resetModalScroll(accountPreviewModal)
}

function openKitchenPreview(supplierId) {
  const supplier = supplierMaster.find((item) => item.id === supplierId)

  if (!supplier) return

  accountPreviewTitle.textContent = `Dapur • ${supplier.business_name}`

  const kitchenMap = new Map()

  supplier.accounts.forEach((account) => {
    account.kitchen_account_rules.forEach((rule) => {
      const kitchenId = rule.kitchen_id
      const kitchenName = rule.kitchens?.name

      if (!kitchenName) return

      if (!kitchenMap.has(kitchenId)) {
        kitchenMap.set(kitchenId, {
          name: kitchenName,
          banks: []
        })
      }

      kitchenMap.get(kitchenId).banks.push(account.bank)
    })
  })

  const kitchens = [...kitchenMap.values()]
    .map((item) => ({
      ...item,
      banks: [...new Set(item.banks)].sort((a, b) => a.localeCompare(b, 'id'))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))

  accountPreviewContent.innerHTML =
    kitchens.length > 0
      ? kitchens
          .map(
            (item) => `
<div class="preview-account-item">

  <div class="preview-account-bank">
    ${item.name}
  </div>

  <div class="preview-account-number">
    🏦 ${item.banks.join(', ')}
  </div>

</div>
`
          )
          .join('')
      : `
<div class="empty-state">
  Belum digunakan oleh dapur mana pun.
</div>
`

  accountPreviewTitle.textContent = supplier.business_name

  accountPreviewSubtitle.textContent = `${kitchens.length} Dapur • ${supplier.accounts.length} Rekening`

  accountPreviewModal.style.display = 'flex'

  resetModalScroll(accountPreviewModal)
}

function renderSupplierMaster() {
  const isAdmin = currentUser?.role === 'admin'

  const keyword = supplierMasterSearch.value.trim().toLowerCase()

  const filteredSuppliers = supplierMaster.filter((supplier) => {
    return (
      supplier.business_name.toLowerCase().includes(keyword) ||
      (supplier.owner_name ?? '').toLowerCase().includes(keyword) ||
      (supplier.product_type ?? '').toLowerCase().includes(keyword)
    )
  })

  supplierCount.textContent = `Total Supplier: ${filteredSuppliers.length}`

  let rows = ''

  filteredSuppliers.forEach((supplier) => {
    const activeAccounts = supplier.accounts.filter(
      (account) => account.is_active
    ).length

    const totalAccounts = supplier.accounts.length

    rows += `
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
<span
  class="supplierAccountPreview"
  data-id="${supplier.id}"
  title="Klik untuk melihat daftar rekening"
>
    ${activeAccounts}/${totalAccounts}
  </span>
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
  <th>NO HANDPHONE</th>
  <th>ALAMAT</th>
  <th>REKENING</th>
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

  document.querySelectorAll('.supplierAccountPreview').forEach((item) => {
    item.addEventListener('click', () => {
      openAccountPreview(item.dataset.id)
    })
  })
}

function openSupplierModal(id) {
  if (currentUser?.role !== 'admin') {
    return
  }

  supplierMode = 'edit'

  supplierModalTitle.textContent = 'Edit Supplier'

  deleteSupplierButton.style.display = 'inline-flex'

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

accountOpeningBalance.addEventListener('input', () => {
  accountOpeningBalance.value = formatNumber(
    String(parseNumber(accountOpeningBalance.value))
  )
})

addSupplierButton?.addEventListener('click', openNewSupplierModal)

supplierMasterSearch?.addEventListener('input', () => {
  renderSupplierMaster()
})

function hideSupplierModal() {
  supplierMode = 'edit'

  supplierModal.style.display = 'none'

  closeAccountManager()
}

closeSupplierModal.addEventListener('click', hideSupplierModal)

function closeAccountManager() {
  resetAccountEditor()
  accountModal.style.display = 'none'
}

closeAccountModal.addEventListener('click', closeAccountManager)

closeAccountPreview.addEventListener('click', () => {
  accountPreviewModal.style.display = 'none'
})

window.addEventListener('click', (e) => {
  if (e.target === supplierModal) {
    hideSupplierModal()
  }

  if (e.target === accountModal) {
    closeAccountManager()
  }

  if (e.target === accountPreviewModal) {
    accountPreviewModal.style.display = 'none'
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

async function deleteSupplier() {
  if (currentUser?.role !== 'admin') return

  if (!currentSupplierId) return

  const supplier = supplierMaster.find((item) => item.id === currentSupplierId)

  if (!supplier) return

  const totalAccounts = supplier.accounts?.length ?? 0

  if (totalAccounts > 0) {
    alert(
      `Supplier masih memiliki ${totalAccounts} rekening.\nHapus seluruh rekening terlebih dahulu.`
    )
    return
  }

  const confirmed = confirm(
    `Yakin ingin menghapus supplier "${supplier.business_name}"?\n\nTindakan ini tidak dapat dibatalkan.`
  )

  if (!confirmed) return

  const { error } = await supabaseClient
    .from('income_suppliers')
    .delete()
    .eq('id', currentSupplierId)

  if (error) {
    console.error(error)
    alert('Gagal menghapus supplier.')
    return
  }

  hideSupplierModal()

  await loadSupplierMaster(true)

  showToast('Supplier berhasil dihapus.')
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

  const businessName = supplierBusinessName.value.trim()

  const { error } = await supabaseClient
    .from('income_suppliers')
    .update({
      business_name: businessName,
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

  const { error: accountError } = await supabaseClient
    .from('accounts')
    .update({
      name: businessName
    })
    .eq('supplier_id', currentSupplierId)

  if (accountError) {
    console.error(accountError)
    alert(
      'Supplier berhasil diperbarui, tetapi sinkronisasi nama rekening gagal.'
    )
  }

  hideSupplierModal()

  await loadSupplierMaster(true)

  showToast('Supplier berhasil diperbarui.')
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

  hideSupplierModal()

  await loadSupplierMaster(true)

  showToast('Supplier berhasil ditambahkan.')
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

  const supplier = supplierMaster.find((item) => item.id === currentSupplierId)

  if (!supplier) {
    alert('Supplier tidak ditemukan.')
    return
  }

  const duplicate = supplier.accounts.find((account) => {
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

  const openingBalance = parseNumber(accountOpeningBalance.value)

  const isEdit = !!currentAccountId

  let error

  if (currentAccountId) {
    const result = await supabaseClient
      .from('accounts')
      .update({
        bank: accountBank.value,
        account_number: accountNumber.value.trim(),
        opening_balance: openingBalance,
        is_active: accountStatus.value === 'true'
      })
      .eq('id', currentAccountId)

    error = result.error
  } else {
    const result = await supabaseClient.from('accounts').insert({
      supplier_id: currentSupplierId,
      name: supplier.business_name,
      bank: accountBank.value,
      account_number: accountNumber.value.trim(),
      opening_balance: openingBalance,
      is_active: accountStatus.value === 'true'
    })

    error = result.error
  }

  if (error) {
    console.error(error)
    alert('Gagal menyimpan rekening.')
    return
  }

  await loadSupplierMaster(true)

  openAccountManager(currentSupplierId)

  showToast(
    isEdit ? 'Rekening berhasil diperbarui.' : 'Rekening berhasil ditambahkan.'
  )
}

async function deleteAccount(accountId) {
  if (currentUser?.role !== 'admin') return

  const supplier = supplierMaster.find((supplier) =>
    supplier.accounts.some((account) => account.id === accountId)
  )

  if (!supplier) return

  const account = supplier.accounts.find((account) => account.id === accountId)

  if (!account) return

  // Cek mapping terbaru langsung dari database
  const { count: mappingCount, error: mappingError } = await supabaseClient
    .from('kitchen_account_rules')
    .select('*', {
      count: 'exact',
      head: true
    })
    .eq('account_id', accountId)

  if (mappingError) {
    console.error(mappingError)
    alert('Gagal mengecek mapping rekening.')
    return
  }

  if ((mappingCount ?? 0) > 0) {
    alert(
      `Rekening masih dipakai oleh ${mappingCount} dapur.\nHapus mapping terlebih dahulu.`
    )
    return
  }

  // Cek apakah rekening pernah dipakai transaksi
  const { count: transactionCount, error: transactionError } =
    await supabaseClient
      .from('transactions')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('account_id', accountId)

  if (transactionError) {
    console.error(transactionError)
    alert('Gagal mengecek riwayat transaksi.')
    return
  }

  if ((transactionCount ?? 0) > 0) {
    alert(
      `Rekening tidak dapat dihapus karena sudah digunakan pada ${transactionCount} transaksi.`
    )
    return
  }

  // Jangan sampai supplier tidak memiliki rekening sama sekali
  if (supplier.accounts.length <= 1) {
    alert('Supplier harus memiliki minimal satu rekening.')
    return
  }

  const confirmed = confirm(
    `Yakin ingin menghapus rekening ${account.bank} ${account.account_number ?? '-'}?\n\nTindakan ini tidak dapat dibatalkan.`
  )

  if (!confirmed) return

  const { error: deleteError } = await supabaseClient
    .from('accounts')
    .delete()
    .eq('id', accountId)

  if (deleteError) {
    console.error(deleteError)
    alert('Gagal menghapus rekening.')
    return
  }

  await loadSupplierMaster(true)

  openAccountManager(currentSupplierId)

  showToast('Rekening berhasil dihapus.')
}

saveKitchenMappingButton.addEventListener('click', saveKitchenMapping)

saveSupplierButton.addEventListener('click', saveSupplier)

deleteSupplierButton.addEventListener('click', deleteSupplier)

saveAccountButton.addEventListener('click', saveAccount)
