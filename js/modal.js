const transactionModal = document.getElementById('transactionModal')

const openTransactionModal = document.getElementById('openTransactionModal')

const closeTransactionModal = document.getElementById('closeTransactionModal')

function openModal() {
  if (window.currentUser?.role !== 'admin') {
    return
  }

  if (transactionModal.classList.contains('show')) {
    return
  }

  if (!editingTransactionId) {
    resetFormState()
  }

  transactionModal.classList.add('show')

  resetModalScroll(transactionModal)

  document.body.style.overflow = 'hidden'

  updateFormFlow()
}

function hideTransactionModal() {
  transactionModal.classList.remove('show')

  document.body.style.overflow = ''

  resetFormState()
}

openTransactionModal.addEventListener('click', openModal)

closeTransactionModal.addEventListener('click', hideTransactionModal)

transactionModal.addEventListener('click', (event) => {
  if (event.target === transactionModal) {
    hideTransactionModal()
  }
})

window.addEventListener(
  'keydown',

  (event) => {
    if (event.key === 'Escape') {
      hideTransactionModal()

      closeDeleteModal?.()
    }
  }
)
