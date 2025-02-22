// auth-redirect.js

class AuthRedirect {
    constructor() {
        this.dashboardUrl = '/dashboard.html'; // Update this with your dashboard page URL
        this.loginUrl = '/login.html'; // Update this with your login page URL
        this.registerUrl = '/register.html'; // Update this with your registration page URL
    }

    // Check if user is authenticated
    isAuthenticated() {
        // Check for auth token in localStorage
        const authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        // Validate token and user data
        if (!authToken || !userData) {
            return false;
        }

        try {
            // Parse user data
            const user = JSON.parse(userData);
            
            // Additional validation can be added here
            if (!user.id || !user.email) {
                return false;
            }

            // Check if token is expired
            const tokenData = this.parseJwt(authToken);
            if (tokenData.exp && Date.now() >= tokenData.exp * 1000) {
                // Clear expired token
                this.clearAuth();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating authentication:', error);
            return false;
        }
    }

    // Parse JWT token
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return {};
        }
    }

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }

    // Handle redirect based on auth status
    handleAuthRedirect() {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('login') || currentPath.includes('register');

        if (this.isAuthenticated()) {
            // If user is authenticated and on auth pages, redirect to dashboard
            if (isAuthPage) {
                window.location.href = this.dashboardUrl;
            }
        } else {
            // If user is not authenticated and not on auth pages, redirect to login
            if (!isAuthPage) {
                window.location.href = this.loginUrl;
            }
        }
    }

    // Initialize event listeners
    initializeAuthListeners() {
        // Listen for storage events (logout from other tabs)
        window.addEventListener('storage', (event) => {
            if (event.key === 'authToken' && !event.newValue) {
                this.handleAuthRedirect();
            }
        });

        // Check auth status periodically
        setInterval(() => {
            this.handleAuthRedirect();
        }, 300000); // Check every 5 minutes
    }
}

// Initialize and export the auth redirect handler
const authRedirect = new AuthRedirect();
export default authRedirect;
