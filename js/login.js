const PIN_LENGTH = 6

async function initLogin() {
  const { data } = await supabaseClient.auth.getSession()

  if (data.session) {
    window.location.href = 'index.html'
    return
  }

  const accountOptions = document.querySelectorAll('.account-option')
  const pinInput = document.getElementById('pinInput')
  const dots = document.querySelectorAll('.dot')
  const errorText = document.getElementById('errorText')
  const loginCard = document.querySelector('.login-card')

  let isLoggingIn = false
  let selectedUsername = ''

  pinInput.disabled = true

  window.addEventListener('load', () => {
    accountOptions[0]?.focus()
  })

  accountOptions.forEach((option) => {
    option.addEventListener('click', () => {
      selectedUsername = option.dataset.username

      accountOptions.forEach((item) => {
        item.classList.toggle('selected', item === option)
      })

      errorText.textContent = ''
      pinInput.disabled = false
      pinInput.focus()
    })
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

    const username = selectedUsername
    const pin = pinInput.value.trim()

    try {
      const { data, error } = await supabaseClient.functions.invoke(
        'login-with-username',
        {
          body: { username, pin }
        }
      )

      if (error || !data?.access_token || !data?.refresh_token) {
        invalidLogin()
        return
      }

      const { error: sessionError } = await supabaseClient.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      })

      if (sessionError) {
        invalidLogin()
        return
      }

      window.location.href = 'index.html'
    } catch (err) {
      console.error(err)

      invalidLogin()
    } finally {
      isLoggingIn = false
    }
  }

  function invalidLogin() {
    loginCard.classList.add('shake')

    errorText.textContent = 'Username atau PIN salah'

    pinInput.value = ''

    updateDots()

    pinInput.focus()

    setTimeout(() => {
      loginCard.classList.remove('shake')
    }, 300)
  }
}

initLogin()
