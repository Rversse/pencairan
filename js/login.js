async function initLogin() {
  const existingSession = await supabaseClient.auth.getSession()

  if (existingSession.data.session) {
    window.location.href = 'index.html'

    return
  }

  const credentials = {
    555999: {
      email: 'admin@internal.local',

      password: '555999',
    },

    123456: {
      email: 'viewer@internal.local',

      password: '123456',
    },
  }

  const pinInput = document.getElementById('pinInput')

  const dots = document.querySelectorAll('.dot')

  const errorText = document.getElementById('errorText')

  const loginCard = document.querySelector('.login-card')

  window.addEventListener('click', () => {
    pinInput.focus()
  })

  window.addEventListener('keydown', (event) => {
    const allowedKeys = ['Backspace', 'Tab', 'F5']

    const isNumber = /^[0-9]$/.test(event.key)

    if (!isNumber && !allowedKeys.includes(event.key)) {
      return
    }

    if (isNumber || event.key === 'Backspace') {
      event.preventDefault()
    }

    if (event.key === 'Backspace') {
      pinInput.value = pinInput.value.slice(0, -1)
    } else if (isNumber) {
      if (pinInput.value.length >= 6) {
        return
      }

      pinInput.value += event.key
    }

    updateDots()

    if (pinInput.value.length === 6) {
      validatePin()
    }
  })

  function updateDots() {
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index < pinInput.value.length)
    })
  }

  async function validatePin() {
    errorText.textContent = ''

    const pin = pinInput.value.trim()

    const userData = credentials[pin]

    if (!userData) {
      invalidPin()

      return
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: userData.email,

      password: userData.password,
    })

    if (error) {
      invalidPin()

      return
    }

    window.location.href = 'index.html'
  }

  function invalidPin() {
    loginCard.classList.add('shake')

    errorText.textContent = 'PIN salah'

    pinInput.value = ''

    updateDots()

    setTimeout(() => {
      loginCard.classList.remove('shake')
    }, 300)
  }
}

initLogin()
