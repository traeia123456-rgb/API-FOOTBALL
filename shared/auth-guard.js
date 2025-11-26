// ============================================
// AUTHENTICATION GUARD
// ============================================

/**
 * Require user to be authenticated
 * Redirects to login if not authenticated
 */
async function requireAuth() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
        // Store the intended destination
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/auth/login.html';
        return null;
    }

    return user;
}

/**
 * Require user to be admin
 * Redirects to dashboard if not admin
 */
async function requireAdmin() {
    const user = await requireAuth();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error || data.role !== 'admin') {
        showToast('Acceso denegado. Se requieren permisos de administrador.', 'error');
        window.location.href = '/dashboard/dashboard.html';
        return null;
    }

    return user;
}

/**
 * Get current user profile
 */
async function getCurrentProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}

/**
 * Logout user
 */
async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error('Error logging out:', error);
        showToast('Error al cerrar sesión', 'error');
        return;
    }

    window.location.href = '/auth/login.html';
}

/**
 * Check if user is already logged in
 * Redirects to dashboard if logged in
 */
async function redirectIfAuthenticated() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        window.location.href = '/dashboard/dashboard.html';
    }
}
