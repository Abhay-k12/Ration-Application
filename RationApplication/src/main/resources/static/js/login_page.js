(function () {
  let currentRole = "BENEFICIARY";
  let isSubmitting = false;

  const roleOptions = document.querySelectorAll(".role-option");
  const loginForm = document.getElementById("loginForm");
  const errorDiv = document.getElementById("loginErrorMessage");

  const roleConfig = {
    BENEFICIARY: {
      features: document.getElementById("beneficiaryFeatures"),
      form: document.getElementById("beneficiaryForm"),
      welcome: "Welcome, Beneficiary",
      description: "Access your ration dashboard, view quota & history.",
      formTitle: "Beneficiary Login",
      formDescription: "Enter your credentials to access the portal",
      buttonText: "Login as Beneficiary",
      modalTitle: "Reset Beneficiary Password",
      modalDescription: "Enter your username to receive reset link.",
      modalLabel: "Username",
      resetButtonText: "Send Reset Link",
      usernameField: "benUsername",
      passwordField: "benPassword",
    },
    DISTRIBUTOR: {
      features: document.getElementById("distributorFeatures"),
      form: document.getElementById("distributorForm"),
      welcome: "Welcome, PDS Distributor",
      description: "Manage ration distribution, verify beneficiaries.",
      formTitle: "Distributor Login",
      formDescription: "Enter your credentials to access the portal",
      buttonText: "Login as Distributor",
      modalTitle: "Reset Distributor Password",
      modalDescription: "Enter your username to receive reset link.",
      modalLabel: "Username",
      resetButtonText: "Send Reset Link",
      usernameField: "distUsername",
      passwordField: "distPassword",
    },
    ADMIN: {
      features: document.getElementById("adminFeatures"),
      form: document.getElementById("adminForm"),
      welcome: "Welcome, Administrator",
      description: "District monitoring, reports & master control.",
      formTitle: "Admin Login",
      formDescription: "Enter your credentials to access the portal",
      buttonText: "Login as Admin",
      modalTitle: "Reset Admin Password",
      modalDescription: "Enter your username to receive reset link.",
      modalLabel: "Username",
      resetButtonText: "Send Reset Link",
      usernameField: "adminUsername",
      passwordField: "adminPassword",
    },
  };

  // Helper functions for messages
  function showError(message) {
    console.log("[ERROR] Showing error message:", message);

    if (!errorDiv) {
      console.error("[ERROR] Error div not found");
      alert("Error: " + message);
      return;
    }

    errorDiv.innerHTML = '<i class="ri-error-warning-line"></i> ' + message;
    errorDiv.className = "error-message show";
    errorDiv.style.display = "block";

    console.log("[ERROR] Error message displayed");

    setTimeout(() => {
      hideMessage();
    }, 6000);
  }

  function showSuccess(message) {
    console.log("[SUCCESS] Showing success message:", message);

    if (!errorDiv) {
      console.error("[SUCCESS] Error div not found");
      alert(message);
      return;
    }

    errorDiv.innerHTML = '<i class="ri-checkbox-circle-line"></i> ' + message;
    errorDiv.className = "success-message show";
    errorDiv.style.display = "block";

    console.log("[SUCCESS] Success message displayed");
  }

  function hideMessage() {
    console.log("[MESSAGE] Hiding message");

    if (errorDiv) {
      errorDiv.className = "error-message";
      errorDiv.style.display = "none";
      errorDiv.textContent = "";
    }
  }

  // Make toggleField available globally
  window.toggleField = function (fieldId, btn) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.type = field.type === "password" ? "text" : "password";

    const icon = btn?.querySelector("i");
    if (icon) {
      icon.classList.toggle("ri-eye-line");
      icon.classList.toggle("ri-eye-off-line");
    }
  };

  // Disable inputs of inactive roles
  function syncRoleInputs(role) {
    const ids = [
      "benUsername",
      "benPassword",
      "distUsername",
      "distPassword",
      "adminUsername",
      "adminPassword",
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });

    const cfg = roleConfig[role];
    if (!cfg) return;

    const u = document.getElementById(cfg.usernameField);
    const p = document.getElementById(cfg.passwordField);
    if (u) u.disabled = false;
    if (p) p.disabled = false;
  }

  // Role selection UI update
  function setActiveRole(role) {
    if (!roleConfig[role]) return;

    console.log("[ROLE] Switching to role:", role);

    roleOptions.forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.role === role);
    });

    document
      .querySelectorAll(".login-info .role-info")
      .forEach((el) => el.classList.remove("active"));
    document
      .querySelectorAll(".login-form-container .role-info")
      .forEach((el) => el.classList.remove("active"));

    const cfg = roleConfig[role];
    cfg.features.classList.add("active");
    cfg.form.classList.add("active");

    document.getElementById("roleWelcome").textContent = cfg.welcome;
    document.getElementById("roleDescription").textContent = cfg.description;
    document.getElementById("formTitle").textContent = cfg.formTitle;
    document.getElementById("formDescription").textContent = cfg.formDescription;
    document.getElementById("loginBtnText").textContent = cfg.buttonText;

    currentRole = role;
    syncRoleInputs(role);
    hideMessage();
    loginForm.reset();
  }

  // Role option click handlers
  roleOptions.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveRole(opt.dataset.role);
    });
  });

  // Login form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("[LOGIN] Form submitted");

    if (isSubmitting) {
      console.log("[LOGIN] Already submitting, ignoring duplicate");
      return;
    }

    isSubmitting = true;

    const cfg = roleConfig[currentRole];
    const username = (document.getElementById(cfg.usernameField)?.value || "").trim();
    const password = (document.getElementById(cfg.passwordField)?.value || "").trim();

    console.log("[LOGIN] Attempting with username:", username, "Role:", currentRole);

    hideMessage();

    if (!username || !password) {
      showError("Please fill in all fields");
      isSubmitting = false;
      return;
    }

    if (password.length < 4) {
      showError("Password must be at least 4 characters");
      isSubmitting = false;
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Logging in...';

    try {
      console.log("[LOGIN] Calling login API");

      const response = await login(username, password);

      console.log("[LOGIN] API Response received:", response);

      if (!response) {
        console.error("[LOGIN] No response from server");
        showError("No response from server. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
        isSubmitting = false;
        return;
      }

      console.log("[LOGIN] Response success status:", response.success);

      if (response.success) {
        console.log("[LOGIN] Login successful");

        setAuthToken(response.token);
        localStorage.setItem("username", response.username || username);
        localStorage.setItem("userRole", response.roles?.[0] || "");
        localStorage.setItem("email", response.email || "");
        localStorage.setItem("stateDistrictCode", response.stateDistrictCode || "");

        const role = response.roles?.[0];

        showSuccess(
          "Login successful! Welcome, " +
            (response.username || "User") +
            ". Redirecting..."
        );

        setTimeout(() => {
          console.log("[LOGIN] Redirecting to dashboard for role:", role);

          if (role === "BENEFICIARY") {
            window.location.href = "/beneficiary_dashboard.html";
          } else if (role === "DISTRIBUTOR") {
            window.location.href = "/distributor_dashboard.html";
          } else if (role === "ADMIN") {
            window.location.href = "/admin_dashboard.html";
          } else {
            window.location.href = "/index.html";
          }
        }, 1500);

        return;
      } else {
        console.log("[LOGIN] Login failed");
        const errorMessage = response.message || "Login failed. Please check your credentials.";
        console.log("[LOGIN] Error message:", errorMessage);

        showError(errorMessage);

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
        isSubmitting = false;
      }
    } catch (err) {
      console.error("[LOGIN] Error occurred:", err);

      showError(
        "Error: " + (err.message || "Could not connect to server. Please try again.")
      );

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
      isSubmitting = false;
    }
  });

  // Forgot password modal
  const modal = document.getElementById("forgotModal");
  const forgotLink = document.getElementById("forgotPasswordLink");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalLabel = document.getElementById("modalLabel");
  const resetBtnSpan = document.getElementById("resetBtnText");
  const resetField = document.getElementById("resetField");
  const resetSuccess = document.getElementById("resetSuccess");
  const forgotForm = document.getElementById("forgotForm");

  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();

    const cfg = roleConfig[currentRole];
    modalTitle.textContent = cfg.modalTitle;
    modalDesc.textContent = cfg.modalDescription;
    modalLabel.textContent = cfg.modalLabel;
    resetBtnSpan.textContent = cfg.resetButtonText;

    resetField.placeholder = "Enter " + cfg.modalLabel;
    resetField.value = "";
    resetSuccess.style.display = "none";

    modal.classList.add("active");
  });

  closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    resetSuccess.style.display = "none";
    resetField.value = "";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
      resetSuccess.style.display = "none";
      resetField.value = "";
    }
  });

  forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = resetField.value.trim();

    if (!username) {
      alert("Please enter your username");
      return;
    }

    console.log("[FORGOT] Reset password requested for:", username);

    resetSuccess.style.display = "block";

    setTimeout(() => {
      modal.classList.remove("active");
      resetSuccess.style.display = "none";
      resetField.value = "";
      alert("Password reset link sent to your registered email!");
    }, 2000);
  });

  // Header scroll effect
  window.addEventListener("scroll", function () {
    const header = document.getElementById("header");
    if (window.scrollY > 80) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  });

  // Initialize
  console.log("[INIT] Initializing login page");
  setActiveRole("BENEFICIARY");

  // Spin animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .error-message {
      display: none !important;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      background-color: #fee2e2;
      color: #991b1b;
      border-left: 4px solid #dc2626;
      font-size: 14px;
      animation: slideIn 0.3s ease-in-out;
    }

    .error-message.show {
      display: block !important;
    }

    .success-message {
      display: none !important;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      background-color: #dcfce7;
      color: #166534;
      border-left: 4px solid #22c55e;
      font-size: 14px;
      animation: slideIn 0.3s ease-in-out;
    }

    .success-message.show {
      display: block !important;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-message i,
    .success-message i {
      margin-right: 8px;
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);

  console.log("[INIT] Login page initialized successfully");
})();