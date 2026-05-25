async function initAuth() {
  const {
    data: { session },
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

  console.log('AUTH SESSION:', session)

  window.currentUser = {
    ...session.user,
    role: profile.role,
  }

  return true
}
