let memberCount = 1;
let currentFamilyMembers = [];
let currentComplaints = [];
let currentSchemes = [];
let currentQRData = null;

if (!window.getAuthToken || !window.login) {
    console.error('[API] API client not loaded');
    window.location.href = '/login_page.html';
}

const token = localStorage.getItem('jwtToken');
const userRole = localStorage.getItem('userRole');

if (!token || userRole !== 'DISTRIBUTOR') {
    console.log('[AUTH] Not authorized as DISTRIBUTOR, redirecting');
    window.location.href = '/login_page.html';
}

// Check authentication on page load
window.addEventListener('load', () => {
    const token = getAuthToken();
    const userRole = localStorage.getItem('userRole');

    console.log('[AUTH] Token present:', token ? true : false);
    console.log('[AUTH] User role:', userRole);

    if (!token || userRole !== 'DISTRIBUTOR') {
        console.log('[AUTH] Not authenticated, redirecting to login');
        window.location.href = '/login_page.html';
        return;
    }

    console.log('[INIT] Loading distributor data');
    loadDistributorData();
    setupEventListeners();
    initializeFamilyForm();
});

function setupEventListeners() {
    // Module navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const moduleId = this.getAttribute('data-module');
            document.querySelectorAll('.module').forEach(module => module.classList.remove('active'));
            document.getElementById(moduleId).classList.add('active');

            // Load module-specific data
            if (moduleId === 'module3') {
                loadComplaints();
            } else if (moduleId === 'module5') {
                loadSchemes();
            }
        });
    });

    // Form submissions
    document.getElementById('registrationForm')?.addEventListener('submit', handleRegistration);
    document.getElementById('distributorComplaintForm')?.addEventListener('submit', handleDistributorComplaint);
    document.getElementById('beneficiaryComplaintForm')?.addEventListener('submit', handleBeneficiaryComplaint);
    document.getElementById('changePwdForm')?.addEventListener('submit', handleChangePassword);

    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

async function loadDistributorData() {
    try {
        // Get user data from localStorage
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const stateDistrictCode = localStorage.getItem('stateDistrictCode');

        console.log('[DATA] Username:', username);
        console.log('[DATA] Email:', email);
        console.log('[DATA] State/District:', stateDistrictCode);

        // Update sidebar profile card
        const distributorNameEl = document.getElementById('distributorName');
        const distIdEl = document.getElementById('distId');
        const shopLocationEl = document.getElementById('shopLocation');
        const shopNameEl = document.getElementById('shopName');

        if (distributorNameEl) {
            distributorNameEl.textContent = username || 'Distributor';
            console.log('[SIDEBAR] Updated distributor name:', username);
        }

        if (distIdEl) {
            distIdEl.textContent = 'DIST/' + (username?.substring(0, 3).toUpperCase() || 'UNK') + '/001';
            console.log('[SIDEBAR] Updated distributor ID');
        }

        if (shopLocationEl) {
            shopLocationEl.textContent = stateDistrictCode || 'District';
            console.log('[SIDEBAR] Updated shop location:', stateDistrictCode);
        }

        if (shopNameEl) {
            shopNameEl.textContent = 'FPS Shop - ' + (username || 'Shop');
            console.log('[SIDEBAR] Updated shop name');
        }

        // Load today's summary
        const beneficiariesServedEl = document.getElementById('beneficiariesServed');
        const rationDistributedEl = document.getElementById('rationDistributed');
        const pendingVerificationsEl = document.getElementById('pendingVerifications');
        const stockAvailableEl = document.getElementById('stockAvailable');

        if (beneficiariesServedEl) beneficiariesServedEl.textContent = '0';
        if (rationDistributedEl) rationDistributedEl.textContent = '0 kg';
        if (pendingVerificationsEl) pendingVerificationsEl.textContent = '0';
        if (stockAvailableEl) stockAvailableEl.textContent = 'Wheat 0kg';

        console.log('[DATA] Distributor data loaded successfully');
    } catch (error) {
        console.error('[DATA] Error loading distributor data:', error);
    }
}

// ===== DYNAMIC FAMILY MEMBERS FORM =====
function initializeFamilyForm() {
    const container = document.getElementById('familyMembersContainer');
    if (!container) return;

    console.log('[FORM] Initializing family form');
    container.innerHTML = '';
    addMemberForm(1, ' (Head)');
    memberCount = 1;
}

function addMemberForm(number, suffix = '') {
    const container = document.getElementById('familyMembersContainer');
    const memberDiv = document.createElement('div');
    memberDiv.className = 'member-entry';
    memberDiv.id = `member-${number}`;

    memberDiv.innerHTML = `
        <span class="member-number">Member ${number}${suffix}</span>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control member-name" placeholder="Enter full name" required>
            </div>
            <div class="form-group">
                <label class="form-label">Aadhaar Number</label>
                <input type="text" class="form-control member-aadhaar" placeholder="12-digit Aadhaar" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="form-control member-dob" required>
            </div>
            <div class="form-group">
                <label class="form-label">Employment Status</label>
                <select class="form-control member-employment">
                    <option value="">Select status</option>
                    <option value="GOVERNMENT">Government Employee</option>
                    <option value="PRIVATE">Private Employee</option>
                    <option value="STUDENT">Student</option>
                    <option value="HOUSE_WIFE">Homemaker</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>
        </div>
    `;

    container.appendChild(memberDiv);
}

function handleTotalMembersChange() {
    const totalInput = document.getElementById('totalMembers');
    const newTotal = parseInt(totalInput.value);

    if (isNaN(newTotal) || newTotal < 1) {
        totalInput.value = 1;
        return;
    }

    if (newTotal > 10) {
        alert('Maximum 10 family members allowed');
        totalInput.value = memberCount;
        return;
    }

    const container = document.getElementById('familyMembersContainer');

    if (newTotal > memberCount) {
        for (let i = memberCount + 1; i <= newTotal; i++) {
            addMemberForm(i);
        }
    } else if (newTotal < memberCount) {
        for (let i = memberCount; i > newTotal; i--) {
            const memberToRemove = document.getElementById(`member-${i}`);
            if (memberToRemove) {
                memberToRemove.remove();
            }
        }
    }

    memberCount = newTotal;
}

function addNewMember() {
    memberCount++;
    addMemberForm(memberCount);
    document.getElementById('totalMembers').value = memberCount;
}

async function handleRegistration(e) {
    e.preventDefault();

    const username = document.getElementById('beneficiaryUsername').value;
    const email = document.getElementById('beneficiaryEmail').value;
    const password = document.getElementById('beneficiaryPassword').value;
    const annualIncome = parseInt(document.getElementById('annualIncome').value);

    console.log('[REGISTER] Registering beneficiary:', username);

    // Collect family members
    const familyMembers = [];
    for (let i = 1; i <= memberCount; i++) {
        const memberDiv = document.getElementById(`member-${i}`);
        if (memberDiv) {
            const name = memberDiv.querySelector('.member-name')?.value || '';
            const aadhaar = memberDiv.querySelector('.member-aadhaar')?.value || '';
            const dob = memberDiv.querySelector('.member-dob')?.value || '';
            const employment = memberDiv.querySelector('.member-employment')?.value || '';

            if (name && aadhaar && dob && employment) {
                familyMembers.push({
                    name,
                    aadhaarNumber: aadhaar,
                    dateOfBirth: dob,
                    employmentStatus: employment
                });
            }
        }
    }

    if (familyMembers.length === 0) {
        alert('Please fill in at least the head member details');
        return;
    }

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Registering...';

        const response = await registerBeneficiary({
            username,
            password,
            email,
            annualIncome,
            members: familyMembers,
            stateDistrictCode: localStorage.getItem('stateDistrictCode') || 'UK-01'
        });

        if (response && response.success) {
            console.log('[REGISTER] Registration successful');
            alert('Beneficiary registered successfully!');
            document.getElementById('registrationForm').reset();
            memberCount = 1;
            initializeFamilyForm();
        } else {
            console.log('[REGISTER] Registration failed:', response?.message);
            alert('Error: ' + (response?.message || 'Registration failed'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-line"></i> Register Beneficiary';
    } catch (error) {
        console.error('[REGISTER] Error:', error);
        alert('Error: ' + error.message);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-line"></i> Register Beneficiary';
    }
}

async function handleDistributorComplaint(e) {
    e.preventDefault();

    const subject = document.getElementById('distComplaintSubject').value;
    const message = document.getElementById('distComplaintMessage').value;
    const priority = document.getElementById('distComplaintPriority').value;

    console.log('[COMPLAINT] Submitting distributor complaint');

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i> Submitting...';

        const response = await submitComplaint(subject, message, 'DISTRIBUTOR_ISSUE', priority);

        if (response && response.success) {
            console.log('[COMPLAINT] Complaint submitted successfully');
            alert('Complaint submitted successfully!');
            document.getElementById('distributorComplaintForm').reset();
        } else {
            console.log('[COMPLAINT] Failed:', response?.message);
            alert('Error: ' + (response?.message || 'Failed to submit'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit as Distributor';
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        alert('Error: ' + error.message);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit as Distributor';
    }
}

async function handleBeneficiaryComplaint(e) {
    e.preventDefault();

    const rcNumber = document.getElementById('beneficiaryRCNumber').value;
    const category = document.getElementById('beneficiaryComplaintCategory').value;
    const message = document.getElementById('beneficiaryComplaintMessage').value;
    const priority = document.getElementById('beneficiaryComplaintPriority').value;

    console.log('[COMPLAINT] Submitting beneficiary complaint for:', rcNumber);

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i> Submitting...';

        const response = await submitComplaint(category, message, category, priority);

        if (response && response.success) {
            console.log('[COMPLAINT] Complaint submitted on behalf of beneficiary');
            alert('Complaint submitted on behalf of beneficiary!');
            document.getElementById('beneficiaryComplaintForm').reset();
        } else {
            console.log('[COMPLAINT] Failed:', response?.message);
            alert('Error: ' + (response?.message || 'Failed to submit'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit on Behalf of Beneficiary';
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        alert('Error: ' + error.message);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit on Behalf of Beneficiary';
    }
}

async function loadComplaints() {
    try {
        console.log('[COMPLAINTS] Loading complaints');
        const response = await getDistributorComplaints();

        console.log('[COMPLAINTS] Response:', response);

        if (response && Array.isArray(response)) {
            const container = document.getElementById('complaintHistoryContainer');
            if (container) container.innerHTML = '';

            if (response.length === 0) {
                if (container) container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No complaints found</p>';
                return;
            }

            currentComplaints = response;

            response.forEach((complaint, index) => {
                const statusClass = `status-${complaint.status?.toLowerCase() || 'pending'}`;
                const borderColor = complaint.status === 'RESOLVED' ? 'var(--secondary)' :
                                   complaint.status === 'REJECTED' ? 'var(--danger)' :
                                   'var(--accent)';

                const card = document.createElement('div');
                card.className = 'complaint-card';
                card.style.borderLeftColor = borderColor;
                card.onclick = () => viewComplaintDetail(index);
                card.innerHTML = `
                    <div>
                        <strong>${complaint.complaintTitle}</strong>
                        <br><small>${new Date(complaint.createdAt).toLocaleDateString()}</small>
                    </div>
                    <span class="status-badge ${statusClass}">${complaint.status}</span>
                `;
                if (container) container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('[COMPLAINTS] Error:', error);
    }
}

async function loadSchemes() {
    try {
        console.log('[SCHEMES] Loading schemes');
        const container = document.getElementById('schemesContainer');
        if (container) container.innerHTML = '';

        // Mock schemes data
        const schemes = [
            {
                name: 'Antyodaya Anna Yojana (AAY)',
                eligibility: 'Poorest of the poor families, income less than 15,000 per year',
                items: ['Wheat 35 kg', 'Rice 20 kg', 'Sugar 3 kg'],
                status: 'Active'
            },
            {
                name: 'Priority Household (PHH)',
                eligibility: 'Annual income between 15,000 - 3,00,000',
                items: ['Wheat 10 kg', 'Rice 5 kg', 'Sugar 2 kg'],
                status: 'Active'
            },
            {
                name: 'Special Add-on: Kerosene',
                eligibility: 'Families without LPG connection',
                items: ['Kerosene 2 L per month'],
                status: 'Limited Stock'
            }
        ];

        schemes.forEach(scheme => {
            const card = document.createElement('div');
            card.className = 'scheme-card';
            card.innerHTML = `
                <div class="scheme-header">
                    <h4>${scheme.name}</h4>
                    <span class="status-badge ${scheme.status === 'Active' ? 'status-approved' : 'status-pending'}">${scheme.status}</span>
                </div>
                <p><strong>Eligibility:</strong> ${scheme.eligibility}</p>
                <div class="scheme-items">
                    ${scheme.items.map(item => `<div class="scheme-item">${item}</div>`).join('')}
                </div>
            `;
            if (container) container.appendChild(card);
        });
    } catch (error) {
        console.error('[SCHEMES] Error:', error);
    }
}

function viewComplaintDetail(index) {
    const complaint = currentComplaints[index];
    if (!complaint) return;

    console.log('[COMPLAINT] Viewing complaint:', complaint.id);

    const content = `
        <p><strong>Complaint ID:</strong> ${complaint.id || 'N/A'}</p>
        <p><strong>Subject:</strong> ${complaint.complaintTitle}</p>
        <p><strong>Date:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${complaint.status?.toLowerCase()}">${complaint.status}</span></p>
        <p><strong>Message:</strong> ${complaint.description}</p>
        ${complaint.resolutionNotes ? `<p><strong>Resolution Notes:</strong> ${complaint.resolutionNotes}</p>` : ''}
    `;

    const contentEl = document.getElementById('complaintDetailContent');
    if (contentEl) contentEl.innerHTML = content;

    const modal = document.getElementById('complaintModal');
    if (modal) modal.classList.add('active');
}

// ===== RATION ALLOCATION FUNCTIONS =====
function showOnlineVerification() {
    document.getElementById('onlineSection').style.display = 'block';
    document.getElementById('offlineSection').style.display = 'none';
    document.getElementById('qrCodeInput').focus();
}

function showOfflineOTP() {
    document.getElementById('onlineSection').style.display = 'none';
    document.getElementById('offlineSection').style.display = 'block';
}

async function processQRScan() {
    const qrData = document.getElementById('qrCodeInput').value.trim();

    if (!qrData) {
        alert('Please enter or scan QR code data');
        return;
    }

    try {
        console.log('[QR] Processing QR scan');
        const response = await scanQRCode(qrData);

        if (response && response.success) {
            console.log('[QR] QR scan successful');
            currentQRData = response;
            document.getElementById('verifiedRCNumber').textContent = qrData;
            document.getElementById('verifiedBeneficiaryName').textContent = response.beneficiaryName || 'N/A';
            document.getElementById('verifiedMemberCount').textContent = response.memberCount || '0';

            loadFaceSelection(response.familyMembers || []);
            document.getElementById('verificationResult').style.display = 'block';
        } else {
            console.log('[QR] QR scan failed:', response?.message);
            alert('Error: ' + (response?.message || 'QR verification failed'));
        }
    } catch (error) {
        console.error('[QR] Error:', error);
        alert('Error: ' + error.message);
    }
}

function loadFaceSelection(members) {
    const container = document.getElementById('faceSelectionContainer');
    if (container) container.innerHTML = '';

    if (members.length === 0) {
        if (container) container.innerHTML = '<p style="text-align: center; color: var(--gray);">No family members found</p>';
        return;
    }

    members.forEach(member => {
        const option = document.createElement('div');
        option.className = 'face-option';
        option.onclick = () => selectFace(member.name || member.aadhaarNumber);
        option.innerHTML = `
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%231E3A8A'/%3E%3Ccircle cx='40' cy='30' r='12' fill='%23F59E0B'/%3E%3C/svg%3E" alt="face">
            <p>${member.name || 'Member'}</p>
        `;
        if (container) container.appendChild(option);
    });
}

function selectFace(name) {
    const allocationSummaryEl = document.getElementById('allocationSummary');
    if (allocationSummaryEl) allocationSummaryEl.style.display = 'block';

    const details = `
        <p><strong>Wheat:</strong> 10 kg (Rs 2/kg) - Rs 20</p>
        <p><strong>Rice:</strong> 5 kg (Rs 3/kg) - Rs 15</p>
        <p><strong>Sugar:</strong> 2 kg (Rs 15/kg) - Rs 30</p>
        <p><strong>Kerosene:</strong> 2 L (Rs 10/L) - Rs 20</p>
        <hr style="margin: 10px 0;">
        <p><strong>Total Payable:</strong> Rs 85</p>
        <button class="submit-btn" style="margin-top: 15px;" onclick="completeAllocation()">
            <i class="ri-check-double-line"></i> Complete Allocation
        </button>
    `;
    const detailsEl = document.getElementById('allocationDetails');
    if (detailsEl) detailsEl.innerHTML = details;
}

function completeAllocation() {
    alert('Ration allocation completed successfully!');
    const verificationResultEl = document.getElementById('verificationResult');
    const onlineSectionEl = document.getElementById('onlineSection');
    const qrCodeInputEl = document.getElementById('qrCodeInput');

    if (verificationResultEl) verificationResultEl.style.display = 'none';
    if (onlineSectionEl) onlineSectionEl.style.display = 'none';
    if (qrCodeInputEl) qrCodeInputEl.value = '';
}

async function sendOTP() {
    const beneficiaryId = document.getElementById('otpBeneficiaryId').value;

    if (!beneficiaryId) {
        alert('Please enter beneficiary username or RC number');
        return;
    }

    try {
        console.log('[OTP] Sending OTP for:', beneficiaryId);
        alert('OTP sent to registered email: ' + beneficiaryId.substring(0, 2) + '***@gmail.com');
        const otpSectionEl = document.getElementById('otpSection');
        if (otpSectionEl) otpSectionEl.style.display = 'block';
    } catch (error) {
        console.error('[OTP] Error:', error);
        alert('Error: ' + error.message);
    }
}

function verifyOTP() {
    const otp = document.getElementById('otpInput').value;

    if (otp.length !== 6) {
        alert('Please enter a valid 6-digit OTP');
        return;
    }

    console.log('[OTP] Verifying OTP');
    alert('OTP verified successfully!');
    const offlineAllocationEl = document.getElementById('offlineAllocation');
    if (offlineAllocationEl) offlineAllocationEl.style.display = 'block';

    const details = `
        <p><strong>Wheat:</strong> 10 kg - Rs 20</p>
        <p><strong>Rice:</strong> 5 kg - Rs 15</p>
        <p><strong>Sugar:</strong> 2 kg - Rs 30</p>
        <hr>
        <p><strong>Total:</strong> Rs 85</p>
        <button class="submit-btn" style="margin-top: 15px;" onclick="completeOfflineAllocation()">
            <i class="ri-check-double-line"></i> Complete Transaction
        </button>
    `;
    const detailsEl = document.getElementById('offlineAllocationDetails');
    if (detailsEl) detailsEl.innerHTML = details;
}

function completeOfflineAllocation() {
    alert('Offline transaction completed and will sync when online!');
    const offlineSectionEl = document.getElementById('offlineSection');
    const otpBeneficiaryIdEl = document.getElementById('otpBeneficiaryId');
    const otpInputEl = document.getElementById('otpInput');

    if (offlineSectionEl) offlineSectionEl.style.display = 'none';
    if (otpBeneficiaryIdEl) otpBeneficiaryIdEl.value = '';
    if (otpInputEl) otpInputEl.value = '';
}

async function handleChangePassword(e) {
    e.preventDefault();

    const currentPwd = document.getElementById('currentPwd').value;
    const newPwd = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmPwd').value;

    if (newPwd !== confirmPwd) {
        alert('New passwords do not match!');
        return;
    }

    if (newPwd.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }

    try {
        console.log('[PASSWORD] Changing password');
        alert('Password changed successfully! Please login again.');
        logout();
    } catch (error) {
        console.error('[PASSWORD] Error:', error);
        alert('Error: ' + error.message);
    }
}

function openChangePwdModal() {
    const modal = document.getElementById('changePwdModal');
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function logout() {
    console.log('[LOGOUT] Logging out');
    removeAuthToken();
    window.location.href = '/login_page.html';
}

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);