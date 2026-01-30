// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// Modal functions for Insight Generator
function openDataModal(index) {
  const modal = document.getElementById('dataModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeDataModal() {
  const modal = document.getElementById('dataModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeDataModal();
  }
});

// Auth helper functions
const Auth = {
  // Store user in localStorage
  saveUser(user) {
    localStorage.setItem('versuni_user', JSON.stringify(user));
  },
  
  // Get current user
  getUser() {
    const user = localStorage.getItem('versuni_user');
    return user ? JSON.parse(user) : null;
  },
  
  // Check if logged in
  isLoggedIn() {
    return this.getUser() !== null;
  },
  
  // Logout
  logout() {
    localStorage.removeItem('versuni_user');
    window.location.href = 'signin.html';
  },
  
  // Get all registered users
  getUsers() {
    const users = localStorage.getItem('versuni_users');
    return users ? JSON.parse(users) : [];
  },
  
  // Register new user
  register(fullName, email, password) {
    const users = this.getUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Email already registered' };
    }
    
    // Add new user
    const newUser = { fullName, email, password, createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('versuni_users', JSON.stringify(users));
    
    return { success: true, user: newUser };
  },
  
  // Login
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.saveUser(user);
      return { success: true, user };
    }
    
    return { success: false, message: 'Invalid email or password' };
  }
};

// File upload handling
function setupFileUpload() {
  const fileUpload = document.querySelector('.file-upload');
  const fileInput = document.getElementById('fileInput');
  
  if (!fileUpload || !fileInput) return;
  
  fileUpload.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = '#00BABE';
    fileUpload.style.background = '#f0fdfa';
  });
  
  fileUpload.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = '#D1D5DC';
    fileUpload.style.background = 'transparent';
  });
  
  fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = '#D1D5DC';
    fileUpload.style.background = 'transparent';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });
}

function handleFileSelect(file) {
  const fileUpload = document.querySelector('.file-upload');
  const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    alert('Please upload a PNG, JPG, or PDF file.');
    return;
  }
  
  if (file.size > maxSize) {
    alert('File size must be less than 10MB.');
    return;
  }
  
  // Update UI to show selected file
  fileUpload.innerHTML = `
    <div class="file-upload-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
    <div class="file-upload-text">${file.name}</div>
    <div class="file-upload-hint">Click to change file</div>
  `;
}

// Form submission handlers
function setupForms() {
  // Insight Generator form
  const insightForm = document.getElementById('insightForm');
  if (insightForm) {
    insightForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const textarea = insightForm.querySelector('textarea');
      if (textarea.value.trim()) {
        alert('Generating insights for: ' + textarea.value);
        // In a real app, this would send to an API
      }
    });
  }
  
  // Creative Reviewer form
  const creativeForm = document.getElementById('creativeForm');
  if (creativeForm) {
    creativeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('fileInput');
      if (fileInput.files.length > 0) {
        alert('Reviewing creative: ' + fileInput.files[0].name);
        // In a real app, this would send to an API
      } else {
        alert('Please upload a file first.');
      }
    });
  }
  
  // Sign up form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const fullName = signupForm.querySelector('input[type="text"]').value;
      const email = signupForm.querySelector('input[type="email"]').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
      
      if (password.length < 4) {
        alert('Password must be at least 4 characters.');
        return;
      }
      
      const result = Auth.register(fullName, email, password);
      
      if (result.success) {
        Auth.saveUser(result.user);
        alert('Account created successfully! Welcome, ' + fullName + '!');
        window.location.href = 'dashboard.html';
      } else {
        alert(result.message);
      }
    });
  }
  
  // Sign in form
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('signinEmail').value;
      const password = document.getElementById('signinPassword').value;
      
      const result = Auth.login(email, password);
      
      if (result.success) {
        alert('Welcome back, ' + result.user.fullName + '!');
        window.location.href = 'dashboard.html';
      } else {
        alert(result.message);
      }
    });
  }
}

// Search functionality for Culture Map
function setupSearch() {
  const searchInput = document.querySelector('.search-input-wrapper input');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const regionCards = document.querySelectorAll('.region-card');
    
    regionCards.forEach(card => {
      const name = card.querySelector('.region-name').textContent.toLowerCase();
      const trait = card.querySelector('.region-trait').textContent.toLowerCase();
      
      if (name.includes(query) || trait.includes(query)) {
        card.style.display = 'block';
      } else {
        card.style.display = query ? 'none' : 'block';
      }
    });
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setupFileUpload();
  setupForms();
  setupSearch();
});
