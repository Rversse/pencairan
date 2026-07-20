const EXPORT_LAYOUT = {
  Sukaraja: [
    'ARUTALA BRI',
    'KPWS BRI',
    'CV KRAMAT BNI',
    'KOPERASI ARUTALA',
    'KOPERASI SUKALARANG',
    'ARIS',
    'BABINSA'
  ],

  Cihaur: [
    'ARUTALA BRI',
    'CV KRAMAT BNI',
    'UMKM BAROKAH BNI',
    'UD BERKAH MANDIRI BNI',
    'DENISH FRESH CHICKEN BNI',
    'RR JAYA BROILER BNI',
    'RPU NUGRAHA BROILER BNI',
    'KOPERASI ARUTALA'
  ],

  Cibaregbeg: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'UMKM BAROKAH BNI',
    'UD BERKAH MANDIRI BNI',
    'DENISH FRESH CHICKEN BNI',
    'RR JAYA BROILER BNI',
    'RPU NUGRAHA BROILER BNI',
    'KOPERASI ARUTALA'
  ],

  Warungbitung: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'UD BERKAH MANDIRI BNI',
    'IMAM NUGROHO BCA',
    'TOKO SEMBAKO BERKAH BNI',
    'KOPERASI ARUTALA'
  ],

  Campakamulya: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'ASEP RIDWAN BJB',
    'UMKM SUMBER SEGAR BRI',
    'UMKM SUMBER MAKMUR MANDIRI',
    'UMKM TEMPE JAYA MANDIRI BRI',
    'KOPERASI ARUTALA'
  ],

  Kertajadi: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'ITIKURIH BRI',
    'PABRIK TAHU CIOGONG 2 BRI',
    'TOKO FAUZAN DAGING FRESH BNI',
    'UMKM BERKAH AMANAH BRI',
    'UMKM MAJU JAYA BRI',
    'UMKM MITRA BAROKAH BJB',
    'UMKM PURWANTI BRI',
    'UMKM SABILULUNGAN BJB',
    'UMKM SEGAR MAKMUR BRI',
    'UMKM SIMPANG RASA BNI',
    'UMKM SUMBER SEGAR BJB',
    'WARUNG SEMBAKO SERBA ADA BJB',
    'KOPERASI ARUTALA'
  ],

  Cisepat: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'ITIKURIH BRI',
    'PABRIK TAHU CIOGONG 2 BRI',
    'TOKO FAUZAN DAGING FRESH BNI',
    'UMKM BERKAH AMANAH BRI',
    'UMKM MAJU JAYA BRI',
    'UMKM MITRA BAROKAH BJB',
    'UMKM PURWANTI BRI',
    'UMKM SABILULUNGAN BJB',
    'UMKM SEGAR MAKMUR BRI',
    'UMKM SIMPANG RASA BNI',
    'UMKM SUMBER SEGAR BJB',
    'WARUNG SEMBAKO SERBA ADA BJB',
    'KOPERASI ARUTALA'
  ],

  Cipetir: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'UMKM BAROKAH BNI',
    'UD BERKAH MANDIRI BNI',
    'DENISH FRESH CHICKEN BNI',
    'RR JAYA BROILER BNI',
    'RPU NUGRAHA BROILER BNI',
    'KOPERASI ARUTALA'
  ],

  Cimanggu: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'UMKM BAROKAH BNI',
    'UD BERKAH MANDIRI BNI',
    'DENISH FRESH CHICKEN BNI',
    'RR JAYA BROILER BNI',
    'RPU NUGRAHA BROILER BNI',
    'KOPERASI ARUTALA'
  ],

  Cikondang: [
    'ARUTALA BNI',
    'CV KRAMAT BNI',
    'UMKM BAROKAH BNI',
    'UD BERKAH MANDIRI BNI',
    'DENISH FRESH CHICKEN BNI',
    'RR JAYA BROILER BNI',
    'RPU NUGRAHA BROILER BNI',
    'KOPERASI ARUTALA'
  ],

  Ciranca: ['ARUTALA BNI', 'CV KRAMAT BNI', 'KOPERASI ARUTALA']
}

function buildWorksheets(sheetData, detailRows, exportLayout) {
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

  const detailWorksheet = XLSX.utils.aoa_to_sheet(detailRows)

  Object.keys(worksheet).forEach((cell) => {
    if (cell.startsWith('!')) {
      return
    }

    const value = worksheet[cell]?.v

    if (typeof value === 'number') {
      worksheet[cell].z = '#,##0'
    }
  })

  worksheet['!merges'] = []

  worksheet['!merges'].push({
    s: { r: 0, c: 0 },
    e: { r: 1, c: 0 }
  })

  let currentCol = 1

  Object.entries(exportLayout).forEach(([, columns]) => {
    const startCol = currentCol
    const endCol = currentCol + columns.length - 1

    if (columns.length > 1) {
      worksheet['!merges'].push({
        s: {
          r: 0,
          c: startCol
        },
        e: {
          r: 0,
          c: endCol
        }
      })
    }

    currentCol = endCol + 1
  })

  worksheet['!cols'] = sheetData[0].map((_, colIndex) => {
    let maxLength = 15

    sheetData.forEach((row) => {
      const value = row[colIndex]

      if (value !== undefined && value !== null) {
        maxLength = Math.max(maxLength, String(value).length + 2)
      }
    })

    return {
      wch: Math.min(maxLength, 25)
    }
  })

  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelaporan')

  XLSX.utils.book_append_sheet(workbook, detailWorksheet, 'Detail Transaksi')

  worksheet['!freeze'] = {
    xSplit: 1,
    ySplit: 2
  }

  return {
    worksheet,
    detailWorksheet,
    workbook
  }
}

function buildExportFileName(
  selectedKitchen,
  selectedFlowType,
  startDate,
  endDate
) {
  const kitchenPart = selectedKitchen
    ? selectedKitchen.name.toLowerCase().replace(/\s+/g, '-')
    : 'semua'

  const flowLabelMap = {
    income: 'bgn',
    expense: 'supplier',
    neutral: 'operational'
  }

  const flowPart = flowLabelMap[selectedFlowType] || 'semua'

  return `pelaporan-${kitchenPart}-${flowPart}-${startDate}-${endDate}.xlsx`
}

function getExportLayout(selectedKitchen) {
  if (!selectedKitchen) {
    return EXPORT_LAYOUT
  }

  const layout = EXPORT_LAYOUT[selectedKitchen.name]

  if (!layout) {
    return EXPORT_LAYOUT
  }

  return {
    [selectedKitchen.name]: layout
  }
}

async function loadExportMasterData() {
  const [{ data: kitchens }, { data: accounts }, { data: suppliers }] =
    await Promise.all([
      supabaseClient.from('kitchens').select('id,name').eq('is_active', true),

      supabaseClient
        .from('accounts')
        .select('id,name,bank')
        .eq('is_active', true),

      supabaseClient.from('suppliers').select('id,name').eq('is_active', true)
    ])

  return {
    kitchens,
    accounts,
    suppliers
  }
}

async function fetchAllTransactions({ startDate, endDate, select }) {
  const transactions = []

  let from = 0

  const pageSize = 1000

  while (true) {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select(select)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', {
        ascending: true
      })
      .range(from, from + pageSize - 1)

    if (error) {
      throw error
    }

    transactions.push(...data)

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return transactions
}

async function loadExportTransactions(
  startDate,
  endDate,
  selectedKitchenId,
  selectedFlowType
) {
  let transactions = await fetchAllTransactions({
    startDate,
    endDate,
    select: `
      transaction_date,
      kitchen_id,
      account_id,
      supplier_id,
      flow_type,
      amount
    `
  })

  if (selectedKitchenId) {
    transactions = transactions.filter(
      (t) => t.kitchen_id === selectedKitchenId
    )
  }

  if (selectedFlowType) {
    transactions = transactions.filter((t) => t.flow_type === selectedFlowType)
  }

  return transactions
}

function createLookupMaps(kitchens, accounts, suppliers) {
  return {
    kitchenMap: new Map(kitchens.map((item) => [item.id, item])),
    accountMap: new Map(accounts.map((item) => [item.id, item])),
    supplierMap: new Map(suppliers.map((item) => [item.id, item]))
  }
}

function fillPivotRows(
  transactions,
  pivotMap,
  kitchenMap,
  accountMap,
  supplierMap
) {
  transactions.forEach((transaction) => {
    const row = pivotMap.get(transaction.transaction_date)

    if (!row) return

    const kitchen = kitchenMap.get(transaction.kitchen_id)

    if (!kitchen) return

    const amount = Number(transaction.amount) || 0

    let columnName = null

    if (transaction.flow_type === 'income') {
      const account = accountMap.get(transaction.account_id)

      if (!account) return

      columnName = `${account.name} ${account.bank}`
    }

    if (transaction.flow_type === 'expense') {
      const supplier = supplierMap.get(transaction.supplier_id)

      if (!supplier) return

      if (supplier.name === 'Koperasi Arutala') {
        columnName = 'KOPERASI ARUTALA'
      }

      if (supplier.name === 'Sukalarang') {
        columnName = 'KOPERASI SUKALARANG'
      }

      if (supplier.name === 'Aris') {
        columnName = 'ARIS'
      }

      if (supplier.name === 'Babinsa') {
        columnName = 'BABINSA'
      }
    }

    if (!columnName) return

    const key = `${kitchen.name}|${columnName}`

    if (row[key] === undefined) return

    row[key] += amount
  })
}

function buildDetailRows(transactions, kitchenMap, accountMap, supplierMap) {
  const detailRows = [['Tanggal', 'Dapur', 'Jenis', 'Nama', 'Nominal']]

  transactions.forEach((transaction) => {
    const kitchen = kitchenMap.get(transaction.kitchen_id)

    if (!kitchen) return

    let name = '-'

    if (transaction.flow_type === 'income') {
      const account = accountMap.get(transaction.account_id)

      if (account) {
        name = `${account.name} ${account.bank || ''}`.trim()
      }
    }

    if (transaction.flow_type === 'expense') {
      const supplier = supplierMap.get(transaction.supplier_id)

      if (supplier) {
        name = supplier.name
      }
    }

    detailRows.push([
      transaction.transaction_date,
      kitchen.name,
      transaction.flow_type,
      name,
      Number(transaction.amount) || 0
    ])
  })

  return detailRows
}

function buildHeaders(exportLayout) {
  const headerRow1 = ['Tanggal']
  const headerRow2 = ['']

  Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
    columns.forEach(() => {
      headerRow1.push(kitchenName)
    })

    headerRow2.push(...columns)
  })

  return {
    headerRow1,
    headerRow2
  }
}

function buildPivotRows(transactions, exportLayout) {
  const uniqueDates = [
    ...new Set(transactions.map((transaction) => transaction.transaction_date))
  ].sort()

  const pivotRows = uniqueDates.map((date) => {
    const row = {
      Tanggal: date
    }

    Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
      columns.forEach((column) => {
        row[`${kitchenName}|${column}`] = 0
      })
    })

    return row
  })

  const pivotMap = new Map()

  pivotRows.forEach((row) => {
    pivotMap.set(row.Tanggal, row)
  })
  return {
    pivotRows,
    pivotMap
  }
}

function buildSheetData(pivotRows, exportLayout, headerRow1, headerRow2) {
  const sheetData = [headerRow1, headerRow2]

  pivotRows.forEach((row) => {
    const sheetRow = [row.Tanggal]

    Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
      columns.forEach((column) => {
        const value = row[`${kitchenName}|${column}`]

        sheetRow.push(value === 0 ? '-' : value)
      })
    })

    sheetData.push(sheetRow)
  })

  return sheetData
}

function buildTotalRow(pivotRows, exportLayout) {
  const totalRow = ['TOTAL']

  Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
    columns.forEach((column) => {
      let total = 0

      pivotRows.forEach((row) => {
        total += Number(row[`${kitchenName}|${column}`]) || 0
      })

      totalRow.push(total)
    })
  })

  return totalRow
}

async function exportPelaporanExcel() {
  const startDate = document.getElementById('startDate').value

  const endDate = document.getElementById('endDate').value

  const selectedKitchenId = exportKitchen.value

  const selectedFlowType = exportFlowType.value

  let transactions = []

  try {
    transactions = await loadExportTransactions(
      startDate,
      endDate,
      selectedKitchenId,
      selectedFlowType
    )
  } catch (error) {
    console.error(error)
    return
  }

  const { kitchens, accounts, suppliers } = await loadExportMasterData()

  const selectedKitchen =
    kitchens.find((k) => k.id === selectedKitchenId) || null

  const { kitchenMap, accountMap, supplierMap } = createLookupMaps(
    kitchens,
    accounts,
    suppliers
  )

  const exportLayout = getExportLayout(selectedKitchen)

  const { headerRow1, headerRow2 } = buildHeaders(exportLayout)

  const { pivotRows, pivotMap } = buildPivotRows(transactions, exportLayout)

  fillPivotRows(transactions, pivotMap, kitchenMap, accountMap, supplierMap)

  const detailRows = buildDetailRows(
    transactions,
    kitchenMap,
    accountMap,
    supplierMap
  )

  const sheetData = buildSheetData(
    pivotRows,
    exportLayout,
    headerRow1,
    headerRow2
  )

  sheetData.push(buildTotalRow(pivotRows, exportLayout))

  // ======================
  // BUILD WORKSHEETS
  // ======================

  const { worksheet, detailWorksheet, workbook } = buildWorksheets(
    sheetData,
    detailRows,
    exportLayout
  )

  const fileName = buildExportFileName(
    selectedKitchen,
    selectedFlowType,
    startDate,
    endDate
  )

  XLSX.writeFile(workbook, fileName)
}
