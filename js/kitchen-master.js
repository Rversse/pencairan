const kitchenMasterTab = document.getElementById('kitchenMasterTab')

const kitchenMasterSection = document.getElementById('kitchenMasterSection')

const kitchenMasterTable = document.getElementById('kitchenMasterTable')

const kitchenMasterSearch = document.getElementById('kitchenMasterSearch')

const addKitchenButton = document.getElementById('addKitchenButton')

const kitchenModal = document.getElementById('kitchenModal')
const kitchenModalTitle = document.getElementById('kitchenModalTitle')
const closeKitchenModal = document.getElementById('closeKitchenModal')

const kitchenName = document.getElementById('kitchenName')
const kitchenPM = document.getElementById('kitchenPM')
const kitchenStatus = document.getElementById('kitchenStatus')

const saveKitchenButton = document.getElementById('saveKitchenButton')

const kitchenPIC = document.getElementById('kitchenPIC')
const kitchenAddress = document.getElementById('kitchenAddress')

let kitchenMode = 'edit'
let currentKitchenId = null

kitchenMasterTab?.addEventListener('click', async (e) => {
  e.preventDefault()

  hideAllSections()
  resetActiveTabs()

  kitchenMasterSection.style.display = 'block'
  kitchenMasterTab.classList.add('active')

  addKitchenButton.style.display =
    currentUser?.role === 'admin' ? 'inline-flex' : 'none'

  await loadKitchenMaster()
})

let kitchenMaster = []

async function loadKitchenMaster() {
  const { data, error } = await supabaseClient
    .from('kitchens')
    .select('*')
    .order('name')

  if (error) {
    console.error(error)
    return
  }

  kitchenMaster = data

  renderKitchenMaster()
}

function renderKitchenMaster() {
  const isAdmin = currentUser?.role === 'admin'

  const keyword = kitchenMasterSearch.value.trim().toLowerCase()

  const filtered = kitchenMaster.filter((kitchen) => {
    return (
      kitchen.name.toLowerCase().includes(keyword) ||
      (kitchen.pic ?? '').toLowerCase().includes(keyword)
    )
  })

  let rows = ''

  filtered.forEach((kitchen) => {
    rows += `
        <tr>

<td>${kitchen.name}</td>

<td class="text-center">
  ${kitchen.total_pm ?? '-'}
</td>

<td>
  ${kitchen.pic ?? '-'}
</td>

<td>
  ${kitchen.address ?? '-'}
</td>

          <td>
            ${
              kitchen.is_active
                ? '<span class="badge badge-income">Aktif</span>'
                : '<span class="badge badge-expense">Nonaktif</span>'
            }
          </td>

${
  isAdmin
    ? `
<td class="text-center kitchen-action-column">

  <button
    class="action-button"
    data-id="${kitchen.id}"
  >
    ✏ Edit
  </button>

</td>
`
    : ''
}

        </tr>
      `
  })

  kitchenMasterTable.innerHTML = `
    <div class="supplier-summary">

      <table class="summary-table">

        <thead>

<tr>
  <th>DAPUR</th>
  <th>TOTAL PM</th>
  <th>PIC</th>
  <th>ALAMAT</th>
  <th>STATUS</th>

  ${isAdmin ? '<th class="kitchen-action-column">AKSI</th>' : ''}
</tr>

        </thead>

        <tbody>

          ${rows}

        </tbody>

      </table>

    </div>
  `

  document.querySelectorAll('.action-button').forEach((button) => {
    button.addEventListener('click', () => {
      openKitchenModal(button.dataset.id)
    })
  })
}

function openKitchenAccountMapping(id) {
  console.log(id)
}

addKitchenButton?.addEventListener('click', () => {
  if (currentUser?.role !== 'admin') {
    return
  }

  kitchenMode = 'add'

  currentKitchenId = null

  kitchenModalTitle.textContent = 'Tambah Dapur'

  kitchenName.value = ''
  kitchenPM.value = ''
  kitchenPIC.value = ''
  kitchenAddress.value = ''
  kitchenStatus.value = 'true'

  kitchenModal.style.display = 'flex'
})

function openKitchenModal(id) {
  if (currentUser?.role !== 'admin') {
    return
  }

  kitchenMode = 'edit'

  currentKitchenId = id

  const kitchen = kitchenMaster.find((k) => k.id === id)

  if (!kitchen) return

  kitchenModalTitle.textContent = 'Edit Dapur'

  kitchenName.value = kitchen.name
  kitchenPM.value = kitchen.total_pm ?? ''
  kitchenPIC.value = kitchen.pic ?? ''
  kitchenAddress.value = kitchen.address ?? ''
  kitchenStatus.value = String(kitchen.is_active)

  kitchenModal.style.display = 'flex'
}

async function saveKitchen() {
  if (currentUser?.role !== 'admin') {
    return
  }

  if (kitchenMode === 'add') {
    await insertKitchen()
  } else {
    await updateKitchen()
  }
}

async function insertKitchen() {
  if (currentUser?.role !== 'admin') {
    return
  }
  if (!kitchenName.value.trim()) {
    alert('Nama dapur wajib diisi.')
    kitchenName.focus()
    return
  }

  if (Number(kitchenPM.value) < 0) {
    alert('Total PM tidak boleh negatif.')
    kitchenPM.focus()
    return
  }

  const { error } = await supabaseClient.from('kitchens').insert({
    name: kitchenName.value.trim(),
    total_pm: Number(kitchenPM.value),
    pic: kitchenPIC.value.trim(),
    address: kitchenAddress.value.trim(),
    is_active: kitchenStatus.value === 'true'
  })

  if (error) {
    console.error(error)
    alert('Gagal menambah dapur.')
    return
  }

  closeKitchenManager()

  await loadKitchenMaster()
}

async function updateKitchen() {
  if (currentUser?.role !== 'admin') {
    return
  }
  if (!kitchenName.value.trim()) {
    alert('Nama dapur wajib diisi.')
    kitchenName.focus()
    return
  }

  if (Number(kitchenPM.value) < 0) {
    alert('Total PM tidak boleh negatif.')
    kitchenPM.focus()
    return
  }

  const { error } = await supabaseClient
    .from('kitchens')
    .update({
      name: kitchenName.value.trim(),
      total_pm: Number(kitchenPM.value),
      pic: kitchenPIC.value.trim(),
      address: kitchenAddress.value.trim(),
      is_active: kitchenStatus.value === 'true'
    })
    .eq('id', currentKitchenId)

  if (error) {
    console.error(error)
    alert('Gagal memperbarui dapur.')
    return
  }

  closeKitchenManager()

  await loadKitchenMaster()
}

saveKitchenButton.addEventListener('click', saveKitchen)

function closeKitchenManager() {
  kitchenModal.style.display = 'none'

  currentKitchenId = null

  kitchenMode = 'edit'
}

closeKitchenModal.addEventListener('click', closeKitchenManager)

window.addEventListener('click', (e) => {
  if (e.target === kitchenModal) {
    closeKitchenManager()
  }
})
