    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const modules = document.querySelectorAll('.module');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            modules.forEach(m => m.classList.remove('active'));

            item.classList.add('active');
            const moduleId = item.dataset.module;
            document.getElementById(moduleId).classList.add('active');
        });
    });

    // Photo upload simulation
    function triggerPhotoUpload(element) {
        const fileInput = element.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.click();
            fileInput.onchange = function() {
                element.innerHTML = '<i class="ri-checkbox-circle-line" style="color: var(--secondary);"></i><p>Photo captured!</p>';
            };
        }
    }

    // Add new family member
    function addNewMember() {
        alert('Add new member form would appear here (demo)');
    }

    // Module 4 functions
    function showOnlineVerification() {
        document.getElementById('onlineSection').style.display = 'block';
        document.getElementById('offlineSection').style.display = 'none';
    }

    function showOfflineOTP() {
        document.getElementById('onlineSection').style.display = 'none';
        document.getElementById('offlineSection').style.display = 'block';
    }

    function simulateQRScan() {
        document.getElementById('verificationResult').style.display = 'block';
    }

    function selectFace(name) {
        document.getElementById('allocationSummary').style.display = 'block';
        alert(`Face verification initiated for ${name} (demo)`);
    }

    function completeAllocation() {
        alert('Ration allocation completed successfully!');
        document.getElementById('verificationResult').style.display = 'none';
        document.getElementById('onlineSection').style.display = 'none';
    }

    function sendOTP() {
        const rcNumber = document.getElementById('otpRcNumber').value;
        if (rcNumber) {
            document.getElementById('otpSection').style.display = 'block';
            alert('OTP sent to registered email: ra***@gmail.com');
        } else {
            alert('Please enter RC number');
        }
    }

    function verifyOTP() {
        document.getElementById('offlineAllocation').style.display = 'block';
        alert('OTP verified successfully!');
    }

    // Modal functions
    function openComplaintModal(id) {
        document.getElementById('complaintModal').classList.add('active');
    }

    function openChangePwdModal() {
        document.getElementById('changePwdModal').classList.add('active');
    }

    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Form submissions
    document.getElementById('registrationForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Digital ration card registration submitted for approval!');
    });

    document.getElementById('distributorComplaintForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Complaint registered as distributor!');
    });

    document.getElementById('beneficiaryComplaintForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Complaint registered on behalf of beneficiary!');
    });

    document.getElementById('changePwdForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Password updated successfully!');
        closeModal('changePwdModal');
    });

    // Mobile menu
    document.querySelector('.mobile-menu')?.addEventListener('click', () => {
        alert('Mobile navigation would open');
    });

    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });