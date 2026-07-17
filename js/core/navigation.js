document.querySelectorAll('.nav-dropdown-toggle').forEach((button) => {
  button.addEventListener('click', (e) => {
    e.stopPropagation()

    const dropdown = button.parentElement

    document.querySelectorAll('.nav-dropdown').forEach((item) => {
      if (item !== dropdown) {
        item.classList.remove('open')
      }
    })

    dropdown.classList.toggle('open')
  })
})

document.querySelectorAll('.nav-dropdown-menu .nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown').forEach((item) => {
      item.classList.remove('open')
    })
  })
})

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return

  document.querySelectorAll('.nav-dropdown').forEach((item) => {
    item.classList.remove('open')
  })
})

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown').forEach((item) => {
    item.classList.remove('open')
  })
})
