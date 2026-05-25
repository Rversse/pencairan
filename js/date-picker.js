document.querySelectorAll('input[type="date"]').forEach((input) => {
  input.addEventListener('click', () => {
    if (input.showPicker) {
      input.showPicker()
    }
  })
})
