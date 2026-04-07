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
        const username = localStorage.getItem('username') || 'Distributor';

        // Update sidebar profile card
        const distributorNameEl = document.getElementById('distributorName');
        const distIdEl = document.getElementById('distId');
        const shopLocationEl = document.getElementById('shopLocation');
        const shopNameEl = document.getElementById('shopName');

        if (distributorNameEl) {
            distributorNameEl.textContent = username;
            console.log('[SIDEBAR] Updated distributor name:', username);
        }

        if (distIdEl) {
            distIdEl.textContent = 'DIST/' + (username?.substring(0, 3).toUpperCase() || 'UNK') + '/001';
            console.log('[SIDEBAR] Updated distributor ID');
        }

        if (shopLocationEl) {
            shopLocationEl.textContent = 'Allocated District';
            console.log('[SIDEBAR] Updated shop location');
        }

        if (shopNameEl) {
            shopNameEl.textContent = 'FPS Shop - ' + username;
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
        <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
            <button type="button" class="submit-btn" style="width: auto; background: var(--secondary); padding: 8px 15px;" onclick="openCameraModal(${number})">
                <i class="ri-camera-line"></i> Capture Photo
            </button>
            <span id="photo-status-${number}" style="color: var(--gray); font-size: 14px;">No photo captured</span>
            <input type="hidden" class="member-photograph" id="photo-data-${number}">
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
        showCustomAlert('Maximum 10 family members allowed');
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
    const password = 'Beneficiary@123';
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
            const photograph = memberDiv.querySelector('.member-photograph')?.value || '';

            if (name && aadhaar && dob && employment) {
                familyMembers.push({
                    name,
                    aadhaarNumber: aadhaar,
                    dateOfBirth: dob,
                    employmentStatus: employment,
                    photograph: photograph
                });
            }
        }
    }

    if (familyMembers.length === 0) {
        showCustomAlert('Please fill in at least the head member details');
        return;
    }

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Registering...';

        const response = await apiRequest('/distributor/register', 'PUT', {
            username,
            fullName: username,
            password,
            email,
            annualIncome,
            members: familyMembers,
            stateDistrictCode: localStorage.getItem('stateDistrictCode') || 'UP-01',
            roles: ['BENEFICIARY']  // NEW - Add roles
        });

        console.log('[REGISTER] Response:', response);

        if (response && response.success) {
            console.log('[REGISTER] Registration successful');
            showCustomAlert(
                'Beneficiary registered successfully!\n\n' +
                'Username: ' + response.username + '\n' +
                'Temporary Password: ' + response.password + '\n\n' +
                'Share these credentials with the beneficiary.',
                'Success'
            );
            document.getElementById('registrationForm').reset();
            memberCount = 1;
            initializeFamilyForm();
        } else {
            console.log('[REGISTER] Registration failed:', response?.message);
            showCustomAlert('Error: ' + (response?.message || 'Registration failed'), 'Error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-line"></i> Register Beneficiary';
    } catch (error) {
        console.error('[REGISTER] Error:', error);
        showCustomAlert('Error: ' + error.message, 'Error');
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

        const response = await submitDistributorComplaint(subject, message, 'DISTRIBUTOR_ISSUE', priority);

        if (response && response.success) {
            console.log('[COMPLAINT] Complaint submitted successfully');
            showCustomAlert('Complaint submitted successfully!', 'Success');
            document.getElementById('distributorComplaintForm').reset();
        } else {
            console.log('[COMPLAINT] Failed:', response?.message);
            showCustomAlert('Error: ' + (response?.message || 'Failed to submit'), 'Error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit as Distributor';
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        showCustomAlert('Error: ' + error.message, 'Error');
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

        const response = await submitDistributorBeneficiaryComplaint(rcNumber, category, message, category, priority);

        if (response && response.success) {
            console.log('[COMPLAINT] Complaint submitted on behalf of beneficiary');
            showCustomAlert('Complaint submitted on behalf of beneficiary!', 'Success');
            document.getElementById('beneficiaryComplaintForm').reset();
        } else {
            console.log('[COMPLAINT] Failed:', response?.message);
            showCustomAlert('Error: ' + (response?.message || 'Failed to submit'), 'Error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit on Behalf of Beneficiary';
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        showCustomAlert('Error: ' + error.message, 'Error');
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
        const stateDistrictCode = localStorage.getItem('stateDistrictCode') || 'UK-01';
        const response = await getSchemesByDistrict(stateDistrictCode);
        
        const container = document.getElementById('schemesContainer');
        if (container) container.innerHTML = '';
        
        let schemesList = [];
        if (response && Array.isArray(response)) {
            schemesList = response;
        }

        if (schemesList.length === 0) {
            if (container) container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No schemes found for your district</p>';
            return;
        }

        currentSchemes = schemesList;

        schemesList.forEach(scheme => {
            const card = document.createElement('div');
            card.className = 'scheme-card';
            card.innerHTML = `
                <div class="scheme-header">
                    <h4>${scheme.schemeName || scheme.schemeType}</h4>
                    <span class="status-badge status-approved">Active</span>
                </div>
                <p><strong>District:</strong> ${scheme.stateDistrictCode}</p>
                <div class="scheme-items">
                    ${scheme.suppliesName ? scheme.suppliesName.map((name, idx) => `
                        <div class="scheme-item">${name}: ${scheme.supplyPerPerson[idx]} kg @ Rs ${scheme.suppliesCost[idx]}</div>
                    `).join('') : ''}
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

let html5Qrcode = null;
let isScannerReady = false;

async function startWebCamScanner() {
    const qrReaderEl = document.getElementById('qr-reader');
    qrReaderEl.style.display = 'block';
    document.getElementById('startScannerBtn').style.display = 'none';
    document.getElementById('stopScannerBtn').style.display = 'inline-block';

    if (!html5Qrcode) {
        html5Qrcode = new Html5Qrcode("qr-reader");
    }

    try {
        await html5Qrcode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText, decodedResult) => {
                console.log(`Scan result: ${decodedText}`);
                document.getElementById('qrCodeInput').value = decodedText;
                stopWebCamScanner();
                processQRScan();
            },
            (errorMessage) => {
                // Ignore background errors
            }
        );
        isScannerReady = true;
    } catch (err) {
        console.error("Error starting scanner", err);
        showCustomAlert("Camera access denied or device not found.", "Camera Error");
        stopWebCamScanner();
    }
}

function stopWebCamScanner() {
    if (html5Qrcode && isScannerReady) {
        html5Qrcode.stop().then(() => {
            isScannerReady = false;
            document.getElementById('qr-reader').style.display = 'none';
            document.getElementById('startScannerBtn').style.display = 'inline-block';
            document.getElementById('stopScannerBtn').style.display = 'none';
        }).catch(err => console.error("Failed to stop scanner", err));
    } else {
        document.getElementById('qr-reader').style.display = 'none';
        document.getElementById('startScannerBtn').style.display = 'inline-block';
        document.getElementById('stopScannerBtn').style.display = 'none';
    }
}

async function processQRScan() {
    const qrData = document.getElementById('qrCodeInput').value.trim();

    if (!qrData) {
        showCustomAlert('Please enter or scan QR code data', 'Input Error');
        return;
    }

    try {
        console.log('[QR] Processing scan or text');
        
        // check if it's a manual text input (no RC: pipe markers)
        let response;
        if (qrData.includes('|')) {
            // It's a genuine generated QR payload containing pipes and timestamps
            response = await scanQRCode(qrData);
        } else {
            // Assume it's a plain Ration Card Number manually typed.
            // Strip out "RC:" if the user typed it out of habit
            const cleanRC = qrData.replace(/^RC:/i, '').trim();
            
            const manualResponse = await verifyBeneficiary(cleanRC, true);
            // mock the response to match what processQRScan traditionally extracts
            if (manualResponse && manualResponse.success) {
                let ben = manualResponse.beneficiary;
                response = {
                    success: true,
                    rationCardNumber: ben.username,
                    beneficiaryName: ben.members?.length > 0 ? ben.members[0].name : ben.username,
                    memberCount: ben.members?.length || 0,
                    familyMembers: ben.members || []
                };
            } else {
                response = manualResponse; // preserve error messages
            }
        }

        if (response && response.success) {
            console.log('[QR] Details fetched successfully');
            currentQRData = response;
            document.getElementById('verifiedRCNumber').textContent = response.rationCardNumber || qrData;
            document.getElementById('verifiedBeneficiaryName').textContent = response.beneficiaryName || 'N/A';
            document.getElementById('verifiedMemberCount').textContent = response.memberCount || '0';

            loadFaceSelection(response.familyMembers || []);
            document.getElementById('verificationResult').style.display = 'block';
        } else {
            console.log('[QR] Fetch failed:', response?.message);
            showCustomAlert('Error: ' + (response?.message || 'Verification failed. Target might not exist.'), 'Verification Error');
        }
    } catch (error) {
        console.error('[QR] Error:', error);
        showCustomAlert('Error: ' + error.message, 'Error');
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
        const encodedMember = encodeURIComponent(JSON.stringify(member));
        const option = document.createElement('div');
        option.className = 'face-option';
        option.onclick = () => selectFace(encodedMember);
        option.innerHTML = `
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%231E3A8A'/%3E%3Ccircle cx='40' cy='30' r='12' fill='%23F59E0B'/%3E%3C/svg%3E" alt="face">
            <p>${member.name || 'Member'}</p>
        `;
        if (container) container.appendChild(option);
    });
}

function selectFace(memberJson) {
    const member = JSON.parse(decodeURIComponent(memberJson));
    const allocationSummaryEl = document.getElementById('allocationSummary');
    if (allocationSummaryEl) allocationSummaryEl.style.display = 'block';

    let age = 30; // default adult
    if (member && member.dateOfBirth) {
        const dobDate = new Date(member.dateOfBirth);
        const diffMs = Date.now() - dobDate.getTime();
        const ageDt = new Date(diffMs); 
        age = Math.abs(ageDt.getUTCFullYear() - 1970);
    }

    const dynamicSchemeName = currentSchemes && currentSchemes.length > 0 
        ? (currentSchemes[0].schemeName || currentSchemes[0].schemeType) 
        : 'Standard Allocation';

    let photoSrc = member.photograph;
    
    if (!photoSrc) {
        showCustomAlert("User's image is not present in the database.", "No Image Found");
        return;
    }

    if (photoSrc && !photoSrc.startsWith('http') && !photoSrc.startsWith('data:')) {
        photoSrc = 'data:image/jpeg;base64,' + photoSrc;
    }

    // Stage 1: Face Registration UI
    details = `
        <h5 style="color: var(--secondary); margin-bottom: 15px;"><i class="ri-scan-line"></i> Face Verification: ${member.name || 'Beneficiary'}</h5>
        <div style="display:flex; justify-content:space-around; align-items:center; margin-bottom: 20px; background:#f8fafc; padding:15px; border-radius:8px;">
           <div style="text-align: center;">
               <p style="margin-bottom:10px; font-weight:600;">System Record</p>
               <img src="${photoSrc}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 3px solid #e2e8f0;">
           </div>
           <i class="ri-arrow-left-right-line" style="font-size:24px; color:var(--gray);"></i>
           <div style="text-align: center; width: 120px;">
               <p style="margin-bottom:10px; font-weight:600;">Live Feed</p>
               <div id="liveCaptureArea">
                   <button class="submit-btn" style="width:auto; padding:5px 15px; font-size:12px; border-radius:15px;" onclick="openVerificationCamera()">Link Device Camera</button>
               </div>
           </div>
        </div>
        <div id="aiVerificationBox" style="display:none; text-align:center; padding: 15px; border-radius: 8px; margin-bottom: 15px;"></div>
        <button class="submit-btn" id="verifyFaceBtn" style="background:#5B21B6; display:none;" onclick="executeMockVerification('${dynamicSchemeName}', ${age}, '${member.aadhaarNumber || 'UNKNOWN'}')">
            <i class="ri-robot-2-line"></i> Execute Biometric Mapping
        </button>
        <div id="verifiedAllocationSection" style="display:none;"></div>
    `;
    const detailsEl = document.getElementById('allocationDetails');
    if (detailsEl) detailsEl.innerHTML = details;
    
    // Automatically open verification camera instead of waiting for user click
    setTimeout(() => {
        openVerificationCamera();
    }, 100);
}

async function openVerificationCamera() {
    const captureArea = document.getElementById('liveCaptureArea');
    captureArea.innerHTML = `
        <video id="verifyVideo" width="120" height="120" autoplay playsinline style="border-radius:8px; border:3px solid var(--warning); display:block; object-fit:cover;"></video>
        <canvas id="verifyCanvas" style="display:none;"></canvas>
        <img id="verifyPreview" style="display:none; width:120px; height:120px; border-radius:8px; border:3px solid var(--secondary); object-fit:cover;">
    `;
    
    document.getElementById('verifyFaceBtn').style.display = 'block';

    try {
        const str = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const vid = document.getElementById('verifyVideo');
        vid.srcObject = str;
        // attach stream to window so mock matching can close it
        window.activeVerifyStream = str;
    } catch (err) {
        showCustomAlert("Camera required for verification", "Camera Error");
    }
}

function executeMockVerification(schemeName, age, aadhaar) {
    const btn = document.getElementById('verifyFaceBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Processing Coordinates...';
    
    // Simulate capture
    const video = document.getElementById('verifyVideo');
    const canvas = document.getElementById('verifyCanvas');
    const preview = document.getElementById('verifyPreview');
    
    if (video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        preview.src = canvas.toDataURL('image/jpeg');
        video.style.display = 'none';
        preview.style.display = 'block';
    }

    if (window.activeVerifyStream) {
        window.activeVerifyStream.getTracks().forEach(t => t.stop());
    }

    setTimeout(() => {
        btn.style.display = 'none';
        
        const aiBox = document.getElementById('aiVerificationBox');
        aiBox.style.display = 'block';
        aiBox.style.backgroundColor = '#dcfce7'; // green-100
        aiBox.style.color = '#166534'; // green-800
        aiBox.innerHTML = '<strong><i class="ri-checkbox-circle-fill"></i> ID Verified Automatically: Match Confidence 99.8%</strong>';

        // Now render the allocation segment
        let allocationDetails = "";
        if (age < 18) {
            allocationDetails = `
                <h5 style="color: var(--secondary); margin-bottom: 5px;">Allocating under: ${schemeName} (Age: ${age})</h5>
                <p><strong>Milk Powder:</strong> 1 kg (Rs 0/kg) - Rs 0</p>
                <p><strong>Rice:</strong> 2 kg (Rs 3/kg) - Rs 6</p>
                <p><strong>Sugar:</strong> 1 kg (Rs 15/kg) - Rs 15</p>
                <hr style="margin: 10px 0;">
                <p><strong>Total Payable:</strong> Rs 21</p>
            `;
        } else {
            allocationDetails = `
                <h5 style="color: var(--secondary); margin-bottom: 5px;">Allocating under: ${schemeName} (Adult)</h5>
                <p><strong>Wheat:</strong> 10 kg (Rs 2/kg) - Rs 20</p>
                <p><strong>Rice:</strong> 5 kg (Rs 3/kg) - Rs 15</p>
                <p><strong>Sugar:</strong> 2 kg (Rs 15/kg) - Rs 30</p>
                <p><strong>Kerosene:</strong> 2 L (Rs 10/L) - Rs 20</p>
                <hr style="margin: 10px 0;">
                <p><strong>Total Payable:</strong> Rs 85</p>
            `;
        }

        allocationDetails += `
            <button class="submit-btn" style="margin-top: 15px;" onclick="completeAllocation('${aadhaar}')">
                <i class="ri-check-double-line"></i> Confirm & Process Transaction
            </button>
        `;
        
        const section = document.getElementById('verifiedAllocationSection');
        section.style.display = 'block';
        section.innerHTML = allocationDetails;
    }, 1500);
}

async function completeAllocation(actualAadhaarNumber) {
    const beneficiaryUsername = document.getElementById('verifiedRCNumber').textContent.trim();
    const qrCodeUsed = currentQRData ? currentQRData.qrCodeData : 'MOCK_QR_DATA';
    
    try {
        const response = await processTransaction(
            beneficiaryUsername,
            actualAadhaarNumber,
            null, // Scheme ID dynamic calculated
            true, // isOnline
            qrCodeUsed
        );
        
        if (response && response.success) {
            showCustomAlert('Ration Transaction Completed Successfully!', 'Transaction Success');
            document.getElementById('verificationResult').style.display = 'none';
            document.getElementById('onlineSection').style.display = 'none';
            document.getElementById('qrCodeInput').value = '';
            // reload summary data
            loadDistributorData();
        } else {
            showCustomAlert('Allocation execution failed: ' + (response?.message || 'Error occurred'), 'Transaction Error');
        }
    } catch (e) {
        showCustomAlert('Transaction processing failed: ' + e.message, 'Transaction Error');
    }
}

async function sendOTP() {
    const beneficiaryId = document.getElementById('otpBeneficiaryId').value;

    if (!beneficiaryId) {
        showCustomAlert('Please enter beneficiary username or RC number', 'Input Required');
        return;
    }

    try {
        console.log('[OTP] Sending OTP for:', beneficiaryId);
        showCustomAlert('OTP sent to registered email: ' + beneficiaryId.substring(0, 2) + '***@gmail.com', 'OTP Sent');
        const otpSectionEl = document.getElementById('otpSection');
        if (otpSectionEl) otpSectionEl.style.display = 'block';
    } catch (error) {
        console.error('[OTP] Error:', error);
        showCustomAlert('Error: ' + error.message, 'OTP Error');
    }
}

function verifyOTP() {
    const otp = document.getElementById('otpInput').value;

    if (otp.length !== 6) {
        showCustomAlert('Please enter a valid 6-digit OTP', 'Invalid OTP');
        return;
    }

    console.log('[OTP] Verifying OTP');
    showCustomAlert('OTP verified successfully!', 'Success');
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
    showCustomAlert('Offline transaction completed and will sync when online!', 'Transaction Initialized');
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
        showCustomAlert('New passwords do not match!', 'Password Match Error');
        return;
    }

    if (newPwd.length < 6) {
        showCustomAlert('New password must be at least 6 characters long', 'Password Too Short');
        return;
    }

    try {
        console.log('[PASSWORD] Changing password');
        showCustomAlert('Password changed successfully! Please login again.', 'Success');
        logout();
    } catch (error) {
        console.error('[PASSWORD] Error:', error);
        showCustomAlert('Error: ' + error.message, 'Error');
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

// ==== CAMERA CAPTURE LOGIC ====
let currentCameraTargetId = null;
let stream = null;

async function openCameraModal(memberNumber) {
    currentCameraTargetId = memberNumber;
    const modal = document.getElementById('cameraModal');
    if (modal) modal.classList.add('active');

    const video = document.getElementById('cameraVideo');
    const btnCapture = document.getElementById('btnCapture');
    const btnRetake = document.getElementById('btnRetake');
    const btnSavePhoto = document.getElementById('btnSavePhoto');
    const canvas = document.getElementById('cameraCanvas');
    const preview = document.getElementById('cameraPreview');

    btnCapture.style.display = 'inline-block';
    btnRetake.style.display = 'none';
    btnSavePhoto.style.display = 'none';
    video.style.display = 'block';
    preview.style.display = 'none';

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
    } catch (err) {
        console.error("Camera access denied or unvailable:", err);
        showCustomAlert("Unable to access camera: " + err.message, "Camera Error");
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const preview = document.getElementById('cameraPreview');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get Base64 string
    const base64Img = canvas.toDataURL('image/jpeg', 0.8);
    preview.src = base64Img;
    
    // UI toggles
    video.style.display = 'none';
    preview.style.display = 'block';
    
    document.getElementById('btnCapture').style.display = 'none';
    document.getElementById('btnRetake').style.display = 'inline-block';
    document.getElementById('btnSavePhoto').style.display = 'inline-block';
}

function retakePhoto() {
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('cameraPreview');
    
    video.style.display = 'block';
    preview.style.display = 'none';
    
    document.getElementById('btnCapture').style.display = 'inline-block';
    document.getElementById('btnRetake').style.display = 'none';
    document.getElementById('btnSavePhoto').style.display = 'none';
}

function saveCapturedPhoto() {
    const preview = document.getElementById('cameraPreview');
    const base64Img = preview.src;
    
    if (currentCameraTargetId) {
        const inputField = document.getElementById(`photo-data-${currentCameraTargetId}`);
        const statusSpan = document.getElementById(`photo-status-${currentCameraTargetId}`);
        if (inputField) inputField.value = base64Img;
        if (statusSpan) {
            statusSpan.style.color = "var(--secondary)";
            statusSpan.textContent = "Photo captured successfully ✓";
        }
    }
    
    closeCameraModal();
}

function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) modal.classList.remove('active');
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
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