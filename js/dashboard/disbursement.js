const DISBURSEMENT_ITEMS = 5

const DISBURSEMENT_DATE_KEY = 'disbursement_selected_date'

const disbursementTab = document.getElementById('disbursementTab')

function getNearestFriday() {
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  const previousFriday = new Date(today)
  const nextFriday = new Date(today)

  const prevDiff =
    previousFriday.getDay() >= 5
      ? previousFriday.getDay() - 5
      : previousFriday.getDay() + 2

  previousFriday.setDate(previousFriday.getDate() - prevDiff)

  nextFriday.setDate(previousFriday.getDate() + 7)

  const diffPrev = Math.abs(today - previousFriday)
  const diffNext = Math.abs(nextFriday - today)

  const target = diffPrev <= diffNext ? previousFriday : nextFriday

  return [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, '0'),
    String(target.getDate()).padStart(2, '0')
  ].join('-')
}

function calculateDisbursementProgress(record) {
  if (!record) {
    return 0
  }

  const completed = [
    record.relawan,
    record.pic_sekolah,
    record.kader_posyandu,
    record.sewa_kendaraan,
    record.fasilitas_sppg
  ].filter(Boolean).length

  return Math.round((completed / DISBURSEMENT_ITEMS) * 100)
}

function getProgressClass(progress) {
  if (progress === 100) {
    return 'progress-complete'
  }

  if (progress >= 80) {
    return 'progress-high'
  }

  if (progress >= 40) {
    return 'progress-medium'
  }

  if (progress > 0) {
    return 'progress-low'
  }

  return 'progress-empty'
}

function isDisbursementLocked(checklistDate) {
  const selectedDate = new Date(checklistDate)

  const today = new Date()

  selectedDate.setHours(0, 0, 0, 0)

  today.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24))

  return diffDays > 7
}

async function saveDisbursementCheckbox(kitchenId, field, value) {
  if (isDisbursementLocked(disbursementDate.value)) {
    return
  }

  const checklistDate = disbursementDate.value

  const { data: existingRow } = await supabaseClient
    .from('disbursement_checklists')
    .select('id')
    .eq('kitchen_id', kitchenId)
    .eq('checklist_date', checklistDate)
    .maybeSingle()

  if (existingRow) {
    await supabaseClient
      .from('disbursement_checklists')
      .update({
        [field]: value
      })
      .eq('id', existingRow.id)

    return
  }

  await supabaseClient.from('disbursement_checklists').insert({
    kitchen_id: kitchenId,

    checklist_date: checklistDate,

    relawan: false,

    pic_sekolah: false,

    kader_posyandu: false,

    sewa_kendaraan: false,

    fasilitas_sppg: false,

    [field]: value
  })
}

async function loadDisbursementTable() {
  const selectedDate = disbursementDate.value

  const isLocked = isDisbursementLocked(selectedDate)

  const container = document.getElementById('disbursementTable')

  if (!container) {
    return
  }

  const { data: kitchens, error } = await supabaseClient
    .from('kitchens')
    .select('id,name')
    .eq('include_disbursement', true)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error(error)

    return
  }

  const { data: checklistRows, error: checklistError } = await supabaseClient
    .from('disbursement_checklists')
    .select('*')
    .eq('checklist_date', selectedDate)

  if (checklistError) {
    console.error(checklistError)
  }

  const checklistMap = new Map()

  ;(checklistRows || []).forEach((row) => {
    checklistMap.set(row.kitchen_id, row)
  })

  const summary = document.getElementById('disbursementSummary')

  let completedKitchens = 0

  let totalProgress = 0

  let notStartedCount = 0

  let inProgressCount = 0

  kitchens.forEach((kitchen) => {
    const record = checklistMap.get(kitchen.id)

    const progress = calculateDisbursementProgress(record)

    if (progress === 0) {
      notStartedCount++
    } else if (progress === 100) {
      completedKitchens++
    } else {
      inProgressCount++
    }

    totalProgress += progress
  })

  const overallProgress = kitchens.length
    ? Math.round(totalProgress / kitchens.length)
    : 0

  summary.innerHTML = `
<div class="disbursement-progress">

<strong>
  ${completedKitchens}
  /
  ${kitchens.length}
  Dapur Selesai
</strong>

<br>

<small>
  Progress:
  ${overallProgress}%
</small>

<br>
<br>

<div class="disbursement-status-summary">

  <small>
    🔴 ${notStartedCount}
  </small>

  <small>
    🟡 ${inProgressCount}
  </small>

  <small>
    🟢 ${completedKitchens}
  </small>

</div>

  ${
    isLocked
      ? `
        <br>
        <small class="lock-text">
          🔒 Data Terkunci
        </small>
      `
      : ''
  }

</div>
`

  container.innerHTML = `
<div class="supplier-summary">

  <table class="disbursement-table">

    <thead>
      <tr>
        <th>Dapur</th>
        <th>Relawan</th>
        <th>PIC Sekolah</th>
        <th>Kader Posyandu</th>
        <th>Sewa Kendaraan</th>
        <th>Fasilitas SPPG</th>
        <th>Progress</th>
      </tr>
    </thead>

    <tbody>

${kitchens
  .map((kitchen) => {
    const record = checklistMap.get(kitchen.id)

    const progress = calculateDisbursementProgress(record)

    const progressClass = getProgressClass(progress)

    return `
            <tr>

              <td>
                ${kitchen.name}
              </td>

<td>
<input
  type="checkbox"
  ${record?.relawan ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="relawan"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.pic_sekolah ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="pic_sekolah"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.kader_posyandu ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="kader_posyandu"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.sewa_kendaraan ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="sewa_kendaraan"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.fasilitas_sppg ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="fasilitas_sppg"
>
</td>

<td>
  <span class="progress-badge ${progressClass}">
    ${progress === 100 ? '✓ Selesai' : `${progress}%`}
  </span>
</td>

            </tr>
          `
  })
  .join('')}

    </tbody>

  </table>

  </div>
  
`

  container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener(
      'change',

      async (event) => {
        const kitchenId = event.target.dataset.kitchen

        const field = event.target.dataset.field

        const value = event.target.checked

        await saveDisbursementCheckbox(kitchenId, field, value)

        await loadDisbursementTable()
      }
    )
  })
}

disbursementDate?.addEventListener('change', async () => {
  if (disbursementDate.value) {
    localStorage.setItem(DISBURSEMENT_DATE_KEY, disbursementDate.value)
  }

  await loadDisbursementTable()
})

disbursementTab?.addEventListener('click', async (event) => {
  if (currentUser?.role === 'viewer') return

  event.preventDefault()

  hideAllSections()
  resetActiveTabs()

  disbursementSection.style.display = 'block'
  disbursementTab.classList.add('active')

  updateActiveDropdown()

  await loadDisbursementTable()
})
