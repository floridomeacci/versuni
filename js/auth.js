// Authentication module
const VERSUNI_USER = 'versuni';
const VERSUNI_PASS = 'P@sw0rd!Versuni';
const AUTH_KEY = 'versuni_auth';

// Check if user is authenticated
function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

// Set authentication status
function setAuthenticated(status) {
  if (status) {
    sessionStorage.setItem(AUTH_KEY, 'true');
  } else {
    sessionStorage.removeItem(AUTH_KEY);
  }
}

// Redirect to signin if not authenticated
function requireAuth() {
  if (!isAuthenticated() && !window.location.pathname.endsWith('signin.html') && !window.location.pathname.endsWith('/')) {
    window.location.href = 'signin.html';
  }
}

// Handle signin form submission
function handleSignin(event) {
  event.preventDefault();
  
  const username = document.getElementById('signinUsername').value.trim();
  const password = document.getElementById('signinPassword').value;
  
  if (username === VERSUNI_USER && password === VERSUNI_PASS) {
    setAuthenticated(true);
    window.location.href = 'dashboard.html';
  } else {
    alert('Invalid username or password');
  }
}

// Handle signout
function signOut() {
  setAuthenticated(false);
  window.location.href = 'signin.html';
}

// Initialize auth on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

function initAuth() {
  // Attach signin handler if on signin page
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', handleSignin);
  }
  
  // Require auth for protected pages
  requireAuth();
}
