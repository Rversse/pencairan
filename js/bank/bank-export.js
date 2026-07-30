'use strict'

const exportBankExcelButton = document.getElementById('exportBankExcelButton')

function buildBankExportFileName(startDate, endDate) {
  const format = (value) => {
    if (!value) return ''

    const [year, month, day] = value.split('-')
    return `${day}-${month}-${year}`
  }

  const start = format(startDate)
  const end = format(endDate)

  if (!start || !end) {
    return 'Transfer Keluar Bank.xlsx'
  }

  if (start === end) {
    return `Transfer Keluar Bank ${start}.xlsx`
  }

  return `Transfer Keluar Bank ${start} s.d. ${end}.xlsx`
}

async function exportBankTransactionsToExcel() {
  const startDate = bankStartDate.value
  const endDate = bankEndDate.value

  const fileName = buildBankExportFileName(startDate, endDate)
  const rows = getBankExportRows()

  if (!rows.length) {
    showToast('Tidak ada data untuk diekspor.', 'warning')
    return
  }

  const printedAt = formatDateTime(new Date())

  const worksheetData = [
    ['LAPORAN TRANSFER KELUAR BANK'],
    [
      startDate === endDate
        ? `Periode : ${formatDateLong(startDate)}`
        : `Periode : ${formatDateLong(startDate)} - ${formatDateLong(endDate)}`
    ],
    [`Dicetak : ${printedAt}`],
    [],
    [
      'NO',
      'TANGGAL',
      'PENGIRIM',
      'PENERIMA',
      'KEPERLUAN',
      'NOMINAL TRANSFER',
      'BIAYA ADMIN',
      'TOTAL KELUAR'
    ]
  ]

  rows.forEach((row) => {
    worksheetData.push([
      row.no,
      row.tanggal,
      row.pengirim,
      row.penerima,
      row.keperluan,
      row.transfer,
      row.admin,
      row.total
    ])
  })

  const totalTransfer = rows.reduce((sum, row) => sum + row.transfer, 0)
  const totalAdmin = rows.reduce((sum, row) => sum + row.admin, 0)
  const totalKeluar = rows.reduce((sum, row) => sum + row.total, 0)

  worksheetData.push([])
  worksheetData.push([
    '',
    '',
    '',
    '',
    'TOTAL',
    totalTransfer,
    totalAdmin,
    totalKeluar
  ])

  const workbook = createWorkbook()
  const worksheet = workbook.addWorksheet('Transfer Keluar')

  worksheet.addRows(worksheetData)

  const totalRow = worksheet.lastRow
  const firstDataRow = 6
  const lastDataRow = firstDataRow + rows.length - 1

  applyTotalRowStyle(totalRow)

  worksheet.columns = [
    { key: 'no', width: 6 },
    { key: 'tanggal', width: 14 },
    { key: 'pengirim', width: 34 },
    { key: 'penerima', width: 34 },
    { key: 'keperluan', width: 50 },
    { key: 'transfer', width: 22 },
    { key: 'admin', width: 20 },
    { key: 'total', width: 22 }
  ]

  worksheet.mergeCells('A1:H1')
  worksheet.mergeCells('A2:H2')
  worksheet.mergeCells('A3:H3')

  worksheet.getRow(1).height = 28
  worksheet.getRow(2).height = 18
  worksheet.getRow(3).height = 18

  applyReportTitleStyle(worksheet, 'A1')
  applyReportSubtitleStyle(worksheet, 'A2')
  applyReportInfoStyle(worksheet, 'A3')

  const headerRow = worksheet.getRow(5)

  applyTableHeaderStyle(headerRow)

  applyTableBorders(worksheet, firstDataRow)

  // Alignment kolom — semua center
  ;['A', 'B', 'F', 'G', 'H'].forEach((column) => {
    worksheet.getColumn(column).alignment = {
      horizontal: 'center',
      vertical: 'middle'
    }
  })
  ;['C', 'D', 'E'].forEach((column) => {
    worksheet.getColumn(column).alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    }
  })

  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 5
    }
  ]

  worksheet.autoFilter = {
    from: 'A5',
    to: 'H5'
  }

  applyPrintSetup(worksheet, 'LAPORAN TRANSFER KELUAR BANK')

  applyNumberFormat(worksheet, ['F', 'G', 'H'], firstDataRow, lastDataRow)

  applyNumberFormat(
    worksheet,
    ['F', 'G', 'H'],
    totalRow.number,
    totalRow.number
  )

  await downloadWorkbook(workbook, fileName)
}

function getBankExportRows() {
  if (!Array.isArray(currentBankExpenses)) {
    return []
  }

  return [...currentBankExpenses]
    .sort((a, b) => {
      const dateCompare =
        new Date(a.transaction_date) - new Date(b.transaction_date)

      if (dateCompare !== 0) {
        return dateCompare
      }

      return new Date(a.created_at) - new Date(b.created_at)
    })
    .map((transaction, index) => {
      const transferAmount = Number(transaction.transfer_amount || 0)
      const adminFee = Number(transaction.admin_fee || 0)

      return {
        no: index + 1,
        tanggal: formatDateShort(transaction.transaction_date),
        pengirim: [
          transaction.sender?.income_suppliers?.owner_name ??
            transaction.sender?.name,
          transaction.sender?.bank && transaction.sender?.account_number
            ? `${transaction.sender.bank} • ${getLastThreeDigits(
                transaction.sender.account_number
              )}`
            : null
        ]
          .filter(Boolean)
          .join('\n'),

        penerima:
          [
            transaction.recipient?.income_suppliers?.owner_name ??
              transaction.recipient?.name ??
              transaction.recipient_name,
            transaction.recipient?.bank && transaction.recipient?.account_number
              ? `${transaction.recipient.bank} • ${getLastThreeDigits(
                  transaction.recipient.account_number
                )}`
              : null
          ]
            .filter(Boolean)
            .join('\n') || '-',
        keperluan: transaction.payment_for || '-',
        transfer: transferAmount,
        admin: adminFee,
        total: transferAmount + adminFee
      }
    })
}

exportBankExcelButton?.addEventListener('click', exportBankTransactionsToExcel)
