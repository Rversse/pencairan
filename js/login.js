const PIN_LENGTH = 6

const CREDENTIALS = {
  555999: {
    email: 'admin@internal.local',
    password: '555999'
  },

  123456: {
    email: 'viewer@internal.local',
    password: '123456'
  }
}

async function initLogin() {
  const { data } = await supabaseClient.auth.getSession()

  if (data.session) {
    window.location.href = 'index.html'
    return
  }

  const pinInput = document.getElementById('pinInput')
  const dots = document.querySelectorAll('.dot')
  const errorText = document.getElementById('errorText')
  const loginCard = document.querySelector('.login-card')

  let isLoggingIn = false

  window.addEventListener('load', () => {
    pinInput.focus()
  })

  window.addEventListener('click', () => {
    pinInput.focus()
  })

  pinInput.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, PIN_LENGTH)

    updateDots()

    if (pinInput.value.length === PIN_LENGTH) {
      validatePin()
    }
  })

  function updateDots() {
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index < pinInput.value.length)
    })
  }

  async function validatePin() {
    if (isLoggingIn) return

    isLoggingIn = true

    errorText.textContent = ''

    const pin = pinInput.value.trim()

    const userData = CREDENTIALS[pin]

    if (!userData) {
      invalidPin()
      isLoggingIn = false
      return
    }

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      })

      if (error) {
        invalidPin()
        return
      }

      window.location.href = 'index.html'
    } catch (err) {
      console.error(err)

      invalidPin()
    } finally {
      isLoggingIn = false
    }
  }

  function invalidPin() {
    loginCard.classList.add('shake')

    errorText.textContent = 'PIN salah'

    pinInput.value = ''

    updateDots()

    pinInput.focus()

    setTimeout(() => {
      loginCard.classList.remove('shake')
    }, 300)
  }
}

initLogin()
