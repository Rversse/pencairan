const transactionModal = document.getElementById('transactionModal')

const openTransactionModal = document.getElementById('openTransactionModal')

const closeTransactionModal = document.getElementById('closeTransactionModal')

function openModal() {
  transactionModal.classList.add('show')

  updateFormFlow()
}

function closeModal() {
  transactionModal.classList.remove('show')
  if (editingTransactionId) {
    resetFormState()
  }
}

openTransactionModal.addEventListener('click', openModal)

closeTransactionModal.addEventListener('click', closeModal)

transactionModal.addEventListener('click', (event) => {
  if (event.target === transactionModal) {
    closeModal()
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal()
  }
})
