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

  transactionModal.classList.add('show')

  document.body.style.overflow = 'hidden'

  updateFormFlow()
}

function closeModal() {
  transactionModal.classList.remove('show')

  document.body.style.overflow = ''

  resetFormState()
}

openTransactionModal.addEventListener('click', openModal)

closeTransactionModal.addEventListener('click', closeModal)

transactionModal.addEventListener('click', (event) => {
  if (event.target === transactionModal) {
    closeModal()
  }
})

window.addEventListener(
  'keydown',

  (event) => {
    if (event.key === 'Escape') {
      closeModal()

      closeDeleteModal?.()
    }
  }
)
