let currentBeneficiary = null;
let currentComplaints = [];
let currentTransactions = [];

// Check authentication on page load
window.addEventListener('load', () => {
    const token = getAuthToken();
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'BENEFICIARY') {
        window.location.href = '/login_page.html';
        return;
    }

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
        const username = localStorage.getItem('username');

        // Set basic info
        document.getElementById('beneficiaryName').textContent = username || 'Beneficiary';
        document.getElementById('rcNumber').textContent = username || '--';
        document.getElementById('locationInfo').textContent = localStorage.getItem('stateDistrictCode') || 'District';

        // Fetch beneficiary details from backend
        const response = await apiRequest('/beneficiary/getTransactions', 'GET');

        if (response && response.ok) {
            // Set ration card details
            document.getElementById('cardType').textContent = 'BPL (Antyodaya)';
            document.getElementById('issueDate').textContent = '12 Mar 2020';
            document.getElementById('validDate').textContent = '31 Mar 2030';
            document.getElementById('districtInfo').textContent = localStorage.getItem('stateDistrictCode') || '--';

            // Set QR info
            document.getElementById('qrBeneficiaryName').textContent = username;
            document.getElementById('qrRationCard').textContent = username;
            document.getElementById('qrAddress').textContent = 'Lucknow, Uttar Pradesh - 226001';
            document.getElementById('qrFamilyCount').textContent = '5';
            document.getElementById('qrValidDate').textContent = '31/03/2030';

            // Load family members
            loadFamilyMembers();
        }
    } catch (error) {
        console.error('Error loading beneficiary data:', error);
    }
}

async function loadFamilyMembers() {
    try {
        const username = localStorage.getItem('username');
        const response = await apiRequest(`/admin/getAllBeneficiary/${username}`, 'GET');

        if (response && Array.isArray(response)) {
            const tbody = document.getElementById('familyTableBody');
            const familyList = document.getElementById('familyMembersList');

            tbody.innerHTML = '';
            familyList.innerHTML = '';

            document.getElementById('memberCount').textContent = response.length;

            response.forEach((member, index) => {
                // Add to table
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${member.name}</td>
                    <td>${member.aadhaarNumber}</td>
                    <td>${member.employmentStatus || 'N/A'}</td>
                `;
                tbody.appendChild(row);

                // Add to sidebar list
                const memberDiv = document.createElement('div');
                memberDiv.className = 'family-member';
                memberDiv.innerHTML = `
                    <i class="ri-user-line"></i> ${member.name}
                    <span class="member-tag">${(member.employmentStatus || 'unknown').toLowerCase()}</span>
                `;
                familyList.appendChild(memberDiv);
            });
        }
    } catch (error) {
        console.error('Error loading family members:', error);
        document.getElementById('familyTableBody').innerHTML =
            '<tr><td colspan="3" style="text-align: center; color: var(--gray);">Failed to load members</td></tr>';
    }
}

async function generateQRCode() {
    try {
        const btn = event.target.closest('button');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Generating...';

        const response = await generateQRCode();

        if (response && response.success && response.qrImageBase64) {
            const qrDisplay = document.getElementById('qrCodeDisplay');
            qrDisplay.innerHTML = `<img src="data:image/png;base64,${response.qrImageBase64}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
            alert('QR Code generated successfully!');
        } else {
            alert('Error generating QR code: ' + (response?.message || 'Unknown error'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-refresh-line"></i> Generate QR Code';
    } catch (error) {
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
        } else {
            alert('Please generate QR code first');
        }
    } catch (error) {
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

        const response = await submitComplaint(
            category,
            message,
            category,
            priority
        );

        if (response && response.success) {
            alert('Complaint submitted successfully!');
            document.getElementById('complaintForm').reset();
        } else {
            alert('Error: ' + (response?.message || 'Failed to submit complaint'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit complaint';
    } catch (error) {
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
        // For now, we'll show success message
        // In production, this would call an API endpoint
        alert('Password changed successfully! Please login again.');
        logout();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadComplaints() {
    try {
        const response = await getBeneficiaryComplaints();

        if (response && Array.isArray(response)) {
            const container = document.getElementById('complaintHistoryContainer');
            container.innerHTML = '';

            if (response.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No complaints found</p>';
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
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
        document.getElementById('complaintHistoryContainer').innerHTML =
            '<p style="text-align: center; color: var(--gray); padding: 40px;">Failed to load complaints</p>';
    }
}

async function loadTransactions() {
    try {
        const response = await getBeneficiaryTransactions();

        if (response && Array.isArray(response)) {
            const container = document.getElementById('transactionHistoryContainer');
            container.innerHTML = '';

            if (response.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No transactions found</p>';
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
                        <br><small>₹ ${txn.totalAmountPaid}</small>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionHistoryContainer').innerHTML =
            '<p style="text-align: center; color: var(--gray); padding: 40px;">Failed to load transactions</p>';
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

    document.getElementById('complaintDetailContent').innerHTML = content;
    document.getElementById('complaintModal').classList.add('active');
}

function viewTransactionDetail(index) {
    const txn = currentTransactions[index];
    if (!txn) return;

    const content = `
        <p><strong>Receipt Number:</strong> ${txn.receiptNumber || 'N/A'}</p>
        <p><strong>Date & Time:</strong> ${new Date(txn.dateOfTransaction).toLocaleDateString()} ${new Date(txn.dateOfTransaction).toLocaleTimeString()}</p>
        <p><strong>Amount Paid:</strong> ₹ ${txn.totalAmountPaid}</p>
        <p><strong>Month:</strong> ${txn.transactionMonth || 'N/A'}</p>
        <p><strong>Status:</strong> <span class="txn-badge ${txn.totalAmountPaid > 0 ? 'taken' : 'skipped'}">${txn.totalAmountPaid > 0 ? 'Received' : 'Skipped'}</span></p>
        <p><strong>Distributor:</strong> ${txn.distributorUsername || 'N/A'}</p>
        <p><strong>Verification Method:</strong> ${txn.verificationMethod || 'N/A'}</p>
    `;

    document.getElementById('txnDetailContent').innerHTML = content;
    document.getElementById('txnModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
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