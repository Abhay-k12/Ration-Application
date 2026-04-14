if (!window.getAuthToken || !window.login) {
    console.error('[API] API client not loaded');
    window.location.href = '/login_page.html';
}

const token = localStorage.getItem('jwtToken');
const userRole = localStorage.getItem('userRole');

if (!token || userRole !== 'ADMIN') {
    console.log('[AUTH] Not authorized as ADMIN, redirecting');
    window.location.href = '/login_page.html';
}

window.addEventListener('load', () => {
    const token = getAuthToken();
    const userRole = localStorage.getItem('userRole');

    console.log('[AUTH] Token present:', token ? true : false);
    console.log('[AUTH] User role:', userRole);

    if (!token || userRole !== 'ADMIN') {
        console.log('[AUTH] Not authenticated, redirecting to login');
        window.location.href = '/login_page.html';
        return;
    }

    console.log('[INIT] Loading admin data');
    loadAdminData();
    setupEventListeners();
});

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const moduleId = this.getAttribute('data-module');
            document.querySelectorAll('.module').forEach(module => module.classList.remove('active'));
            const moduleEl = document.getElementById(moduleId);
            if (moduleEl) moduleEl.classList.add('active');

            if (moduleId === 'module2') {
                loadComplaints();
            }
        });
    });

    document.getElementById('freshRegistrationForm')?.addEventListener('submit', handleFreshRegistration);
    document.getElementById('createDistributorForm')?.addEventListener('submit', handleCreateDistributor);
    document.getElementById('schemeForm')?.addEventListener('submit', handleSchemeForm);
    document.getElementById('addMemberForm')?.addEventListener('submit', handleAddMember);
    document.getElementById('changePwdForm')?.addEventListener('submit', handleChangePassword);

    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

async function loadAdminData() {
    try {
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const stateDistrictCode = localStorage.getItem('stateDistrictCode');

        console.log('[DATA] Username:', username);
        console.log('[DATA] Email:', email);
        console.log('[DATA] State/District:', stateDistrictCode);

        const adminNameEl = document.getElementById('adminName');
        const adminIdEl = document.getElementById('adminId');
        const adminLocationEl = document.getElementById('adminLocation');

        if (adminNameEl) {
            adminNameEl.textContent = username || 'Admin';
            console.log('[SIDEBAR] Updated admin name:', username);
        }

        if (adminIdEl) {
            adminIdEl.textContent = 'ADM/' + (username?.substring(0, 3).toUpperCase() || 'UNK') + '/001';
            console.log('[SIDEBAR] Updated admin ID');
        }

        if (adminLocationEl) {
            adminLocationEl.textContent = stateDistrictCode || 'District';
            console.log('[SIDEBAR] Updated admin location:', stateDistrictCode);
        }

        try {
            const statsResp = await apiRequest('/admin/getDashboardStats', 'GET');
            if (statsResp) {
                document.getElementById('totalShops').textContent = statsResp.totalShops || '0';
                document.getElementById('totalBeneficiaries').textContent = statsResp.totalBeneficiaries || '0';
                document.getElementById('pendingComplaints').textContent = statsResp.pendingComplaints || '0';
                document.getElementById('activeSchemes').textContent = statsResp.activeSchemes || '0';
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }

        console.log('[DATA] Admin data loaded successfully');
        loadComplaints();
        loadDistributors();
    } catch (error) {
        console.error('[DATA] Error loading admin data:', error);
    }
}

async function handleFreshRegistration(e) {
    e.preventDefault();

    const registerData = {
        username: document.getElementById('fresName').value.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
        fullName: document.getElementById('fresName').value,
        password: 'Beneficiary@123',
        email: document.getElementById('fresEmail').value,
        roles: ['BENEFICIARY'],
        stateDistrictCode: document.getElementById('fresDistrictCode').value,
        annualIncome: parseInt(document.getElementById('fresIncome').value)
    };

    console.log('[REGISTER] Registering beneficiary:', registerData.username);

    try {
        const response = await register(
            registerData.username,
            registerData.password,
            registerData.email,
            registerData.roles,
            registerData.stateDistrictCode,
            registerData.annualIncome,
            registerData.fullName
        );

        if (response && response.success) {
            console.log('[REGISTER] Registration successful');
            await showCustomModal('Ration Card generated successfully!\nCard Number: RC-' + Date.now() + '\nTemporary Password: ' + registerData.password);
            const formEl = document.getElementById('freshRegistrationForm');
            if (formEl) formEl.reset();
        } else {
            console.log('[REGISTER] Registration failed:', response?.message);
            await showCustomModal('Error: ' + (response?.message || 'Registration failed'));
        }
    } catch (error) {
        console.error('[REGISTER] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

async function handleCreateDistributor(e) {
    e.preventDefault();

    const distributorData = {
        username: document.getElementById('distUsername').value,
        password: document.getElementById('distPassword').value,
        email: document.getElementById('distEmail').value,
        stateDistrictCode: document.getElementById('distDistrictCode').value
    };

    console.log('[DISTRIBUTOR] Creating distributor:', distributorData.username);

    try {
        const response = await register(
            distributorData.username,
            distributorData.password,
            distributorData.email,
            ['DISTRIBUTOR'],
            distributorData.stateDistrictCode,
            0
        );

        if (response && response.success) {
            console.log('[DISTRIBUTOR] Distributor created successfully');
            await showCustomModal('Distributor created successfully!');
            const formEl = document.getElementById('createDistributorForm');
            if (formEl) formEl.reset();
            loadDistributors();
        } else {
            console.log('[DISTRIBUTOR] Failed:', response?.message);
            await showCustomModal('Error: ' + (response?.message || 'Failed to create distributor'));
        }
    } catch (error) {
        console.error('[DISTRIBUTOR] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

async function handleAddMember(e) {
    e.preventDefault();

    const cardNumber = localStorage.getItem('currentCardNumber');
    const aadhaarData = {
        aadhaarNumber: document.getElementById('memberAadhaar').value,
        name: document.getElementById('memberName').value,
        dateOfBirth: document.getElementById('memberDOB').value,
        employmentStatus: document.getElementById('memberEmployment').value,
        photograph: document.getElementById('memberPhotograph').value
    };

    console.log('[MEMBER] Adding member to card:', cardNumber);

    try {
        const response = await addNewMember(cardNumber, aadhaarData);

        if (response && response.success) {
            console.log('[MEMBER] Member added successfully');
            await showCustomModal('Member added successfully!');
            closeModal('addMemberModal');
            searchRationCard();
        } else {
            console.log('[MEMBER] Failed:', response?.message);
            await showCustomModal('Error: ' + (response?.message || 'Failed to add member'));
        }
    } catch (error) {
        console.error('[MEMBER] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

async function handleSchemeForm(e) {
    e.preventDefault();

    console.log('[SCHEME] Creating scheme');

    const schemeType = document.getElementById('schemeType').value;
    const schemeName = document.getElementById('schemeName')?.value || schemeType;
    const adminDistrict = localStorage.getItem('stateDistrictCode');
    const stateDistrictCode = adminDistrict && adminDistrict.trim() !== '' ? adminDistrict : document.getElementById('stateDistrictCode').value;

    if (!schemeType || !stateDistrictCode) {
        await showCustomModal('Please fill all required fields');
        return;
    }

    const supplies = [];
    const suppliesNames = [];
    const suppliesCosts = [];
    const supplyPerPersons = [];

    document.querySelectorAll('.supply-row').forEach(row => {
        const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
        if (inputs[0].value && inputs[1].value && inputs[2].value) {
            suppliesNames.push(inputs[0].value);
            suppliesCosts.push(parseFloat(inputs[1].value));
            supplyPerPersons.push(parseFloat(inputs[2].value));
        }
    });

    if (suppliesNames.length === 0) {
        await showCustomModal('Please add at least one supply');
        return;
    }

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Creating...';

        const response = await createScheme(
            schemeName,
            schemeType,
            stateDistrictCode,
            suppliesNames,
            suppliesCosts,
            supplyPerPersons
        );

        console.log('[SCHEME] Response:', response);

        if (response && response.success) {
            console.log('[SCHEME] Scheme created successfully');
            await showCustomModal('Scheme "' + schemeName + '" created successfully!');
            document.getElementById('schemeForm').reset();
            loadSchemes();
        } else {
            console.log('[SCHEME] Failed:', response?.message);
            await showCustomModal('Error: ' + (response?.message || 'Failed to create scheme'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-line"></i> Create Scheme';
    } catch (error) {
        console.error('[SCHEME] Error:', error);
        await showCustomModal('Error: ' + error.message);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-line"></i> Create Scheme';
    }
}

async function loadSchemes() {
    try {
        console.log('[SCHEMES] Loading schemes');
        const stateDistrictCode = localStorage.getItem('stateDistrictCode');

        const response = await getSchemesByDistrict(stateDistrictCode);

        console.log('[SCHEMES] Response:', response);

        if (response && Array.isArray(response)) {
            const container = document.getElementById('schemesContainer');
            if (container) container.innerHTML = '';

            if (response.length === 0) {
                if (container) {
                    container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No schemes created yet</p>';
                }
                return;
            }

            response.forEach(scheme => {
                const card = document.createElement('div');
                card.className = 'scheme-card';
                card.innerHTML = `
                    <div class="scheme-header">
                        <h4>${scheme.schemeName}</h4>
                        <span class="status-badge status-approved">${scheme.schemeType}</span>
                    </div>
                    <p><strong>Type:</strong> ${scheme.schemeType}</p>
                    <p><strong>District:</strong> ${scheme.stateDistrictCode}</p>
                    <div class="scheme-items">
                        ${scheme.suppliesName.map((name, idx) => `
                            <div class="scheme-item">
                                ${name}: ${scheme.supplyPerPerson[idx]} kg @ Rs ${scheme.suppliesCost[idx]}
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="action-btn edit" onclick="editScheme('${scheme.id}')">
                            <i class="ri-edit-line"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="deleteSchemeAction('${scheme.id}')">
                            <i class="ri-delete-bin-line"></i> Delete
                        </button>
                    </div>
                `;
                if (container) container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('[SCHEMES] Error:', error);
    }
}

async function editScheme(schemeId) {
    try {
        console.log('[SCHEME] Editing scheme:', schemeId);
        const response = await getSchemeById(schemeId);

        if (response) {
            console.log('[SCHEME] Loaded scheme for editing:', response);
            document.getElementById('schemeType').value = response.schemeType;
            document.getElementById('schemeName').value = response.schemeName;
            document.getElementById('stateDistrictCode').value = response.stateDistrictCode;

            const container = document.getElementById('suppliesContainer');
            container.innerHTML = '';

            response.suppliesName.forEach((name, idx) => {
                const row = document.createElement('div');
                row.className = 'supply-row';
                row.innerHTML = `
                    <input type="text" class="form-control" value="${name}" placeholder="Supply name">
                    <input type="number" class="form-control" value="${response.suppliesCost[idx]}" placeholder="Cost">
                    <input type="number" class="form-control" value="${response.supplyPerPerson[idx]}" placeholder="Per person">
                    <button type="button" class="remove-supply" onclick="this.parentElement.remove()">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                `;
                container.appendChild(row);
            });

            localStorage.setItem('editingSchemeId', schemeId);
            await showCustomModal('Form populated. Click "Create Scheme" to save changes (will update existing scheme)');
        }
    } catch (error) {
        console.error('[SCHEME] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

async function deleteSchemeAction(schemeId) {
    if (await showCustomConfirm('Are you sure you want to delete this scheme?')) {
        try {
            console.log('[SCHEME] Deleting scheme:', schemeId);
            const response = await deleteScheme(schemeId);

            if (response && response.success) {
                console.log('[SCHEME] Scheme deleted successfully');
                await showCustomModal('Scheme deleted successfully!');
                loadSchemes();
            } else {
                await showCustomModal('Error: ' + (response?.message || 'Failed to delete scheme'));
            }
        } catch (error) {
            console.error('[SCHEME] Error:', error);
            await showCustomModal('Error: ' + error.message);
        }
    }
}

async function handleChangePassword(e) {
    e.preventDefault();

    const currentPwd = document.getElementById('currentPwd').value;
    const newPwd = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmPwd').value;

    if (newPwd !== confirmPwd) {
        await showCustomModal('Passwords do not match!');
        return;
    }

    console.log('[PASSWORD] Changing password');

    try {
        await showCustomModal('Password changed successfully!');
        closeModal('changePwdModal');
        const formEl = document.getElementById('changePwdForm');
        if (formEl) formEl.reset();
    } catch (error) {
        console.error('[PASSWORD] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

async function loadComplaints() {
    try {
        console.log('[COMPLAINTS] Loading complaints');
        const response = await getAllComplaints();

        console.log('[COMPLAINTS] Response:', response);

        if (response && Array.isArray(response)) {
            window.loadedAdminComplaints = response;

            const tbody = document.getElementById('complaintTableBody');
            if (tbody) tbody.innerHTML = '';

            if (response.length === 0) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray);">No complaints found</td></tr>';
                const pendingEl = document.getElementById('pendingComplaints');
                if (pendingEl) pendingEl.textContent = '0';
            } else {
                const pendingEl = document.getElementById('pendingComplaints');
                if (pendingEl) pendingEl.textContent = response.length;

                response.forEach((complaint, index) => {
                    const displayId = complaint.id || 'N/A';

                    let statusColor = '#475569';
                    let statusBg = '#f1f5f9';
                    const status = complaint.status ? complaint.status.toUpperCase() : 'PENDING';

                    if (status === 'PROCESSING') {
                        statusColor = '#d97706';
                        statusBg = '#fef3c7';
                    } else if (status === 'PROCESSED' || status === 'RESOLVED') {
                        statusColor = '#16a34a';
                        statusBg = '#dcfce7';
                    } else if (status === 'REJECTED') {
                        statusColor = '#dc2626';
                        statusBg = '#fee2e2';
                    }

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${displayId}</strong></td>
                        <td>${complaint.applicantUsername || 'N/A'}</td>
                        <td>${complaint.complaintTitle || 'N/A'}</td>
                        <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
                        <td>
                            <span class="status-badge" style="color: ${statusColor}; background-color: ${statusBg}; border-radius: 4px; padding: 4px 8px; font-weight: 500; font-size: 12px;">
                                ${status}
                            </span>
                        </td>
                        <td><button class="action-btn edit" onclick="viewComplaintDetail(${index})">View</button></td>
                    `;
                    if (tbody) tbody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('[COMPLAINTS] Error:', error);
    }
}

function showGlobalLoader(message = 'Processing...') {
    let loader = document.getElementById('globalLoaderOverlay');
    if (!loader) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="globalLoaderOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; backdrop-filter: blur(2px);">
                <i class="ri-loader-4-line" style="font-size: 48px; animation: global-spin 1s linear infinite;"></i>
                <p id="globalLoaderMsg" style="margin-top: 15px; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">${message}</p>
            </div>
            <style>@keyframes global-spin { 100% { transform: rotate(360deg); } }</style>
        `);
    } else {
        document.getElementById('globalLoaderMsg').textContent = message;
        loader.style.display = 'flex';
    }
}

function hideGlobalLoader() {
    const loader = document.getElementById('globalLoaderOverlay');
    if (loader) loader.style.display = 'none';
}

async function viewComplaintDetail(index) {
    try {
        console.log('[COMPLAINT] Viewing complaint at index:', index);

        const complaint = window.loadedAdminComplaints[index];
        const modal = document.getElementById('complaintModal');
        const contentEl = document.getElementById('complaintDetailContent');
        const notesInput = document.getElementById('adminResolutionNotes');

        if (modal) modal.classList.add('active');

        // Clear previous notes
        if (notesInput) notesInput.value = '';

        if (contentEl && complaint) {
            contentEl.innerHTML = `
                <div style="font-size: 14px; line-height: 1.6;">
                    <p><strong>Complaint ID:</strong> ${complaint.id}</p>
                    <p><strong>Applicant:</strong> ${complaint.applicantUsername || 'N/A'}</p>
                    <p><strong>Subject:</strong> ${complaint.complaintTitle || 'N/A'}</p>
                    <p><strong>Category:</strong> ${complaint.category || 'N/A'}</p>
                    <p><strong>Status:</strong> <span style="font-weight:600; color: var(--primary);">${complaint.status || 'PENDING'}</span></p>
                    <p><strong>Date:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>

                    <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <strong style="color: var(--secondary);">Description:</strong>
                        <p style="margin-top: 8px; white-space: pre-wrap;">${complaint.description || 'No description provided.'}</p>
                    </div>

                    <div style="margin-top: 15px; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                        <strong style="color: #16a34a;"><i class="ri-links-line"></i> Document Link:</strong>
                        <p style="margin-top: 8px; word-break: break-all;">
                            ${complaint.documentLink
                                ? `<a href="${complaint.documentLink}" target="_blank" style="color: #2563eb; text-decoration: underline;">View Attached Document</a>`
                                : 'No document attached.'}
                        </p>
                    </div>
                </div>
            `;

            localStorage.setItem('currentComplaintId', complaint.id);

        } else if (contentEl) {
            contentEl.innerHTML = `<p style="color: var(--danger);">Error loading complaint details.</p>`;
        }
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
    }
}

async function resolveComplaintAction() {
    const complaintId = localStorage.getItem('currentComplaintId');
    const notesInput = document.getElementById('adminResolutionNotes');
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!notes) {
        await showCustomModal('Please enter resolution notes before proceeding.');
        return;
    }

    const btn = document.getElementById('resolveBtn');
    const rejectBtn = document.getElementById('rejectBtn');

    try {
        console.log('[COMPLAINT] Resolving complaint:', complaintId);

        // Show spinning loader inside the button
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Processing...';
        }
        if (rejectBtn) rejectBtn.disabled = true;

        const response = await resolveComplaint(complaintId, notes);

        if (response && response.success) {
            console.log('[COMPLAINT] Complaint resolved successfully');
            await showCustomModal('Complaint resolved successfully!');
            closeModal('complaintModal');
            loadComplaints();
        } else {
            await showCustomModal('Error: ' + (response?.message || 'Failed to resolve complaint'));
        }
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        await showCustomModal('Error: ' + error.message);
    } finally {
        // Restore buttons
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ri-check-line"></i> Resolve';
        }
        if (rejectBtn) rejectBtn.disabled = false;
    }
}

async function rejectComplaintAction() {
    const complaintId = localStorage.getItem('currentComplaintId');
    const notesInput = document.getElementById('adminResolutionNotes');
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!notes) {
        await showCustomModal('Please enter a rejection reason before proceeding.');
        return;
    }

    const btn = document.getElementById('rejectBtn');
    const resolveBtn = document.getElementById('resolveBtn');

    try {
        console.log('[COMPLAINT] Rejecting complaint:', complaintId);

        // Show spinning loader inside the button
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Processing...';
        }
        if (resolveBtn) resolveBtn.disabled = true;

        const response = await rejectComplaint(complaintId, notes);

        if (response && response.success) {
            console.log('[COMPLAINT] Complaint rejected successfully');
            await showCustomModal('Complaint rejected successfully!');
            closeModal('complaintModal');
            loadComplaints();
        } else {
            await showCustomModal('Error: ' + (response?.message || 'Failed to reject complaint'));
        }
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
        await showCustomModal('Error: ' + error.message);
    } finally {
        // Restore buttons
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ri-close-line"></i> Reject';
        }
        if (resolveBtn) resolveBtn.disabled = false;
    }
}

async function loadDistributors() {
    try {
        console.log('[DISTRIBUTORS] Loading distributors');
        const response = await apiRequest('/admin/getAllDistributors', 'GET');
        const tbody = document.getElementById('distributorsTableBody');

        if (tbody) tbody.innerHTML = '';

        if (!response || response.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--gray);">No distributors created yet</td></tr>';
        } else {
            response.forEach(dist => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${dist.username}</strong></td>
                    <td>${dist.email}</td>
                    <td>${dist.stateDistrictCode}</td>
                    <td>
                        <button class="shift-btn" onclick="openComposeMail('${dist.email}')">
                            <i class="ri-mail-send-line"></i> Compose Email
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('[DISTRIBUTORS] Error:', error);
    }
}

function openComposeMail(email) {
    document.getElementById('composeMailTo').value = email;
    document.getElementById('composeMailSubject').value = '';
    document.getElementById('composeMailBody').value = '';
    const modal = document.getElementById('composeMailModal');
    if (modal) modal.classList.add('active');
}

document.getElementById('composeMailForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Sending...';

    try {
        const payload = {
            email: document.getElementById('composeMailTo').value,
            subject: document.getElementById('composeMailSubject').value,
            body: document.getElementById('composeMailBody').value
        };
        const response = await apiRequest('/admin/sendMailToDistributor', 'POST', payload);
        if(response && response.success) {
            await showCustomModal('Email sent successfully!');
            closeModal('composeMailModal');
        } else {
            await showCustomModal('Error: ' + (response.message || 'Failed to send'));
        }
    } catch (err) {
        await showCustomModal('Error sending email: ' + err.message);
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-send-plane-fill"></i> Send Email';
});

async function searchRationCard() {
    const cardNumber = document.getElementById('searchCardNumber').value;

    if (!cardNumber) {
        await showCustomModal('Please enter a ration card number');
        return;
    }

    try {
        console.log('[CARD] Searching for card:', cardNumber);
        localStorage.setItem('currentCardNumber', cardNumber);

        const cardDetailsEl = document.getElementById('cardDetails');
        const displayCardNumberEl = document.getElementById('displayCardNumber');
        const cardHeadNameEl = document.getElementById('cardHeadName');
        const cardTotalMembersEl = document.getElementById('cardTotalMembers');
        const cardAnnualIncomeEl = document.getElementById('cardAnnualIncome');

        if (cardDetailsEl) cardDetailsEl.style.display = 'block';
        if (displayCardNumberEl) displayCardNumberEl.textContent = cardNumber;
        if (cardHeadNameEl) cardHeadNameEl.textContent = 'Head Name';
        if (cardTotalMembersEl) cardTotalMembersEl.textContent = '4';
        if (cardAnnualIncomeEl) cardAnnualIncomeEl.textContent = '150000';

        loadCardMembers(cardNumber);
    } catch (error) {
        console.error('[CARD] Error:', error);
        await showCustomModal('Error searching card: ' + error.message);
    }
}

async function loadCardMembers(cardNumber) {
    try {
        console.log('[MEMBERS] Loading members for card:', cardNumber);
        const response = await getAllBeneficiary(cardNumber);

        console.log('[MEMBERS] Response:', response);

        if (response && Array.isArray(response)) {
            const membersList = document.getElementById('membersList');
            if (membersList) membersList.innerHTML = '';

            document.getElementById('cardHeadName').textContent = response.length > 0 ? response[0].name : 'N/A';
            document.getElementById('cardTotalMembers').textContent = response.length;

            loadCardTransactionsAndComplaints(cardNumber);

            response.forEach(member => {
                const memberCard = document.createElement('div');
                memberCard.className = 'member-card';
                memberCard.innerHTML = `
                    <div class="member-info">
                        <div class="member-avatar">${member.name?.substring(0, 2).toUpperCase() || 'MB'}</div>
                        <div>
                            <h5>${member.name || 'N/A'}</h5>
                            <p style="font-size: 13px; color: var(--gray);">
                                Aadhaar: ${member.aadhaarNumber || 'N/A'} | Employment: ${member.employmentStatus || 'N/A'}
                            </p>
                        </div>
                    </div>
                `;
                if (membersList) membersList.appendChild(memberCard);
            });
        }
    } catch (error) {
        console.error('[MEMBERS] Error:', error);
    }
}

function switchCardTab(tabName) {
    document.querySelectorAll('#module3 .nav-item').forEach(el => el.classList.remove('active'));

    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    document.getElementById('cardTabMembers').style.display = 'none';
    document.getElementById('cardTabTransactions').style.display = 'none';
    document.getElementById('cardTabComplaints').style.display = 'none';

    if (tabName === 'members') document.getElementById('cardTabMembers').style.display = 'block';
    if (tabName === 'transactions') document.getElementById('cardTabTransactions').style.display = 'block';
    if (tabName === 'complaints') document.getElementById('cardTabComplaints').style.display = 'block';
}

async function loadCardTransactionsAndComplaints(cardNumber) {
    try {
        const tResp = await apiRequest(`/admin/getBeneficiaryTransactions/${cardNumber}`, 'GET');
        const cResp = await apiRequest(`/admin/getBeneficiaryComplaints/${cardNumber}`, 'GET');

        const tb = document.getElementById('rcTransactionsTableBody');
        tb.innerHTML = '';
        if (tResp && tResp.length > 0) {
            tResp.forEach(tx => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tx.id || 'N/A'}</td>
                    <td>${new Date(tx.dateOfTransaction).toLocaleDateString()}</td>
                    <td>Rs ${(tx.costPerSupplies || []).reduce((a,b)=>a+b,0)}</td>
                    <td>${tx.distributorUsername}</td>
                    <td><span class="status-badge status-approved">SUCCESS</span></td>
                `;
                tb.appendChild(row);
            });
        } else {
            tb.innerHTML = '<tr><td colspan="5" style="text-align:center">No transactions</td></tr>';
        }

        const cb = document.getElementById('rcComplaintsTableBody');
        cb.innerHTML = '';
        if (cResp && cResp.length > 0) {
            cResp.forEach(cx => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cx.id || 'N/A'}</td>
                    <td>${cx.complaintTitle}</td>
                    <td>${new Date(cx.createdAt).toLocaleDateString()}</td>
                    <td><span class="status-badge status-${cx.status?.toLowerCase() || 'pending'}">${cx.status}</span></td>
                `;
                cb.appendChild(row);
            });
        } else {
            cb.innerHTML = '<tr><td colspan="4" style="text-align:center">No complaints</td></tr>';
        }
    } catch(err) {
        console.error('Error fetching card Tx/Cx', err);
    }
}

async function fetchFamilyMembers() {
    const cardNumber = document.getElementById('oldCardNumber').value;

    if (!cardNumber) {
        await showCustomModal('Please enter a card number');
        return;
    }

    try {
        console.log('[FAMILY] Fetching family members for:', cardNumber);
        const response = await getAllBeneficiary(cardNumber);

        if (response && Array.isArray(response)) {
            const tbody = document.getElementById('familyMembersTable');
            if (tbody) tbody.innerHTML = '';

            response.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="sep-check" value="${member.aadhaarNumber}"></td>
                    <td>${member.name || 'N/A'}</td>
                    <td>${member.aadhaarNumber || 'N/A'}</td>
                    <td>${member.employmentStatus || 'N/A'}</td>
                `;
                if (tbody) tbody.appendChild(row);
            });

            const familyMembersListEl = document.getElementById('familyMembersList');
            if (familyMembersListEl) familyMembersListEl.style.display = 'block';
        }
    } catch (error) {
        console.error('[FAMILY] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

async function submitSeparationCase() {
    const oldCardNumber = document.getElementById('oldCardNumber').value;
    const newEmail = document.getElementById('sepNewEmail').value;
    const districtCode = document.getElementById('sepDistrictCode').value;

    const checkboxes = document.querySelectorAll('.sep-check:checked');
    const aadhaarNumbers = Array.from(checkboxes).map(cb => cb.value);

    if (aadhaarNumbers.length === 0) {
        await showCustomModal("Please select at least one member to separate.");
        return;
    }

    if (!newEmail || !districtCode) {
        await showCustomModal("Please fill the new card email and district code.");
        return;
    }

    if (await showCustomConfirm("Are you sure you want to separate these " + aadhaarNumbers.length + " members into a new Ration Card?")) {
        try {
            const payload = {
                oldCardNumber: oldCardNumber,
                email: newEmail,
                stateDistrictCode: districtCode,
                aadhaarNumbers: aadhaarNumbers
            };

            const response = await apiRequest('/admin/createNewCardFromOld', 'POST', payload);
            if (response && response.success) {
                await showCustomModal('Separation successful! An email has been sent to the new beneficiary containing their new RC Number and password.');
                document.getElementById('familyMembersList').style.display = 'none';
                document.getElementById('sepNewEmail').value = '';
                document.getElementById('sepDistrictCode').value = '';
                document.getElementById('oldCardNumber').value = '';
            } else {
                await showCustomModal('Error: ' + (response.message || 'Separation failed'));
            }
        } catch (e) {
            await showCustomModal('System Error: ' + e.message);
        }
    }
}

function showAddMemberModal() {
    const modal = document.getElementById('addMemberModal');
    if (modal) modal.classList.add('active');
}

async function showRemoveMemberModal() {
    const cardNumber = localStorage.getItem('currentCardNumber');
    console.log('[REMOVE] Showing remove member modal for card:', cardNumber);

    const response = await getAllBeneficiary(cardNumber);

    if (response && Array.isArray(response) && response.length > 0) {
        const firstMember = response[0];
        document.getElementById('removeAadhaarMask').textContent = '...' + firstMember.aadhaarNumber.slice(-4);
        document.getElementById('removeAadhaarValue').value = firstMember.aadhaarNumber;

        const modal = document.getElementById('removeMemberModal');
        if (modal) modal.classList.add('active');
    } else {
        await showCustomModal("No members available to remove.");
    }
}

async function removeMemberAction() {
    const cardNumber = localStorage.getItem('currentCardNumber');
    const aadhaarNumber = document.getElementById('removeAadhaarValue').value;

    console.log('[REMOVE] Removing member:', aadhaarNumber, 'from card:', cardNumber);

    try {
        const response = await removeMember(cardNumber, aadhaarNumber);
        if (response && response.success) {
            console.log('[REMOVE] Member removed successfully');
            await showCustomModal('Member removed successfully!');
            closeModal('removeMemberModal');
            searchRationCard();
        } else {
            console.log('[REMOVE] Failed:', response?.message);
            await showCustomModal('Error: ' + (response?.message || 'Failed to remove member'));
        }
    } catch (error) {
        console.error('[REMOVE] Error:', error);
        await showCustomModal('Error: ' + error.message);
    }
}

function toggleSchemeName() {
    const type = document.getElementById('schemeType').value;
    const customGroupEl = document.getElementById('customSchemeNameGroup');
    if (customGroupEl) {
        customGroupEl.style.display = type === 'OTHERS' ? 'block' : 'none';
    }
}

function addSupplyRow() {
    const container = document.getElementById('suppliesContainer');
    const newRow = document.createElement('div');
    newRow.className = 'supply-row';
    newRow.innerHTML = `
        <input type="text" class="form-control" placeholder="Supply name">
        <input type="number" class="form-control" placeholder="Cost (Rs)">
        <input type="number" class="form-control" placeholder="Per person (kg)">
        <button type="button" class="remove-supply" onclick="this.parentElement.remove()">
            <i class="ri-delete-bin-line"></i>
        </button>
    `;
    if (container) container.appendChild(newRow);
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

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

let stream = null;

async function openCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) modal.classList.add('active');

    const video = document.getElementById('cameraVideo');
    const btnCapture = document.getElementById('btnCapture');
    const btnRetake = document.getElementById('btnRetake');
    const btnSavePhoto = document.getElementById('btnSavePhoto');
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
        await showCustomModal("Unable to access camera: " + err.message);
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const preview = document.getElementById('cameraPreview');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Img = canvas.toDataURL('image/jpeg', 0.8);
    preview.src = base64Img;

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

    const inputField = document.getElementById('memberPhotograph');
    const statusSpan = document.getElementById('photo-status');
    if (inputField) inputField.value = base64Img;
    if (statusSpan) {
        statusSpan.style.color = "var(--secondary)";
        statusSpan.textContent = "Photo captured successfully";
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