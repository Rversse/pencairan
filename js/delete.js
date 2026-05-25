function openDeleteModal(id) {
  deleteTransactionId = id

  deleteModal.classList.add('show')
}

function closeDeleteModal() {
  deleteModal.classList.remove('show')

  deleteTransactionId = null
}

cancelDeleteButton.addEventListener('click', closeDeleteModal)

deleteModal.addEventListener('click', (event) => {
  if (event.target === deleteModal) {
    closeDeleteModal()
  }
})

confirmDeleteButton.addEventListener('click', async () => {
  if (!deleteTransactionId) {
    return
  }

  const transaction = await supabaseClient
    .from('transactions')
    .select('transaction_date')
    .eq('id', deleteTransactionId)
    .single()

  const transactionDate = new Date(transaction.data.transaction_date)

  const today = new Date()

  const diffDays = Math.floor((today - transactionDate) / (1000 * 60 * 60 * 24))

  if (diffDays > 7) {
    const confirmOld = confirm(
      'Transaksi lama terdeteksi. Yakin ingin menghapus?'
    )

    if (!confirmOld) {
      return
    }
  }

  const { error } = await supabaseClient
    .from('transactions')
    .delete()
    .eq('id', deleteTransactionId)

  if (error) {
    console.error(error)

    showToast('Gagal hapus transaksi')

    return
  }

  closeDeleteModal()

  showToast('Transaksi berhasil dihapus')

  await loadTransactions()

  await loadDashboard()
})
