async function validateTurnstileToken(token, remoteip) {
    const formData = new FormData();
    formData.append('secret', TURNSTILE_CONFIG.secretKey);
    formData.append('response', token);

    if (remoteip) {
        formData.append('remoteip', remoteip);
    }

    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Turnstile validation error:', error);
        return { success: false, 'error-codes': ['internal-error'] };
    }
}

/**
 * Reset Turnstile widget
 */
function resetTurnstile(widgetId) {
    if (typeof turnstile !== 'undefined') {
        turnstile.reset(widgetId);
    }
}

/**
 * Get Turnstile response token
 */
function getTurnstileResponse(widgetId) {
    if (typeof turnstile !== 'undefined') {
        return turnstile.getResponse(widgetId);
    }
    return null;
}

// Export for use in other files
window.turnstileConfig = TURNSTILE_CONFIG;
window.validateTurnstileToken = validateTurnstileToken;
window.resetTurnstile = resetTurnstile;
window.getTurnstileResponse = getTurnstileResponse;
