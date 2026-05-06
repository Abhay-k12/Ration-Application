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
      modalDescription: "Enter your username to receive an OTP.",
      modalLabel: "Username",
      resetButtonText: "Send OTP",
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
      modalDescription: "Enter your username to receive an OTP.",
      modalLabel: "Username",
      resetButtonText: "Send OTP",
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
      modalDescription: "Enter your username to receive an OTP.",
      modalLabel: "Username",
      resetButtonText: "Send OTP",
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
  let otpPhase = 0; // 0 = request, 1 = verify
  
  const modal = document.getElementById("forgotModal");
  const forgotLink = document.getElementById("forgotPasswordLink");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalLabel = document.getElementById("modalLabel");
  const resetBtnSpan = document.getElementById("resetBtnText");
  const resetBtnIcon = document.getElementById("resetBtnIcon");
  const resetField = document.getElementById("resetField");
  const resetSuccess = document.getElementById("resetSuccess");
  const resetSuccessText = document.getElementById("resetSuccessText") || resetSuccess.querySelector("span");
  const resetError = document.getElementById("resetError");
  const forgotForm = document.getElementById("forgotForm");
  const resetUsernameGroup = document.getElementById("resetUsernameGroup");
  const resetOtpGroup = document.getElementById("resetOtpGroup");
  const otpField = document.getElementById("otpField");

  function resetForgotModal() {
    otpPhase = 0;
    resetUsernameGroup.style.display = "block";
    resetOtpGroup.style.display = "none";
    resetField.disabled = false;
    resetField.value = "";
    if (otpField) otpField.value = "";
    resetSuccess.style.display = "none";
    if (resetError) resetError.style.display = "none";
    
    const cfg = roleConfig[currentRole];
    resetBtnSpan.textContent = cfg ? (cfg.resetButtonText || "Send OTP") : "Send OTP";
    if (resetBtnIcon) resetBtnIcon.className = "ri-mail-send-line";
    
    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.style.display = "flex";
  }

  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();

    const cfg = roleConfig[currentRole];
    modalTitle.textContent = cfg.modalTitle;
    modalDesc.textContent = cfg.modalDescription;
    modalLabel.textContent = cfg.modalLabel;

    resetField.placeholder = "Enter " + cfg.modalLabel;
    resetForgotModal();

    modal.classList.add("active");
  });

  closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    resetForgotModal();
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
      resetForgotModal();
    }
  });

  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (resetError) resetError.style.display = "none";
    resetSuccess.style.display = "none";
    
    const username = resetField.value.trim();
    if (!username) {
      if (resetError) {
        resetError.textContent = "Please enter your username";
        resetError.style.display = "block";
      } else {
        alert("Please enter your username");
      }
      return;
    }

    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;

    if (otpPhase === 0) {
      // Phase 0: Request OTP
      console.log("[FORGOT] Reset password requested for:", username);
      submitBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Sending OTP...';
      
      try {
        const res = await fetch("http://localhost:8081/auth/forgot-password/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          otpPhase = 1;
          resetField.disabled = true;
          resetUsernameGroup.style.display = "none";
          resetOtpGroup.style.display = "block";
          resetBtnSpan.textContent = "Verify OTP";
          if (resetBtnIcon) resetBtnIcon.className = "ri-shield-check-line";
          resetSuccessText.textContent = "OTP sent to registered email!";
          resetSuccess.style.display = "block";
        } else {
          if (resetError) {
            resetError.textContent = data.message || "Failed to send OTP.";
            resetError.style.display = "block";
          } else {
            alert(data.message || "Failed to send OTP.");
          }
        }
      } catch (err) {
        if (resetError) {
          resetError.textContent = "Error connecting to server.";
          resetError.style.display = "block";
        } else {
          alert("Error connecting to server.");
        }
      } finally {
        submitBtn.disabled = false;
        if (otpPhase === 0) submitBtn.innerHTML = originalBtnHtml; // restore if failed
      }
    } else if (otpPhase === 1) {
      // Phase 1: Verify OTP
      const otp = otpField.value.trim();
      if (!otp) {
        if (resetError) {
          resetError.textContent = "Please enter the OTP";
          resetError.style.display = "block";
        } else {
          alert("Please enter the OTP");
        }
        submitBtn.disabled = false;
        return;
      }
      
      console.log("[FORGOT] Verifying OTP for:", username);
      submitBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Verifying...';
      
      try {
        const res = await fetch("http://localhost:8081/auth/forgot-password/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username, otp: otp })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          resetSuccessText.textContent = "Your temporary password is set to User@123. Please check your email. Change it after first login.";
          resetSuccess.style.display = "block";
          resetOtpGroup.style.display = "none";
          submitBtn.style.display = "none"; // hide button on success
          
          setTimeout(() => {
            modal.classList.remove("active");
            resetForgotModal();
          }, 5000);
        } else {
          if (resetError) {
            resetError.textContent = data.message || "Invalid OTP.";
            resetError.style.display = "block";
          } else {
            alert(data.message || "Invalid OTP.");
          }
        }
      } catch (err) {
        if (resetError) {
          resetError.textContent = "Error verifying OTP.";
          resetError.style.display = "block";
        } else {
          alert("Error verifying OTP.");
        }
      } finally {
        submitBtn.disabled = false;
        if (otpPhase === 1 && submitBtn.style.display !== "none") {
          submitBtn.innerHTML = '<i class="ri-shield-check-line" id="resetBtnIcon"></i> <span id="resetBtnText">Verify OTP</span>';
        }
      }
    }
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