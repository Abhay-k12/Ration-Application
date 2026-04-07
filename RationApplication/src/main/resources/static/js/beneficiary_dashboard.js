let currentBeneficiary = null;
let currentComplaints = [];
let currentTransactions = [];

// Check authentication on page load
window.addEventListener('load', () => {
    const token = localStorage.getItem('jwtToken');
    const userRole = localStorage.getItem('userRole');

    console.log('[AUTH] Token:', token ? 'Present' : 'Missing');
    console.log('[AUTH] Role:', userRole);

    if (!token || userRole !== 'BENEFICIARY') {
        console.log('[AUTH] Not authenticated as BENEFICIARY, redirecting to login');
        window.location.href = '/login_page.html';
        return;
    }

    console.log('[INIT] Loading beneficiary data');
    loadBeneficiaryData();
    setupEventListeners();
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
            if (moduleId === 'module4') {
                loadComplaints();
            } else if (moduleId === 'module5') {
                loadTransactions();
            }
        });
    });

    // Form submissions
    document.getElementById('changePwdForm')?.addEventListener('submit', handleChangePassword);
    document.getElementById('complaintForm')?.addEventListener('submit', handleComplaintSubmit);

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

async function loadBeneficiaryData() {
    try {
        // Get user data from localStorage (stored during login)
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const stateDistrictCode = localStorage.getItem('stateDistrictCode');

        console.log('[DATA] Username:', username);
        console.log('[DATA] Email:', email);
        console.log('[DATA] State/District:', stateDistrictCode);

        // Update sidebar profile card with user details
        const beneficiaryNameEl = document.getElementById('beneficiaryName');
        const rcNumberEl = document.getElementById('rcNumber');
        const locationInfoEl = document.getElementById('locationInfo');

        if (beneficiaryNameEl) {
            beneficiaryNameEl.textContent = username || 'Beneficiary';
            console.log('[SIDEBAR] Updated beneficiary name:', username);
        }

        if (rcNumberEl) {
            rcNumberEl.textContent = username || '--';
            console.log('[SIDEBAR] Updated RC number:', username);
        }

        if (locationInfoEl) {
            locationInfoEl.textContent = stateDistrictCode || 'District';
            console.log('[SIDEBAR] Updated location:', stateDistrictCode);
        }

        // Fetch and setup basic UI components right away
        const cardTypeEl = document.getElementById('cardType');
        const issueDateEl = document.getElementById('issueDate');
        const validDateEl = document.getElementById('validDate');
        const districtInfoEl = document.getElementById('districtInfo');

        if (cardTypeEl) cardTypeEl.textContent = 'BPL (Antyodaya)';
        if (issueDateEl) issueDateEl.textContent = '12 Mar 2020';
        if (validDateEl) validDateEl.textContent = '31 Mar 2030';
        if (districtInfoEl) districtInfoEl.textContent = stateDistrictCode || '--';

        const qrRationCardEl = document.getElementById('qrRationCard');
        const qrValidDateEl = document.getElementById('qrValidDate');
        const qrAddressEl = document.getElementById('qrAddress');
        
        if (qrRationCardEl) qrRationCardEl.textContent = username || '--';
        if (qrValidDateEl) qrValidDateEl.textContent = '31/03/2030';
        if (qrAddressEl) qrAddressEl.textContent = 'District: ' + (stateDistrictCode || 'Unknown');

        // Load family members, which also populates QR specific counts
        loadFamilyMembers();
    } catch (error) {
        console.error('[DATA] Error loading beneficiary data:', error);
    }
}

async function loadFamilyMembers() {
    try {
        console.log('[FAMILY] Loading family members');

        // Use the new beneficiary-specific endpoint instead of admin endpoint
        const response = await getBeneficiaryMembers();

        console.log('[FAMILY] Response:', response);

        if (response && Array.isArray(response)) {
            const tbody = document.getElementById('familyTableBody');
            const familyList = document.getElementById('familyMembersList');

            if (tbody) tbody.innerHTML = '';
            if (familyList) familyList.innerHTML = '';

            const memberCountEl = document.getElementById('memberCount');
            if (memberCountEl) memberCountEl.textContent = response.length;

            console.log('[FAMILY] Total members:', response.length);

            response.forEach((member, index) => {
                // Add to table
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${member.name || 'N/A'}</td>
                    <td>${member.aadhaarNumber || 'N/A'}</td>
                    <td>${member.employmentStatus || 'N/A'}</td>
                `;
                if (tbody) tbody.appendChild(row);

                // Add to sidebar list
                const memberDiv = document.createElement('div');
                memberDiv.className = 'family-member';
                memberDiv.innerHTML = `
                    <i class="ri-user-line"></i> ${member.name || 'Member'}
                    <span class="member-tag">${(member.employmentStatus || 'unknown').toLowerCase()}</span>
                `;
                if (familyList) familyList.appendChild(memberDiv);

                console.log('[FAMILY] Added member:', member.name);
            });
            
            // Set derived UI
            const qrFamilyCountEl = document.getElementById('qrFamilyCount');
            if (qrFamilyCountEl) qrFamilyCountEl.textContent = response.length;
            
            const qrBeneficiaryNameEl = document.getElementById('qrBeneficiaryName');
            if (qrBeneficiaryNameEl && response.length > 0) qrBeneficiaryNameEl.textContent = response[0].name;

        } else if (response && response.status === 403) {
            console.error('[FAMILY] Access denied (403)');
            const tbody = document.getElementById('familyTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--gray);">Access denied</td></tr>';
            }
        } else {
            console.log('[FAMILY] No family members found or invalid response');
            const tbody = document.getElementById('familyTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--gray);">No family members found</td></tr>';
            }
        }
    } catch (error) {
        console.error('[FAMILY] Error:', error);
        const familyTableBody = document.getElementById('familyTableBody');
        if (familyTableBody) {
            familyTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--gray);">Failed to load members</td></tr>';
        }
    }
}

async function generateQRCode() {
    try {
        const btn = event.target.closest('button');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Generating...';

        console.log('[QR] Generating QR code');

        const response = await apiRequest('/beneficiary/generateQR', 'POST');

        if (response && response.success && response.qrCodeImage) {
            const qrDisplay = document.getElementById('qrCodeDisplay');
            if (qrDisplay) {
                qrDisplay.innerHTML = `<img src="${response.qrCodeImage}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
                console.log('[QR] QR code generated successfully');
            }
            //alert('QR Code generated successfully!');
        } else {
            console.log('[QR] Failed:', response?.message);
            //alert('Error generating QR code: ' + (response?.message || 'Unknown error'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-refresh-line"></i> Generate QR Code';
    } catch (error) {
        console.error('[QR] Error:', error);
        alert('Error: ' + error.message);
        const btn = event.target.closest('button');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-refresh-line"></i> Generate QR Code';
    }
}

function downloadQR() {
    try {
        const img = document.querySelector('#qrCodeDisplay img');
        if (img) {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'ration-qr-code.png';
            link.click();
            console.log('[QR] QR code downloaded');
        } else {
            alert('Please generate QR code first');
        }
    } catch (error) {
        console.error('[QR] Download error:', error);
        alert('Error downloading QR code: ' + error.message);
    }
}

async function handleComplaintSubmit(e) {
    e.preventDefault();

    const category = document.getElementById('complaintCategory').value;
    const message = document.getElementById('complaintMessage').value;
    const priority = document.getElementById('complaintPriority').value;

    if (!category || !message) {
        alert('Please fill all fields');
        return;
    }

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Submitting...';

        console.log('[COMPLAINT] Submitting complaint');

        const response = await submitComplaint(
            category,
            message,
            category,
            priority
        );

        if (response && response.success) {
            alert('Complaint submitted successfully!');
            document.getElementById('complaintForm').reset();
            console.log('[COMPLAINT] Submitted successfully');
        } else {
            console.log('[COMPLAINT] Failed:', response?.message);
            alert('Error: ' + (response?.message || 'Failed to submit complaint'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit complaint';
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        alert('Error: ' + error.message);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit complaint';
    }
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

async function loadComplaints() {
    try {
        console.log('[COMPLAINTS] Loading complaints');

        const response = await getBeneficiaryComplaints();

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
                const statusClass = `status-${complaint.status.toLowerCase()}`;
                const card = document.createElement('div');
                card.className = `complaint-card`;
                card.style.borderLeftColor = complaint.status === 'RESOLVED' ? 'var(--secondary)' :
                                             complaint.status === 'REJECTED' ? 'var(--danger)' :
                                             'var(--accent)';
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
        const container = document.getElementById('complaintHistoryContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">Failed to load complaints</p>';
        }
    }
}

async function loadTransactions() {
    try {
        console.log('[TRANSACTIONS] Loading transactions');

        const response = await getBeneficiaryTransactions();

        console.log('[TRANSACTIONS] Response:', response);

        if (response && Array.isArray(response)) {
            const container = document.getElementById('transactionHistoryContainer');
            if (container) container.innerHTML = '';

            if (response.length === 0) {
                if (container) container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No transactions found</p>';
                return;
            }

            currentTransactions = response;

            response.forEach((txn, index) => {
                const statusBadgeClass = txn.totalAmountPaid > 0 ? 'taken' : 'skipped';
                const card = document.createElement('div');
                card.className = 'txn-card';
                card.onclick = () => viewTransactionDetail(index);
                card.innerHTML = `
                    <div>
                        <strong>${new Date(txn.dateOfTransaction).toLocaleDateString()}</strong>
                        <br><small>Receipt: ${txn.receiptNumber || 'N/A'}</small>
                    </div>
                    <div style="text-align:right">
                        <span class="txn-badge ${statusBadgeClass}">${txn.totalAmountPaid > 0 ? 'Received' : 'Skipped'}</span>
                        <br><small>Amount: ${txn.totalAmountPaid}</small>
                    </div>
                `;
                if (container) container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('[TRANSACTIONS] Error:', error);
        const container = document.getElementById('transactionHistoryContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">Failed to load transactions</p>';
        }
    }
}

function viewComplaintDetail(index) {
    const complaint = currentComplaints[index];
    if (!complaint) return;

    const content = `
        <p><strong>Complaint ID:</strong> ${complaint.id || 'N/A'}</p>
        <p><strong>Subject:</strong> ${complaint.complaintTitle}</p>
        <p><strong>Date:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span></p>
        <p><strong>Description:</strong> ${complaint.description}</p>
        ${complaint.resolutionNotes ? `<p><strong>Resolution Notes:</strong> ${complaint.resolutionNotes}</p>` : ''}
        ${complaint.resolvedAt ? `<p><strong>Resolved At:</strong> ${new Date(complaint.resolvedAt).toLocaleDateString()}</p>` : ''}
    `;

    const contentEl = document.getElementById('complaintDetailContent');
    if (contentEl) contentEl.innerHTML = content;

    const modal = document.getElementById('complaintModal');
    if (modal) modal.classList.add('active');
}

function viewTransactionDetail(index) {
    const txn = currentTransactions[index];
    if (!txn) return;

    const content = `
        <p><strong>Receipt Number:</strong> ${txn.receiptNumber || 'N/A'}</p>
        <p><strong>Date & Time:</strong> ${new Date(txn.dateOfTransaction).toLocaleDateString()} ${new Date(txn.dateOfTransaction).toLocaleTimeString()}</p>
        <p><strong>Amount Paid:</strong> ${txn.totalAmountPaid}</p>
        <p><strong>Month:</strong> ${txn.transactionMonth || 'N/A'}</p>
        <p><strong>Status:</strong> <span class="txn-badge ${txn.totalAmountPaid > 0 ? 'taken' : 'skipped'}">${txn.totalAmountPaid > 0 ? 'Received' : 'Skipped'}</span></p>
        <p><strong>Distributor:</strong> ${txn.distributorUsername || 'N/A'}</p>
        <p><strong>Verification Method:</strong> ${txn.verificationMethod || 'N/A'}</p>
    `;

    const contentEl = document.getElementById('txnDetailContent');
    if (contentEl) contentEl.innerHTML = content;

    const modal = document.getElementById('txnModal');
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
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