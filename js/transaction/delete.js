function openDeleteModal(id) {
  if (window.currentUser?.role !== 'admin') {
    return
  }
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

confirmDeleteButton.addEventListener(
  'click',

  async () => {
    if (window.currentUser?.role !== 'admin') {
      showToast('Akses ditolak')
      return
    }

    if (!deleteTransactionId) {
      return
    }

    if (confirmDeleteButton.disabled) {
      return
    }

    confirmDeleteButton.disabled = true

    const originalText = confirmDeleteButton.textContent

    confirmDeleteButton.textContent = 'Menghapus...'

    try {
      const transaction = await supabaseClient
        .from('transactions')
        .select('transaction_date')
        .eq('id', deleteTransactionId)
        .single()

      const transactionDate = new Date(transaction.data.transaction_date)

      if (isTransactionLocked(transaction.data.transaction_date)) {
        showToast('Transaksi sudah dikunci')

        return
      }

      const today = new Date()

      const diffDays = Math.floor(
        (today - transactionDate) / (1000 * 60 * 60 * 24)
      )

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

      await loadDailyStatus()
    } catch (error) {
      console.error(error)

      showToast('Terjadi kesalahan')
    } finally {
      confirmDeleteButton.disabled = false

      confirmDeleteButton.textContent = originalText
    }
  }
)
