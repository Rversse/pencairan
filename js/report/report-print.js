function printReport() {
  const printContent = document.getElementById('reportSection').innerHTML

  const html = `
  <!DOCTYPE html>

  <html lang="id">

  <head>

    <meta charset="UTF-8">

    <title>
      Laporan Pencairan
    </title>

    <style>

    .report-filters,
#generateButton,
#printButton,
#exportExcelButton {
  display: none !important;
}

      * {

        box-sizing:
          border-box;

        margin: 0;

        padding: 0;
      }

      body {

        font-family:
          Arial,
          sans-serif;

        color: #18293F;

        padding: 22px 28px;

        font-size: 11px;

        background:
          white;
      }

      .filters,
      button {

        display:
          none !important;
      }

      #reportDetails {

  display:
    none !important;
}

      .container {

        width: 100%;
      }

      .topbar {

        display: flex;

        justify-content:
          space-between;

        align-items: flex-start;

        margin-bottom: 18px;

        border-bottom:
          2px solid #0D2137;

        padding-bottom:
          10px;
      }

      h1 {

        font-size: 20px;

        margin: 0;
      }

      #reportPeriod {

        font-size: 12px;

        color: #637A96;

        margin-top: 4px;
      }

      .summary-grid {

        display: grid;

        grid-template-columns:
          repeat(4, 1fr);

        gap: 12px;

        margin-bottom: 14px;
      }

.summary-card {
  background: #fff;

  border: 1.5px solid #d2daea;

  border-radius: 10px;

  padding: 14px 16px;
}

.summary-card:nth-child(1) {
  border-left: 5px solid #16a34a;
}

.summary-card:nth-child(2) {
  border-left: 5px solid #dc2626;
}

.summary-card:nth-child(3) {
  border-left: 5px solid #d97706;
}

.summary-card:nth-child(4) {
  border-left: 5px solid #2563eb;
}

.summary-card.is-negative {
  border-left-color: #dc2626 !important;
}

      .summary-card small {

        display: block;

        font-size: 10px;

        font-weight: bold;

        text-transform:
          uppercase;

        color: #637A96;

        margin-bottom: 4px;
      }

      .summary-card h2 {

        font-size: 18px;

        margin: 0;
      }

      table {

        width: 100%;

        border-collapse:
          collapse;

          line-height:
  1.4;
      }

      th {

        background:
          #ECF0F6;

        vertical-align:
  middle;

        color:
          #637A96;

        font-size:
          9px;

        text-transform:
          uppercase;

        padding:
          8px 10px;

        border-bottom:
          2px solid #D2DAEA;

        white-space:
          nowrap;
      }

    td {

    font-size:
        12px;

    padding:
        9px 10px;

    text-align:
        center;

    vertical-align:
        middle;

    border-bottom:
        1px solid #D2DAEA;
    }

      tfoot td {

        font-weight:
          bold;

        background:
          #ECF0F6;

        border-top:
          2px solid #D2DAEA;
      }

      .positive {

        color:
          #1DB96A;

        font-weight:
          bold;
      }

      .negative {

        color:
          #E8404A;

        font-weight:
          bold;
      }

    </style>

  </head>

<body>

  ${printContent}

  <div
    style="
      margin-top:18px;
      text-align:right;
      font-size:11px;
      color:#637A96;
    "
  >

    Dicetak:
${new Date()
  .toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  .replace(/\./g, ':')
  .replace(/\//g, '-')}

  </div>

</body>

  </html>
  `

  const iframe = document.createElement('iframe')

  iframe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      z-index: 99999;
      background: white;
    `

  document.body.appendChild(iframe)

  iframe.contentDocument.open()

  iframe.contentDocument.write(html)

  iframe.contentDocument.close()

  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe)
  }

  setTimeout(() => {
    iframe.contentWindow.focus()

    iframe.contentWindow.print()
  }, 400)
}
