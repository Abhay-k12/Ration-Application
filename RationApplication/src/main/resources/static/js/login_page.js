    (function() {
      // ----- Role mapping : update UI dynamically -----
      const roleOptions = document.querySelectorAll('.role-option');
      const roleInfoDivs = {
        beneficiary: {
          features: document.getElementById('beneficiaryFeatures'),
          form: document.getElementById('beneficiaryForm'),
          welcome: 'Welcome, Beneficiary',
          desc: 'Access your ration dashboard, view quota & history.',
          formTitle: 'Beneficiary Login',
          btnText: 'Login as Beneficiary',
          modalTitle: 'Reset Beneficiary Password',
          modalDesc: 'Enter your Aadhaar / Ration card number to receive reset link.',
          modalLabel: 'Aadhaar / RC No.',
          resetBtn: 'Send Reset Link'
        },
        pds: {
          features: document.getElementById('pdsFeatures'),
          form: document.getElementById('pdsForm'),
          welcome: 'Welcome, PDS Officer',
          desc: 'Manage ration distribution, verify beneficiaries.',
          formTitle: 'PDS Officer Login',
          btnText: 'Login as Officer',
          modalTitle: 'Reset Officer Password',
          modalDesc: 'Enter your Employee ID to reset password.',
          modalLabel: 'Employee ID',
          resetBtn: 'Send Reset Link'
        },
        admin: {
          features: document.getElementById('adminFeatures'),
          form: document.getElementById('adminForm'),
          welcome: 'Welcome, Admin',
          desc: 'District monitoring, reports & master control.',
          formTitle: 'Admin Login',
          btnText: 'Login as Admin',
          modalTitle: 'Reset Admin Password',
          modalDesc: 'Enter your Admin ID to reset.',
          modalLabel: 'Admin ID',
          resetBtn: 'Send Reset Link'
        }
      };

      let currentRole = 'beneficiary';

      function setActiveRole(role) {
        // update pills
        roleOptions.forEach(opt => {
          const r = opt.dataset.role;
          if (r === role) opt.classList.add('active');
          else opt.classList.remove('active');
        });

        // hide all feature blocks & forms
        document.querySelectorAll('.login-info .role-info').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.login-form-container .role-info').forEach(el => el.classList.remove('active'));

        // show selected
        if (roleInfoDivs[role]) {
          roleInfoDivs[role].features.classList.add('active');
          roleInfoDivs[role].form.classList.add('active');
        }

        // update texts
        document.getElementById('roleWelcome').innerText = roleInfoDivs[role].welcome;
        document.getElementById('roleDescription').innerText = roleInfoDivs[role].desc;
        document.getElementById('formTitle').innerText = roleInfoDivs[role].formTitle;
        document.getElementById('loginBtnText').innerText = roleInfoDivs[role].btnText;

        // store for modal
        currentRole = role;
      }

      roleOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.preventDefault();
          const role = opt.dataset.role;   // beneficiary / pds / admin
          setActiveRole(role);
        });
      });

      // ----- password toggle helper (global) -----
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

      // ----- login simulation + error handling -----
      const loginForm = document.getElementById('loginForm');
      const errorDiv = document.getElementById('loginErrorMessage');

      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // dummy validation: any non-empty
        let empty = false;
        if (currentRole === 'beneficiary') {
          if (!document.getElementById('benId').value.trim() || !document.getElementById('benPass').value.trim()) empty = true;
        } else if (currentRole === 'pds') {
          if (!document.getElementById('pdsId').value.trim() || !document.getElementById('pdsPass').value.trim()) empty = true;
        } else {
          if (!document.getElementById('adminId').value.trim() || !document.getElementById('adminPass').value.trim()) empty = true;
        }

        if (empty) {
          errorDiv.style.display = 'block';
          errorDiv.innerText = ' Please fill in all fields.';
          return;
        }

        errorDiv.style.display = 'none';
        alert(`${roleInfoDivs[currentRole].btnText} successful! (demo – no redirect)`);
        // redirect simulation: location.href = 'dashboard_'+currentRole+'.html';
      });

      // ----- modal logic with dynamic role content -----
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
        // set texts based on currentRole
        const roleData = roleInfoDivs[currentRole];
        modalTitle.innerText = roleData.modalTitle;
        modalDesc.innerText = roleData.modalDesc;
        modalLabel.innerText = roleData.modalLabel;
        resetBtnSpan.innerText = roleData.resetBtn;
        resetField.placeholder = `Enter ${currentRole === 'beneficiary' ? 'Aadhaar' : 'ID'}`;
        resetSuccess.classList.remove('show');
        modal.classList.add('active');
      });

      closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
      });

      window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });

      forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!resetField.value.trim()) {
          alert('Please fill the field.');
          return;
        }
        resetSuccess.classList.add('show');
        setTimeout(() => {
          modal.classList.remove('active');
          resetSuccess.classList.remove('show');
          resetField.value = '';
        }, 1800);
      });

      // ----- header scroll effect (copied) + back to top dummy -----
      window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (window.scrollY > 80) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      });

      // mobile menu placeholder
      document.querySelector('.mobile-menu')?.addEventListener('click', ()=>{
        alert('Mobile navigation would open – implement as needed.');
      });

      // initial active set
      setActiveRole('beneficiary');
    })();