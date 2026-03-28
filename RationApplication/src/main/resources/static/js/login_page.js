(function() {
    const roleOptions = document.querySelectorAll('.role-option');

    const roleConfig = {
        BENEFICIARY: {
            features: document.getElementById('beneficiaryFeatures'),
            form: document.getElementById('beneficiaryForm'),
            welcome: 'Welcome, Beneficiary',
            description: 'Access your ration dashboard, view quota & history.',
            formTitle: 'Beneficiary Login',
            buttonText: 'Login as Beneficiary',
            modalTitle: 'Reset Beneficiary Password',
            modalDescription: 'Enter your username to receive reset link.',
            modalLabel: 'Username',
            resetButtonText: 'Send Reset Link',
            usernameField: 'benUsername',
            passwordField: 'benPassword'
        },
        DISTRIBUTOR: {
            features: document.getElementById('distributorFeatures'),
            form: document.getElementById('distributorForm'),
            welcome: 'Welcome, PDS Distributor',
            description: 'Manage ration distribution, verify beneficiaries.',
            formTitle: 'Distributor Login',
            buttonText: 'Login as Distributor',
            modalTitle: 'Reset Distributor Password',
            modalDescription: 'Enter your username to receive reset link.',
            modalLabel: 'Username',
            resetButtonText: 'Send Reset Link',
            usernameField: 'distUsername',
            passwordField: 'distPassword'
        },
        ADMIN: {
            features: document.getElementById('adminFeatures'),
            form: document.getElementById('adminForm'),
            welcome: 'Welcome, Administrator',
            description: 'District monitoring, reports & master control.',
            formTitle: 'Admin Login',
            buttonText: 'Login as Admin',
            modalTitle: 'Reset Admin Password',
            modalDescription: 'Enter your username to receive reset link.',
            modalLabel: 'Username',
            resetButtonText: 'Send Reset Link',
            usernameField: 'adminUsername',
            passwordField: 'adminPassword'
        }
    };

    let currentRole = 'BENEFICIARY';

    // ===== ROLE SELECTION =====
    function setActiveRole(role) {
        // Update pills
        roleOptions.forEach(opt => {
            const r = opt.dataset.role;
            if (r === role) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        // Hide all feature blocks & forms
        document.querySelectorAll('.login-info .role-info').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.login-form-container .role-info').forEach(el => el.classList.remove('active'));

        // Show selected
        if (roleConfig[role]) {
            roleConfig[role].features.classList.add('active');
            roleConfig[role].form.classList.add('active');
        }

        // Update UI text
        document.getElementById('roleWelcome').textContent = roleConfig[role].welcome;
        document.getElementById('roleDescription').textContent = roleConfig[role].description;
        document.getElementById('formTitle').textContent = roleConfig[role].formTitle;
        document.getElementById('formDescription').textContent = 'Enter your credentials to access the portal';
        document.getElementById('loginBtnText').textContent = roleConfig[role].buttonText;

        currentRole = role;
    }

    roleOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.preventDefault();
            const role = opt.dataset.role;
            setActiveRole(role);
        });
    });

    // ===== PASSWORD VISIBILITY TOGGLE =====
    window.toggleField = function(fieldId, btn) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
        field.setAttribute('type', type);

        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.toggle('ri-eye-line');
            icon.classList.toggle('ri-eye-off-line');
        }
    };

    // ===== LOGIN FORM SUBMISSION =====
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginErrorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get credentials based on current role
        const config = roleConfig[currentRole];
        const username = document.getElementById(config.usernameField).value.trim();
        const password = document.getElementById(config.passwordField).value.trim();

        // Validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }

        if (password.length < 4) {
            showError('Password must be at least 4 characters');
            return;
        }

        try {
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Logging in...';

            // Call API
            const response = await login(username, password);

            if (response && response.success) {
                // Store auth data
                setAuthToken(response.token);
                localStorage.setItem('username', response.username);
                localStorage.setItem('userRole', response.roles[0]);
                localStorage.setItem('email', response.email || '');
                localStorage.setItem('stateDistrictCode', response.stateDistrictCode || '');

                // Show success
                errorDiv.classList.remove('show');
                alert('Login successful! Redirecting...');

                // Redirect based on role
                setTimeout(() => {
                    if (response.roles[0] === 'BENEFICIARY') {
                        window.location.href = '/beneficiary_dashboard.html';
                    } else if (response.roles[0] === 'DISTRIBUTOR') {
                        window.location.href = '/distributor_dashboard.html';
                    } else if (response.roles[0] === 'ADMIN') {
                        window.location.href = '/admin_dashboard.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                }, 500);
            } else {
                showError(response?.message || 'Login failed. Please check your credentials.');
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="ri-login-box-line"></i> <span>' + config.buttonText + '</span>';
        } catch (error) {
            showError('Error: ' + error.message);
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.innerHTML = '<i class="ri-login-box-line"></i> <span>' + config.buttonText + '</span>';
        }
    });

    function showError(message) {
        errorDiv.textContent = '<i class="ri-error-warning-line"></i> ' + message;
        errorDiv.classList.add('show');
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }

    // ===== FORGOT PASSWORD MODAL =====
    const modal = document.getElementById('forgotModal');
    const forgotLink = document.getElementById('forgotPasswordLink');
    const closeModal = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalLabel = document.getElementById('modalLabel');
    const resetBtnSpan = document.getElementById('resetBtnText');
    const resetField = document.getElementById('resetField');
    const resetSuccess = document.getElementById('resetSuccess');
    const forgotForm = document.getElementById('forgotForm');

    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();

        const config = roleConfig[currentRole];
        modalTitle.textContent = config.modalTitle;
        modalDesc.textContent = config.modalDescription;
        modalLabel.textContent = config.modalLabel;
        resetBtnSpan.textContent = config.resetButtonText;
        resetField.placeholder = `Enter ${config.modalLabel}`;
        resetSuccess.classList.remove('show');
        resetField.value = '';
        modal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = resetField.value.trim();

        if (!username) {
            alert('Please enter your username');
            return;
        }

        // Show success message
        resetSuccess.classList.add('show');

        setTimeout(() => {
            modal.classList.remove('active');
            resetSuccess.classList.remove('show');
            resetField.value = '';
        }, 2000);
    });

    // ===== HEADER SCROLL EFFECT =====
    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ===== MOBILE MENU =====
    document.querySelector('.mobile-menu')?.addEventListener('click', () => {
        alert('Mobile navigation would open here');
    });

    // ===== INITIALIZE =====
    setActiveRole('BENEFICIARY');

})();

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);