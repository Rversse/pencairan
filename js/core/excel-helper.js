/**
 * Membuat workbook Excel dengan metadata standar aplikasi.
 */
function createWorkbook() {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'SIM SPPG'
  workbook.lastModifiedBy = 'SIM SPPG'
  workbook.created = new Date()
  workbook.modified = new Date()

  return workbook
}

/**
 * Mengunduh workbook sebagai file Excel.
 *
 * @param {ExcelJS.Workbook} workbook
 * @param {string} fileName
 */
async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer()

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = fileName

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Memberikan style judul laporan.
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {string} cell
 */
function applyReportTitleStyle(worksheet, cell) {
  const target = worksheet.getCell(cell)

  target.font = {
    bold: true,
    size: 18
  }

  target.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  }
}

/**
 * Memberikan style subjudul laporan.
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {string} cell
 */
function applyReportSubtitleStyle(worksheet, cell) {
  const target = worksheet.getCell(cell)

  target.font = {
    italic: true,
    size: 12
  }

  target.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  }
}

/**
 * Memberikan style informasi kecil.
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {string} cell
 */
function applyReportInfoStyle(worksheet, cell) {
  const target = worksheet.getCell(cell)

  target.font = {
    size: 11,
    color: {
      argb: '666666'
    }
  }

  target.alignment = {
    horizontal: 'center',
    vertical: 'middle'
  }
}

/**
 * Memberikan style standar untuk header tabel.
 *
 * @param {ExcelJS.Row} headerRow
 */
function applyTableHeaderStyle(headerRow) {
  headerRow.height = 24

  headerRow.font = {
    bold: true,
    color: {
      argb: 'FFFFFF'
    }
  }

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: '1F4E78'
      }
    }

    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    }
  })
}

/**
 * Memberikan border pada seluruh tabel.
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} startRow
 */
function applyTableBorders(worksheet, startRow) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return

    row.eachCell((cell) => {
      cell.border = {
        top: {
          style: 'thin'
        },
        left: {
          style: 'thin'
        },
        bottom: {
          style: 'thin'
        },
        right: {
          style: 'thin'
        }
      }
    })
  })
}

/**
 * Memberikan style standar untuk baris total.
 *
 * @param {ExcelJS.Row} totalRow
 */
function applyTotalRowStyle(totalRow) {
  totalRow.font = {
    bold: true
  }

  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
      argb: 'E2F0D9'
    }
  }
}

/**
 * Menerapkan pengaturan halaman standar untuk laporan.
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {string} reportTitle
 */
function applyPrintSetup(worksheet, reportTitle) {
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',

    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,

    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3
    }
  }

  worksheet.headerFooter = {
    differentFirst: false,

    oddHeader: `&C&B${reportTitle}`,

    oddFooter: '&L&D &T&CPage &P of &N&RSIM SPPG'
  }
}

/**
 * Menerapkan format angka pada beberapa kolom.
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {string[]} columns
 * @param {number} firstRow
 * @param {number} lastRow
 * @param {string} format
 */
function applyNumberFormat(
  worksheet,
  columns,
  firstRow,
  lastRow,
  format = '#,##0'
) {
  for (let row = firstRow; row <= lastRow; row++) {
    columns.forEach((column) => {
      worksheet.getCell(`${column}${row}`).numFmt = format
    })
  }
}
