function hideSplash() {
  const splash = document.getElementById('appSplash')

  if (!splash) return

  splash.style.opacity = '0'

  setTimeout(() => splash.remove(), 250)
}

async function initAuth() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession()

  if (!session) {
    window.location.href = 'login.html'

    return false
  }

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    await supabaseClient.auth.signOut()

    window.location.href = 'login.html'

    return false
  }

  window.currentUser = {
    ...session.user,
    role: profile.role
  }

  hideSplash()

  return true
}
