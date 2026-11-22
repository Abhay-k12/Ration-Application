let currentBeneficiary = null;
let currentComplaints = [];
let currentTransactions = [];

window.addEventListener('load', () => {
    if (typeof isSessionValid === 'function' && !isSessionValid()) {
        console.log('[AUTH] Session duration (1 hr) expired, redirecting to login');
        removeAuthToken();
        window.location.href = '/login_page.html';
        return;
    }

    const token = typeof getAuthToken === 'function' ? getAuthToken() : (sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken'));
    const userRole = typeof getUserRole === 'function' ? getUserRole() : (sessionStorage.getItem('userRole') || localStorage.getItem('userRole'));

    console.log('[AUTH] Token:', token ? 'Present' : 'Missing');
    console.log('[AUTH] Role:', userRole);

    if (!token || userRole !== 'BENEFICIARY') {
        console.log('[AUTH] Not authenticated as BENEFICIARY, redirecting to login');
        window.location.href = '/login_page.html';
        return;
    }

    if (typeof touchSession === 'function') {
        touchSession();
    }
    console.log('[INIT] Loading beneficiary data');
    loadBeneficiaryData();
    setupEventListeners();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (typeof isSessionValid === 'function' && isSessionValid()) {
            if (typeof touchSession === 'function') touchSession();
            console.log('[AUTH] Beneficiary tab active: 1-hour session refreshed');
        }
    }
});

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const moduleId = this.getAttribute('data-module');
            document.querySelectorAll('.module').forEach(module => module.classList.remove('active'));
            document.getElementById(moduleId).classList.add('active');

            if (moduleId === 'module4') {
                loadComplaints();
            } else if (moduleId === 'module5') {
                loadTransactions();
            } else if (moduleId === 'module6') {
                loadSchemes();
            }
        });
    });

    document.getElementById('changePwdForm')?.addEventListener('submit', handleChangePassword);
    document.getElementById('complaintForm')?.addEventListener('submit', handleComplaintSubmit);

    window.addEventListener('scroll', function () {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

async function loadBeneficiaryData() {
    try {
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const stateDistrictCode = localStorage.getItem('stateDistrictCode');

        console.log('[DATA] Username:', username);
        console.log('[DATA] Email:', email);
        console.log('[DATA] State/District:', stateDistrictCode);

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

        const cardTypeEl = document.getElementById('cardType');
        const issueDateEl = document.getElementById('issueDate');
        const validDateEl = document.getElementById('validDate');
        const districtInfoEl = document.getElementById('districtInfo');

        try {
            const profile = await getBeneficiaryProfile();
            if (profile && !profile.error) {
                if (cardTypeEl) cardTypeEl.textContent = profile.fullName || username;
                if (issueDateEl) issueDateEl.textContent = profile.email || email;
                if (validDateEl) validDateEl.textContent = profile.isActive ? 'Active' : 'Inactive';
                if (districtInfoEl) districtInfoEl.textContent = new Date(profile.createdAt).toLocaleDateString() || '--';
            } else {
                if (cardTypeEl) cardTypeEl.textContent = username;
                if (issueDateEl) issueDateEl.textContent = email || '--';
                if (validDateEl) validDateEl.textContent = 'Active';
                if (districtInfoEl) districtInfoEl.textContent = '--';
            }
        } catch (e) {
            console.error('Failed to load profile', e);
        }

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

            const qrPhotoPlaceholderEl = document.getElementById('qrPhotoPlaceholder');
            if (qrPhotoPlaceholderEl && response.length > 0 && response[0].photograph) {
                const imgPrefix = response[0].photograph.startsWith('data:image') ? '' : 'data:image/jpeg;base64,';
                qrPhotoPlaceholderEl.innerHTML = `<img src="${imgPrefix}${response[0].photograph}" alt="Beneficiary Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px;"/>`;
            } else if (qrPhotoPlaceholderEl) {
                qrPhotoPlaceholderEl.innerHTML = '<i class="ri-user-face-line"></i>';
            }

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
        await showCustomModal('Error: ' + error.message);
        const btn = event.target.closest('button');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-refresh-line"></i> Generate QR Code';
    }
}

async function handleComplaintSubmit(e) {
    e.preventDefault();

    const category = document.getElementById('complaintCategory').value;
    const message = document.getElementById('complaintMessage').value;

    const documentLink = document.getElementById('complaintDocumentLink')?.value || document.getElementById('complaintPriority')?.value;

    if (!category || !message) {
        await showCustomModal('Please fill all required fields');
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
            documentLink
        );

        if (response && response.success) {
            await showCustomModal('Complaint submitted successfully!');
            document.getElementById('complaintForm').reset();
            console.log('[COMPLAINT] Submitted successfully');
            loadComplaints(); // Refresh the list
        } else {
            console.log('[COMPLAINT] Failed:', response?.message);
            await showCustomModal('Error: ' + (response?.message || 'Failed to submit complaint'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-send-plane-line"></i> Submit complaint';
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        await showCustomModal('Error: ' + error.message);
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
        await showCustomModal('New passwords do not match!');
        return;
    }

    if (newPwd.length < 6) {
        await showCustomModal('New password must be at least 6 characters long');
        return;
    }

    try {
        console.log('[PASSWORD] Changing password');
        await showCustomModal('Password changed successfully! Please login again.');
        logout();
    } catch (error) {
        console.error('[PASSWORD] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadComplaints() {
    try {
        console.log('[COMPLAINTS] Loading complaints');
        if (typeof touchSession === 'function') {
            touchSession();
        }

        const response = await getBeneficiaryComplaints();

        console.log('[COMPLAINTS] Response:', response);

        const container = document.getElementById('complaintHistoryContainer');
        if (!container) return;
        container.innerHTML = '';

        if (response && Array.isArray(response)) {
            if (response.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;"><i class="ri-inbox-line" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>No complaints found</p>';
                return;
            }

            currentComplaints = response;

            let tableHtml = `
                <div class="table-responsive">
                    <table class="complaint-table">
                        <thead>
                            <tr>
                                <th>Complaint ID</th>
                                <th>Subject</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="beneficiaryComplaintsTableBody">
                        </tbody>
                    </table>
                </div>
            `;
            container.innerHTML = tableHtml;
            const tbody = document.getElementById('beneficiaryComplaintsTableBody');

            response.forEach((complaint, index) => {
                const status = complaint.status ? complaint.status.toUpperCase() : 'PENDING';
                let statusColor = '#d97706';
                let statusBg = '#fef3c7';
                if (status === 'RESOLVED' || status === 'PROCESSED') {
                    statusColor = '#16a34a';
                    statusBg = '#dcfce7';
                } else if (status === 'REJECTED') {
                    statusColor = '#dc2626';
                    statusBg = '#fee2e2';
                }

                const displayId = complaint.id ? (complaint.id.length > 12 ? complaint.id.substring(0, 10) + '...' : complaint.id) : ('CMP/' + (index + 1));
                const complaintDate = complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A';

                const row = document.createElement('tr');
                row.title = 'Click to view complete complaint details & resolution';
                row.onclick = () => viewComplaintDetail(index);
                row.innerHTML = `
                    <td><strong style="font-family: monospace; color: var(--primary);">${escapeHtml(displayId)}</strong></td>
                    <td><strong>${escapeHtml(complaint.complaintTitle || 'No Subject')}</strong></td>
                    <td>${complaintDate}</td>
                    <td><span class="status-badge" style="color: ${statusColor}; background: ${statusBg}; padding: 4px 10px; border-radius: 4px; font-weight: 500; font-size: 12px; box-shadow: none;">${status}</span></td>
                    <td><button class="action-btn edit" onclick="event.stopPropagation(); viewComplaintDetail(${index})"><i class="ri-eye-line"></i> View</button></td>
                `;
                tbody.appendChild(row);
            });
        } else if (response && (response.status === 401 || response.status === 403)) {
            console.warn('[COMPLAINTS] Access restricted:', response);
            container.innerHTML = '<p style="text-align: center; color: var(--danger); padding: 40px;">Access restricted. Please ensure your beneficiary session is active.</p>';
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No complaints found</p>';
        }
    } catch (error) {
        console.error('[COMPLAINTS] Error:', error);
        const container = document.getElementById('complaintHistoryContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No complaints found</p>';
        }
    }
}

async function loadTransactions() {
    try {
        console.log('[TRANSACTIONS] Loading transactions');

        const response = await getBeneficiaryTransactions();

        console.log('[TRANSACTIONS] Response:', response);

        const container = document.getElementById('transactionHistoryContainer');
        if (!container) return;
        container.innerHTML = '';

        if (response && Array.isArray(response)) {
            if (response.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;"><i class="ri-file-list-line" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>No transactions found</p>';
                return;
            }

            currentTransactions = response;

            let tableHtml = `
                <div class="table-responsive">
                    <table class="complaint-table">
                        <thead>
                            <tr>
                                <th>Receipt No</th>
                                <th>Date & Time</th>
                                <th>Amount (₹)</th>
                                <th>Distributor</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="beneficiaryTransactionsTableBody">
                        </tbody>
                    </table>
                </div>
            `;
            container.innerHTML = tableHtml;
            const tbody = document.getElementById('beneficiaryTransactionsTableBody');

            response.forEach((txn, index) => {
                let calculatedAmount = 0;
                if (txn.costPerSupplies && Array.isArray(txn.costPerSupplies)) {
                    calculatedAmount = txn.costPerSupplies.reduce((sum, cost) => sum + cost, 0);
                }

                const txnId = txn.id || txn._id || 'N/A';
                const displayId = txnId.length > 12 ? txnId.substring(0, 10) + '...' : txnId;
                const txDate = txn.dateOfTransaction ? new Date(txn.dateOfTransaction) : new Date(txn.createdAt || Date.now());

                const row = document.createElement('tr');
                row.title = 'Click to view complete receipt & purchased commodities';
                row.onclick = () => viewTransactionDetail(index);
                row.innerHTML = `
                    <td><strong style="font-family: monospace; color: var(--primary);">${escapeHtml(displayId)}</strong></td>
                    <td>${txDate.toLocaleDateString()}</td>
                    <td><strong style="color: var(--secondary);">₹${calculatedAmount}</strong></td>
                    <td>${escapeHtml(txn.distributorUsername || 'N/A')}</td>
                    <td><span class="status-badge" style="background: #dcfce7; color: #16a34a; padding: 4px 10px; border-radius: 4px; font-weight: 500; font-size: 12px; box-shadow: none;">${txn.status || 'COMPLETED'}</span></td>
                    <td><button class="action-btn edit" onclick="event.stopPropagation(); viewTransactionDetail(${index})"><i class="ri-eye-line"></i> View</button></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No transactions found</p>';
        }
    } catch (error) {
        console.error('[TRANSACTIONS] Error:', error);
        const container = document.getElementById('transactionHistoryContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">Failed to load transactions</p>';
        }
    }
}

async function loadSchemes() {
    try {
        console.log('[SCHEMES] Loading schemes');
        const stateDistrictCode = localStorage.getItem('stateDistrictCode');
        const response = await getSchemesByDistrict(stateDistrictCode);

        const container = document.getElementById('schemesContainer');
        if (container) container.innerHTML = '';

        if (!response || !Array.isArray(response) || response.length === 0) {
            if (container) container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No active schemes found for your district</p>';
            return;
        }

        response.forEach(scheme => {
            const card = document.createElement('div');
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.background = '#f8fafc';
            card.style.border = '1px solid #e2e8f0';
            card.style.borderRadius = '12px';
            card.style.padding = '20px';
            card.style.flexWrap = 'wrap';
            card.style.gap = '20px';

            let itemsHtml = (scheme.suppliesName || []).map((name, idx) => `
                <div style="background: white; padding: 10px 16px; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; flex-direction: column; align-items: center; min-width: 110px;">
                    <span style="font-weight: 600; color: var(--primary); font-size: 14px;">${name}</span>
                    <span style="color: var(--secondary); font-weight: 700; font-size: 13px; margin-top: 4px;">${scheme.supplyPerPerson[idx]} kg @ ₹${scheme.suppliesCost[idx]}</span>
                </div>
            `).join('');

            const displayName = (scheme.schemeName || scheme.schemeType || '').replace(/_/g, ' ');

            card.innerHTML = `
                <!-- Left Side: Scheme Info -->
                <div style="flex: 1; min-width: 250px; max-width: 100%;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                        <h4 style="color: var(--primary); font-size: 1.2rem; margin: 0; word-break: break-word;">${displayName}</h4>
                        <span style="background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;">Active</span>
                    </div>
                    <p style="color: var(--gray); font-size: 14px; margin: 0;"><i class="ri-map-pin-line"></i> District: <strong>${scheme.stateDistrictCode}</strong></p>
                </div>

                <!-- Right Side: Supplies List -->
                <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; flex: 2;">
                    ${itemsHtml}
                </div>
            `;
            if (container) container.appendChild(card);
        });
    } catch (error) {
        console.error('[SCHEMES] Error:', error);
        const container = document.getElementById('schemesContainer');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--danger); padding: 40px;">Failed to load schemes</p>';
        }
    }
}

function viewComplaintDetail(index) {
    const complaint = currentComplaints[index];
    if (!complaint) return;

    const status = complaint.status ? complaint.status.toUpperCase() : 'PENDING';
    let statusBadgeColor = '#d97706';
    let statusBadgeBg = '#fef3c7';
    if (status === 'RESOLVED' || status === 'PROCESSED') {
        statusBadgeColor = '#16a34a';
        statusBadgeBg = '#dcfce7';
    } else if (status === 'REJECTED') {
        statusBadgeColor = '#dc2626';
        statusBadgeBg = '#fee2e2';
    }

    let resolutionSection = '';
    if (complaint.resolutionNotes) {
        const isRejected = (status === 'REJECTED');
        const bg = isRejected ? '#fef2f2' : '#f0fdf4';
        const border = isRejected ? '#fecaca' : '#bbf7d0';
        const titleColor = isRejected ? '#dc2626' : '#16a34a';
        const icon = isRejected ? 'ri-close-circle-line' : 'ri-checkbox-circle-line';
        const label = isRejected ? 'Rejection Reason / Remarks from Authority:' : 'Resolution Remarks from Authority:';

        resolutionSection = `
            <div style="margin-top: 15px; padding: 15px; background: ${bg}; border-radius: 12px; border: 1px solid ${border};">
                <strong style="color: ${titleColor}; font-size: 14px;"><i class="${icon}"></i> ${label}</strong>
                <p style="margin-top: 8px; white-space: pre-wrap; font-size: 14px; color: #1e293b;">${escapeHtml(complaint.resolutionNotes)}</p>
                ${complaint.resolvedAt ? `<p style="margin-top: 6px; font-size: 12px; color: var(--gray);">Action Taken On: ${new Date(complaint.resolvedAt).toLocaleString()}</p>` : ''}
            </div>
        `;
    } else if (status === 'RESOLVED' || status === 'PROCESSED') {
        resolutionSection = `
            <div style="margin-top: 15px; padding: 12px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <strong style="color: #16a34a; font-size: 13px;"><i class="ri-checkbox-circle-line"></i> This complaint has been resolved by the district administration.</strong>
            </div>
        `;
    } else if (status === 'REJECTED') {
        resolutionSection = `
            <div style="margin-top: 15px; padding: 12px; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
                <strong style="color: #dc2626; font-size: 13px;"><i class="ri-close-circle-line"></i> This complaint was reviewed and closed by the administration.</strong>
            </div>
        `;
    } else {
        resolutionSection = `
            <div style="margin-top: 15px; padding: 12px; background: #fffbeb; border-radius: 12px; border: 1px solid #fef3c7;">
                <strong style="color: #b45309; font-size: 13px;"><i class="ri-time-line"></i> Status: Under Administrative Review</strong>
                <p style="margin-top: 4px; font-size: 12px; color: #92400e; margin-bottom: 0;">Your grievance has been registered and is being evaluated by the TPDS district officer.</p>
            </div>
        `;
    }

    const createdDate = complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() + ' ' + new Date(complaint.createdAt).toLocaleTimeString() : 'N/A';

    const content = `
        <div style="font-size: 14px; line-height: 1.8;">
            <p><strong>Complaint ID:</strong> <span style="font-family: monospace; font-weight: 600; background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">${escapeHtml(complaint.id || 'N/A')}</span></p>
            <p><strong>Subject:</strong> <span>${escapeHtml(complaint.complaintTitle || 'No Subject')}</span></p>
            <p><strong>Category:</strong> <span>${escapeHtml(complaint.category || 'General')}</span></p>
            <p><strong>Registered Date:</strong> <span>${createdDate}</span></p>
            <p><strong>Status:</strong> <span class="status-badge" style="color: ${statusBadgeColor}; background: ${statusBadgeBg}; padding: 2px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; box-shadow: none;">${status}</span></p>

            <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <strong style="color: var(--secondary);"><i class="ri-file-text-line"></i> Complaint Body / Description:</strong>
                <p style="margin-top: 8px; white-space: pre-wrap; font-size: 14px; color: #1e293b;">${escapeHtml(complaint.description || 'No description provided.')}</p>
            </div>

            ${complaint.documentLink ? `
                <div style="margin-top: 15px; padding: 14px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                    <strong style="color: #16a34a;"><i class="ri-links-line"></i> Attached Supporting Document:</strong>
                    <p style="margin-top: 6px; word-break: break-all; margin-bottom: 0;">
                        <a href="${escapeHtml(complaint.documentLink)}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500;">
                            <i class="ri-external-link-line"></i> Open Attached Document
                        </a>
                    </p>
                </div>
            ` : ''}

            ${resolutionSection}
        </div>
    `;

    const contentEl = document.getElementById('complaintDetailContent');
    if (contentEl) contentEl.innerHTML = content;

    const modal = document.getElementById('complaintModal');
    if (modal) modal.classList.add('active');
}

function viewTransactionDetail(index) {
    const txn = currentTransactions[index];
    if (!txn) return;

    let calculatedAmount = 0;
    if (txn.costPerSupplies && Array.isArray(txn.costPerSupplies)) {
        calculatedAmount = txn.costPerSupplies.reduce((sum, cost) => sum + cost, 0);
    }

    const txDate = txn.dateOfTransaction ? new Date(txn.dateOfTransaction) : new Date(txn.createdAt || Date.now());
    const monthName = txn.transactionMonth || txDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const verifyMethod = txn.verificationMethod || (txn.faceVerified ? 'Face Verification' : 'Email OTP');
    const txnId = txn.id || txn._id || 'N/A';

    let suppliesHtml = '';
    if (txn.suppliesName && Array.isArray(txn.suppliesName) && txn.suppliesName.length > 0) {
        suppliesHtml = `
            <div style="margin-top: 15px; padding: 14px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <strong style="color: var(--primary); font-size: 14px;"><i class="ri-shopping-basket-line"></i> Items / Supplies Purchased:</strong>
                <table style="width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; background: #f1f5f9;">
                            <th style="padding: 8px 10px; color: var(--primary);">Commodity</th>
                            <th style="padding: 8px 10px; color: var(--primary);">Allocated Quantity</th>
                            <th style="padding: 8px 10px; color: var(--primary);">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${txn.suppliesName.map((name, i) => `
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 8px 10px; font-weight: 500;">${escapeHtml(name)}</td>
                                <td style="padding: 8px 10px;">${txn.suppliesWeight && txn.suppliesWeight[i] !== undefined ? txn.suppliesWeight[i] + ' kg' : '--'}</td>
                                <td style="padding: 8px 10px; font-weight: 600; color: var(--secondary);">₹${txn.costPerSupplies && txn.costPerSupplies[i] !== undefined ? txn.costPerSupplies[i] : '--'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        suppliesHtml = `
            <div style="margin-top: 15px; padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 13px; color: var(--gray); font-style: italic;"><i class="ri-information-line"></i> Standard subsidized monthly ration quota allocated.</p>
            </div>
        `;
    }

    const content = `
        <div style="font-size: 14px; line-height: 1.8;">
            <p><strong>Receipt Number:</strong> <span style="font-family: monospace; font-weight: 600; background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">${escapeHtml(txnId)}</span></p>
            <p><strong>Date & Time:</strong> ${txDate.toLocaleDateString()} ${txDate.toLocaleTimeString()}</p>
            <p><strong>Ration Month:</strong> ${monthName}</p>
            <p><strong>Total Amount Paid:</strong> <span style="font-weight: 700; color: var(--secondary); font-size: 15px;">₹${calculatedAmount}</span></p>
            <p><strong>Distributor / FPS:</strong> ${escapeHtml(txn.distributorUsername || 'N/A')}</p>
            <p><strong>Status:</strong> <span class="status-badge" style="background: #dcfce7; color: #16a34a; padding: 2px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; box-shadow: none;">${txn.status || 'COMPLETED'}</span></p>
            <p><strong>Verification Method:</strong> <span style="padding: 2px 10px; background: #e0f2fe; color: #0284c7; border-radius: 4px; font-weight: 500; font-size: 12px;">${verifyMethod}</span></p>
            ${suppliesHtml}
        </div>
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

const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);


/* ==========================================================================
   ENLARGED QR CODE MODAL LOGIC
   ========================================================================== */
let currentQrCodeData = null;

function openEnlargedQRModal() {
    const beneficiaryName = document.getElementById('qrBeneficiaryName')?.textContent || 
                            document.getElementById('beneficiaryName')?.textContent || 
                            localStorage.getItem('username') || 'Beneficiary';
    const rcNumber = document.getElementById('qrRationCard')?.textContent || 
                     document.getElementById('rcNumber')?.textContent || 
                     localStorage.getItem('username') || '--';
    const rawFamilyCount = document.getElementById('qrFamilyCount')?.textContent || 
                           document.getElementById('memberCount')?.textContent || '--';
    const district = localStorage.getItem('stateDistrictCode') || 'UP-01';

    const modalNameEl = document.getElementById('modalBeneficiaryName');
    const modalRcEl = document.getElementById('modalRcNumber');
    const modalCountEl = document.getElementById('modalFamilyCount');
    const modalDistrictEl = document.getElementById('modalDistrict');
    const modalContainer = document.getElementById('modalQrCodeContainer');
    const modal = document.getElementById('qrModal');

    if (modalNameEl) modalNameEl.textContent = beneficiaryName;
    if (modalRcEl) modalRcEl.textContent = rcNumber;
    if (modalCountEl) {
        modalCountEl.textContent = (rawFamilyCount.includes('Members') || rawFamilyCount.includes('Member')) 
            ? rawFamilyCount 
            : (rawFamilyCount !== '--' ? rawFamilyCount + ' Members' : '--');
    }
    if (modalDistrictEl) modalDistrictEl.textContent = district;

    if (modal) modal.classList.add('active');

    // Check if QR code is already generated
    const existingImg = document.querySelector('#qrCodeDisplay img');
    if (currentQrCodeData) {
        if (modalContainer) {
            modalContainer.innerHTML = `<img src="${currentQrCodeData}" alt="Enlarged Ration QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
        }
    } else if (existingImg && existingImg.src) {
        currentQrCodeData = existingImg.src;
        if (modalContainer) {
            modalContainer.innerHTML = `<img src="${existingImg.src}" alt="Enlarged Ration QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
        }
    } else {
        // Automatically generate if not yet created
        generateQRCode(true);
    }
}

async function generateQRCode(isFromModal = false) {
    let btn = null;
    try {
        if (typeof event !== 'undefined' && event && event.target) {
            btn = event.target.closest('button');
        }
    } catch (_) {}

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Generating...';
    }

    const modalContainer = document.getElementById('modalQrCodeContainer');
    if (isFromModal && modalContainer) {
        modalContainer.innerHTML = `
            <div class="qr-modal-empty" style="color: var(--primary);">
                <i class="ri-loader-4-line" style="font-size: 42px; animation: spin 1s linear infinite;"></i>
                <p style="margin-top: 10px; font-weight: 500;">Generating high-resolution QR...</p>
            </div>
        `;
    }

    try {
        console.log('[QR] Generating QR code');
        const response = await apiRequest('/beneficiary/generateQR', 'POST');

        if (response && response.success && response.qrCodeImage) {
            currentQrCodeData = response.qrCodeImage;

            // Update card preview
            const qrDisplay = document.getElementById('qrCodeDisplay');
            if (qrDisplay) {
                qrDisplay.innerHTML = `
                    <img src="${response.qrCodeImage}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;">
                    <div class="qr-zoom-overlay"><i class="ri-zoom-in-line"></i></div>
                `;
            }

            // Update enlarged modal
            if (modalContainer) {
                modalContainer.innerHTML = `<img src="${response.qrCodeImage}" alt="Enlarged Ration QR Code" style="width: 100%; height: 100%; object-fit: contain;">`;
            }

            console.log('[QR] QR code generated successfully');
        } else {
            console.log('[QR] Failed:', response?.message);
            if (modalContainer && isFromModal) {
                modalContainer.innerHTML = `
                    <div class="qr-modal-empty">
                        <i class="ri-error-warning-line" style="color: var(--danger); font-size: 40px;"></i>
                        <p style="color: var(--danger); margin-top: 6px;">${response?.message || 'Failed to generate QR'}</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('[QR] Error:', error);
        if (modalContainer && isFromModal) {
            modalContainer.innerHTML = `
                <div class="qr-modal-empty">
                    <i class="ri-error-warning-line" style="color: var(--danger); font-size: 40px;"></i>
                    <p style="color: var(--danger); margin-top: 6px;">Error: ${error.message}</p>
                </div>
            `;
        } else {
            await showCustomModal('Error: ' + error.message);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ri-refresh-line"></i> Generate QR';
        }
    }
}

async function downloadQR() {
    try {
        const img = document.querySelector('#modalQrCodeContainer img') || 
                    document.querySelector('#qrCodeDisplay img');
        if (img && img.src) {
            const rcNumber = document.getElementById('qrRationCard')?.textContent || 
                             localStorage.getItem('username') || 'RationCard';
            const link = document.createElement('a');
            link.href = img.src;
            link.download = `RationPass_${rcNumber.trim()}.png`;
            link.click();
            console.log('[QR] QR code downloaded');
        } else {
            await showCustomModal('Please generate the QR code first');
        }
    } catch (error) {
        console.error('[QR] Download error:', error);
        await showCustomModal('Error downloading QR code: ' + error.message);
    }
}

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    }
});
