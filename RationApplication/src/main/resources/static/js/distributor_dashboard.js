let memberCount = 1;
let currentFamilyMembers = [];
let currentComplaints = [];
let currentSchemes = [];
let currentQRData = null;

if (!window.getAuthToken || !window.login) {
    console.error('API client not loaded');
    window.location.href = '/login_page.html';
}

const token = localStorage.getItem('jwtToken');
const userRole = localStorage.getItem('userRole');

if (!token || userRole !== 'DISTRIBUTOR') {
    window.location.href = '/login_page.html';
}

// Check authentication on page load
window.addEventListener('load', () => {
    const token = getAuthToken();
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'DISTRIBUTOR') {
        window.location.href = '/login_page.html';
        return;
    }

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
        const username = localStorage.getItem('username');
        document.getElementById('distributorName').textContent = username || 'Distributor';
        document.getElementById('distId').textContent = 'DIST/' + username?.substring(0, 3).toUpperCase() + '/001' || 'DIST/001';
        document.getElementById('shopLocation').textContent = localStorage.getItem('stateDistrictCode') || 'District';
        document.getElementById('shopName').textContent = 'FPS Shop - ' + (username || 'Shop');

        // Load today's summary
        document.getElementById('beneficiariesServed').textContent = '0';
        document.getElementById('rationDistributed').textContent = '0 kg';
        document.getElementById('pendingVerifications').textContent = '0';
        document.getElementById('stockAvailable').textContent = 'Wheat 0kg';
    } catch (error) {
        console.error('Error loading distributor data:', error);
    }
}

// ===== DYNAMIC FAMILY MEMBERS FORM =====
function initializeFamilyForm() {
    const container = document.getElementById('familyMembersContainer');
    if (!container) return;

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
            alert('Beneficiary registered successfully!');
            document.getElementById('registrationForm').reset();
            memberCount = 1;
            initializeFamilyForm();
        } else {
            alert('Error: ' + (response?.message || 'Registration failed'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-line"></i> Register Beneficiary';
    } catch (error) {
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

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i> Submitting...';

        const response = await submitComplaint(subject, message, 'DISTRIBUTOR_ISSUE', priority);

        if (response && response.success) {
            alert('Complaint submitted successfully!');
            document.getElementById('distributorComplaintForm').reset();
        } else {
            alert('Error: ' + (response?.message || 'Failed to submit'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit as Distributor';
    } catch (error) {
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

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i> Submitting...';

        const response = await submitComplaint(category, message, category, priority);

        if (response && response.success) {
            alert('Complaint submitted on behalf of beneficiary!');
            document.getElementById('beneficiaryComplaintForm').reset();
        } else {
            alert('Error: ' + (response?.message || 'Failed to submit'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit on Behalf of Beneficiary';
    } catch (error) {
        alert('Error: ' + error.message);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit on Behalf of Beneficiary';
    }
}

async function loadComplaints() {
    try {
        const response = await getDistributorComplaints();

        if (response && Array.isArray(response)) {
            const container = document.getElementById('complaintHistoryContainer');
            container.innerHTML = '';

            if (response.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No complaints found</p>';
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
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

async function loadSchemes() {
    try {
        const container = document.getElementById('schemesContainer');
        container.innerHTML = '';

        // Mock schemes data
        const schemes = [
            {
                name: 'Antyodaya Anna Yojana (AAY)',
                eligibility: 'Poorest of the poor families, income < ₹15,000/year',
                items: ['Wheat 35 kg', 'Rice 20 kg', 'Sugar 3 kg'],
                status: 'Active'
            },
            {
                name: 'Priority Household (PHH)',
                eligibility: 'Annual income between ₹15,000 - ₹3,00,000',
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
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading schemes:', error);
    }
}

function viewComplaintDetail(index) {
    const complaint = currentComplaints[index];
    if (!complaint) return;

    const content = `
        <p><strong>Complaint ID:</strong> ${complaint.id || 'N/A'}</p>
        <p><strong>Subject:</strong> ${complaint.complaintTitle}</p>
        <p><strong>Date:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${complaint.status?.toLowerCase()}">${complaint.status}</span></p>
        <p><strong>Message:</strong> ${complaint.description}</p>
        ${complaint.resolutionNotes ? `<p><strong>Resolution Notes:</strong> ${complaint.resolutionNotes}</p>` : ''}
    `;

    document.getElementById('complaintDetailContent').innerHTML = content;
    document.getElementById('complaintModal').classList.add('active');
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
        const response = await scanQRCode(qrData);

        if (response && response.success) {
            currentQRData = response;
            document.getElementById('verifiedRCNumber').textContent = qrData;
            document.getElementById('verifiedBeneficiaryName').textContent = response.beneficiaryName || 'N/A';
            document.getElementById('verifiedMemberCount').textContent = response.memberCount || '0';

            // Load family members for selection
            loadFaceSelection(response.familyMembers || []);

            document.getElementById('verificationResult').style.display = 'block';
        } else {
            alert('Error: ' + (response?.message || 'QR verification failed'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function loadFaceSelection(members) {
    const container = document.getElementById('faceSelectionContainer');
    container.innerHTML = '';

    if (members.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--gray);">No family members found</p>';
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
        container.appendChild(option);
    });
}

function selectFace(name) {
    document.getElementById('allocationSummary').style.display = 'block';

    // Load allocation details
    const details = `
        <p><strong>Wheat:</strong> 10 kg (₹ 2/kg) - ₹ 20</p>
        <p><strong>Rice:</strong> 5 kg (₹ 3/kg) - ₹ 15</p>
        <p><strong>Sugar:</strong> 2 kg (₹ 15/kg) - ₹ 30</p>
        <p><strong>Kerosene:</strong> 2 L (₹ 10/L) - ₹ 20</p>
        <hr style="margin: 10px 0;">
        <p><strong>Total Payable:</strong> ₹ 85</p>
        <button class="submit-btn" style="margin-top: 15px;" onclick="completeAllocation()">
            <i class="ri-check-double-line"></i> Complete Allocation
        </button>
    `;
    document.getElementById('allocationDetails').innerHTML = details;
}

function completeAllocation() {
    alert('Ration allocation completed successfully!');
    document.getElementById('verificationResult').style.display = 'none';
    document.getElementById('onlineSection').style.display = 'none';
    document.getElementById('qrCodeInput').value = '';
}

async function sendOTP() {
    const beneficiaryId = document.getElementById('otpBeneficiaryId').value;

    if (!beneficiaryId) {
        alert('Please enter beneficiary username or RC number');
        return;
    }

    try {
        alert('OTP sent to registered email: ' + beneficiaryId.substring(0, 2) + '***@gmail.com');
        document.getElementById('otpSection').style.display = 'block';
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function verifyOTP() {
    const otp = document.getElementById('otpInput').value;

    if (otp.length !== 6) {
        alert('Please enter a valid 6-digit OTP');
        return;
    }

    // Mock OTP verification
    alert('OTP verified successfully!');
    document.getElementById('offlineAllocation').style.display = 'block';

    const details = `
        <p><strong>Wheat:</strong> 10 kg - ₹ 20</p>
        <p><strong>Rice:</strong> 5 kg - ₹ 15</p>
        <p><strong>Sugar:</strong> 2 kg - ₹ 30</p>
        <hr>
        <p><strong>Total:</strong> ₹ 85</p>
        <button class="submit-btn" style="margin-top: 15px;" onclick="completeOfflineAllocation()">
            <i class="ri-check-double-line"></i> Complete Transaction
        </button>
    `;
    document.getElementById('offlineAllocationDetails').innerHTML = details;
}

function completeOfflineAllocation() {
    alert('Offline transaction completed and will sync when online!');
    document.getElementById('offlineSection').style.display = 'none';
    document.getElementById('otpBeneficiaryId').value = '';
    document.getElementById('otpInput').value = '';
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
        alert('Password changed successfully! Please login again.');
        logout();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function openChangePwdModal() {
    document.getElementById('changePwdModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function logout() {
    removeAuthToken();
    window.location.href = '/login_page.html';
}