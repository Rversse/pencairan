const PIN_LENGTH = 6

async function initLogin() {
  const { data } = await supabaseClient.auth.getSession()

  if (data.session) {
    window.location.href = 'index.html'
    return
  }

  const accountOptions = document.querySelectorAll('.account-option')
  const pinSection = document.getElementById('pinSection')
  const pinInput = document.getElementById('pinInput')
  const dots = document.querySelectorAll('.dot')
  const errorText = document.getElementById('errorText')
  const loginCard = document.querySelector('.login-card')

  let isLoggingIn = false
  let selectedUsername = 'admin'

  accountOptions[0]?.classList.add('selected')

  pinSection.style.display = ''
  pinInput.disabled = false

  setTimeout(() => pinInput.focus(), 100)

  accountOptions.forEach((option) => {
    option.addEventListener('click', async () => {
      if (isLoggingIn) return

      selectedUsername = option.dataset.username

      accountOptions.forEach((item) =>
        item.classList.toggle('selected', item === option)
      )

      errorText.textContent = ''

      if (selectedUsername === 'guest') {
        pinSection.style.display = 'none'

        pinInput.value = ''

        updateDots()

        await loginAsGuest()

        return
      }

      pinSection.style.display = ''

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

  document.querySelector('.pin-dots')?.addEventListener('click', () => {
    pinInput.focus()
  })

  function updateDots() {
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index < pinInput.value.length)
    })
  }

  async function loginAsGuest() {
    isLoggingIn = true

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: 'viewer@internal.local',
        password: '123456'
      })

      if (error) {
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

  async function validatePin() {
    if (isLoggingIn || selectedUsername !== 'admin') return

    isLoggingIn = true

    errorText.textContent = ''

    try {
      const { data, error } = await supabaseClient.functions.invoke(
        'login-with-username',
        {
          body: {
            username: 'admin',
            pin: pinInput.value.trim()
          }
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

    errorText.textContent =
      selectedUsername === 'admin' ? 'PIN salah' : 'Login Guest gagal'

    pinInput.value = ''

    updateDots()

    if (selectedUsername === 'admin') {
      pinInput.focus()
    }

    setTimeout(() => {
      loginCard.classList.remove('shake')
    }, 300)
  }
}

initLogin()
