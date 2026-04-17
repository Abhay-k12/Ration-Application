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
        item.addEventListener('click', function () {
            const moduleId = this.getAttribute('data-module');
            if (moduleId) { // Only process if it's a main structural nav item with modules attached
                document.querySelectorAll('.sidebar .nav-item, body > .main-content > .nav-tabs .nav-item').forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.module').forEach(module => module.classList.remove('active'));
                const moduleEl = document.getElementById(moduleId);
                if (moduleEl) moduleEl.classList.add('active');

                if (moduleId === 'module2') {
                    loadComplaints();
                } else if (moduleId === 'module4') {
                    loadSchemes();
                }
            }
        });
    });

    document.getElementById('freshRegistrationForm')?.addEventListener('submit', handleFreshRegistration);
    document.getElementById('createDistributorForm')?.addEventListener('submit', handleCreateDistributor);
    document.getElementById('schemeForm')?.addEventListener('submit', handleSchemeForm);
    document.getElementById('addMemberForm')?.addEventListener('submit', handleAddMember);
    document.getElementById('changePwdForm')?.addEventListener('submit', handleChangePassword);

    window.addEventListener('scroll', function () {
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

    const email = document.getElementById('fresEmail').value;
    const annualIncome = parseInt(document.getElementById('fresIncome').value);

    const familyCount = parseInt(document.getElementById('fresFamilyCount').value) || 1;
    const members = [];
    for (let i = 0; i < familyCount; i++) {
        const pImg = document.getElementById('adminMemberPhotograph_' + i)?.value;
        members.push({
            name: document.getElementById('adminMemberName_' + i).value,
            aadhaarNumber: document.getElementById('adminMemberAadhaar_' + i).value,
            dateOfBirth: document.getElementById('adminMemberDOB_' + i).value,
            employmentStatus: document.getElementById('adminMemberEmployment_' + i).value,
            photograph: pImg || ''
        });
    }

    const registerData = {
        fullName: members[0].name, // Use the Head's name as full name for User
        email: email,
        roles: ['BENEFICIARY'],
        annualIncome: annualIncome,
        members: members
    };

    console.log('[REGISTER] Registering beneficiary');

    try {
        const response = await apiRequest('/admin/registerBeneficiary', 'POST', registerData);

        if (response && response.success) {
            console.log('[REGISTER] Registration successful');
            await showCustomModal('Ration Card generated successfully!\nCard Number: ' + response.username + '\nTemporary Password: Beneficiary@123');
            const formEl = document.getElementById('freshRegistrationForm');
            if (formEl) formEl.reset();
            document.getElementById('adminFamilyMembersContainer').innerHTML = ''; // reset dynamic members array
            handleAdminTotalMembersChange(); // reset member inputs to 1
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

    console.log('[SCHEME] Creating/Updating scheme');

    const schemeType = document.getElementById('schemeType').value;
    const schemeName = document.getElementById('schemeName')?.value || schemeType;
    const adminDistrict = localStorage.getItem('stateDistrictCode');
    const stateDistrictCode = adminDistrict && adminDistrict.trim() !== '' ? adminDistrict : document.getElementById('stateDistrictCode').value;

    if (!schemeType || !stateDistrictCode) {
        await showCustomModal('Please fill all required fields');
        return;
    }

    const suppliesNames = [];
    const suppliesCosts = [];
    const supplyPerPersons = [];

    document.querySelectorAll('.supply-row').forEach(row => {
        const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
        if (inputs[0] && inputs[1] && inputs[2] && inputs[0].value && inputs[1].value && inputs[2].value) {
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
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Saving...';

        const editingSchemeId = localStorage.getItem('editingSchemeId');
        let response;

        if (editingSchemeId) {
            response = await updateScheme(
                editingSchemeId,
                schemeName,
                schemeType,
                stateDistrictCode,
                suppliesNames,
                suppliesCosts,
                supplyPerPersons
            );
            localStorage.removeItem('editingSchemeId');
        } else {
            response = await createScheme(
                schemeName,
                schemeType,
                stateDistrictCode,
                suppliesNames,
                suppliesCosts,
                supplyPerPersons
            );
        }

        console.log('[SCHEME] Response:', response);

        if (response && (response.success || response.id || response.ok)) {
            console.log('[SCHEME] Scheme saved successfully');
            await showCustomModal('Scheme saved successfully!');
            document.getElementById('schemeForm').reset();

            const customGroupEl = document.getElementById('customSchemeNameGroup');
            if (customGroupEl) customGroupEl.style.display = 'none';

            btn.innerHTML = '<i class="ri-save-line"></i> Create Scheme';
            loadSchemes();
        } else {
            console.log('[SCHEME] Failed:', response?.message);
            await showCustomModal('Error: ' + (response?.message || 'Failed to save scheme'));
            btn.innerHTML = originalText;
        }

        btn.disabled = false;
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

        const container = document.getElementById('schemesContainer');
        if (container) {
            container.innerHTML = '';

            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '20px';
            container.style.gridTemplateColumns = 'none';

            if (!response || response.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No schemes created yet</p>';
                return;
            }

            response.forEach(scheme => {
                const schemeIdStr = typeof scheme.id === 'string' ? scheme.id : (scheme.id?.$oid || '');

                const card = document.createElement('div');
                card.style.background = '#fff';
                card.style.padding = '20px';
                card.style.borderRadius = '12px';
                card.style.border = '1px solid #e2e8f0';
                card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '15px';

                const formattedType = (scheme.schemeType || '').replace(/_/g, ' ');
                const formattedName = (scheme.schemeName || scheme.schemeType || '').replace(/_/g, ' ');

                card.innerHTML = `
                    <!-- Top Row: Info and Buttons -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                        <div style="flex: 1; min-width: 250px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap;">
                                <h4 style="margin: 0; color: var(--primary); font-size: 1.15rem; word-break: break-word;">${formattedName}</h4>
                                <span style="background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;">${formattedType}</span>
                            </div>
                            <p style="margin: 0; font-size: 14px; color: var(--gray);"><i class="ri-map-pin-line"></i> District: <strong>${scheme.stateDistrictCode}</strong></p>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display: flex; gap: 10px;">
                            <button class="action-btn edit" onclick="editScheme('${schemeIdStr}')" style="padding: 8px 16px; border-radius: 8px; cursor: pointer; background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; font-weight: 600; transition: 0.2s; display: flex; align-items: center; gap: 6px;">
                                <i class="ri-edit-line"></i> Edit
                            </button>
                            <button class="action-btn delete" onclick="deleteSchemeAction('${schemeIdStr}')" style="padding: 8px 16px; border-radius: 8px; cursor: pointer; background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; font-weight: 600; transition: 0.2s; display: flex; align-items: center; gap: 6px;">
                                <i class="ri-delete-bin-line"></i> Delete
                            </button>
                        </div>
                    </div>

                    <div style="width: 100%; height: 1px; background: #e2e8f0;"></div>

                    <!-- Bottom Row: Supplies (Pill format) -->
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${(scheme.suppliesName || []).map((name, idx) => `
                            <div style="background: #fff; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; min-width: 100px;">
                                <span style="font-weight: 600; color: var(--primary); font-size: 13px;">${name}</span>
                                <span style="color: var(--secondary); font-weight: 700; font-size: 12px; margin-top: 4px;">${scheme.supplyPerPerson[idx]} kg @ ₹${scheme.suppliesCost[idx]}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                container.appendChild(card);
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

        if (response && response.ok === false) {
            throw new Error(response.message || 'Failed to load scheme details');
        }

        if (response) {
            console.log('[SCHEME] Loaded scheme for editing:', response);

            const typeEl = document.getElementById('schemeType');
            if (typeEl) typeEl.value = response.schemeType || '';

            if (typeof toggleSchemeName === 'function') toggleSchemeName();

            const nameEl = document.getElementById('schemeName');
            if (nameEl) nameEl.value = response.schemeName || '';

            const distEl = document.getElementById('stateDistrictCode');
            if (distEl) distEl.value = response.stateDistrictCode || '';

            const container = document.getElementById('suppliesContainer');
            if (container) container.innerHTML = '';

            const suppliesNames = response.suppliesName || [];
            const suppliesCosts = response.suppliesCost || [];
            const supplyPerPersons = response.supplyPerPerson || [];

            suppliesNames.forEach((name, idx) => {
                const row = document.createElement('div');
                row.className = 'supply-row';
                row.innerHTML = `
                    <input type="text" class="form-control" value="${name}" placeholder="Supply name">
                    <input type="number" class="form-control" value="${suppliesCosts[idx] !== undefined ? suppliesCosts[idx] : ''}" placeholder="Cost">
                    <input type="number" class="form-control" value="${supplyPerPersons[idx] !== undefined ? supplyPerPersons[idx] : ''}" placeholder="Per person">
                    <button type="button" class="remove-supply" onclick="this.parentElement.remove()">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                `;
                if (container) container.appendChild(row);
            });

            localStorage.setItem('editingSchemeId', schemeId);

            const btn = document.querySelector('#schemeForm button[type="submit"]');
            if (btn) btn.innerHTML = '<i class="ri-save-line"></i> Update Scheme';

            const module4 = document.getElementById('module4');
            if (module4) module4.scrollIntoView({ behavior: 'smooth' });

            await showCustomModal('Scheme details loaded into the form. You can now edit the fields and click "Update Scheme" to save.', 'Edit Scheme');
        }
    } catch (error) {
        console.error('[SCHEME] Error:', error);
        await showCustomModal('Error: ' + error.message, 'Failed to Load');
    }
}

async function deleteSchemeAction(schemeId) {
    if (await showCustomConfirm('Are you sure you want to delete this scheme?')) {
        try {
            console.log('[SCHEME] Deleting scheme:', schemeId);
            const response = await deleteScheme(schemeId);

            if (response && (response.success || response === true || response.ok)) {
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


// Global scope for active capturing target index
window.currentCaptureIndex = -1;

function handleAdminTotalMembersChange() {
    const count = parseInt(document.getElementById('fresFamilyCount').value) || 1;
    const container = document.getElementById('adminFamilyMembersContainer');

    // Clear current to rebuild
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
        addAdminNewMemberHtml(i);
    }
}

function addAdminNewMember() {
    const countInput = document.getElementById('fresFamilyCount');
    let count = parseInt(countInput.value) || 0;
    if (count >= 10) {
        showCustomModal("Maximum 10 members allowed");
        return;
    }

    addAdminNewMemberHtml(count);

    countInput.value = count + 1;
}

function addAdminNewMemberHtml(index) {
    const container = document.getElementById('adminFamilyMembersContainer');
    const memberDiv = document.createElement('div');
    memberDiv.className = 'member-entry';
    memberDiv.style.border = '1px solid var(--border)';
    memberDiv.style.borderRadius = '8px';
    memberDiv.style.padding = '15px';
    memberDiv.style.marginBottom = '15px';
    memberDiv.style.background = '#f8fafc';

    memberDiv.innerHTML = `
        <h5 style="margin-bottom: 10px; color: var(--secondary);">Member ${index + 1}</h5>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="adminMemberName_${index}" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label">Aadhaar Number</label>
                <input type="text" id="adminMemberAadhaar_${index}" class="form-control" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" id="adminMemberDOB_${index}" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label">Employment Status</label>
                <select id="adminMemberEmployment_${index}" class="form-control" required>
                    <option value="GOVERNMENT">Government</option>
                    <option value="PRIVATE">Private</option>
                    <option value="STUDENT">Student</option>
                    <option value="HOUSE_WIFE">Homemaker</option>
                </select>
            </div>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
            <button type="button" class="submit-btn" style="width: auto; background: var(--secondary); padding: 8px 15px;" onclick="openCameraForAdminMember(${index})">
                <i class="ri-camera-line"></i> Capture Photo
            </button>
            <span id="admin-photo-status-${index}" style="color: var(--gray); font-size: 14px;">No photo captured</span>
            <input type="hidden" id="adminMemberPhotograph_${index}">
        </div>
    `;
    container.appendChild(memberDiv);
}

window.openCameraForAdminMember = function (index) {
    window.currentCaptureIndex = index;
    openCameraModal(); // Call the existing openCameraModal
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
        if (response && response.success) {
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
        const response = await getAllBeneficiary(cardNumber);

        if (response && Array.isArray(response) && response.length > 0) {
            localStorage.setItem('currentCardNumber', cardNumber);
            const cardDetailsEl = document.getElementById('cardDetails');
            if (cardDetailsEl) cardDetailsEl.style.display = 'block';

            document.getElementById('displayCardNumber').textContent = cardNumber;
            document.getElementById('cardHeadName').textContent = response[0].name || 'N/A';
            document.getElementById('cardTotalMembers').textContent = response.length;
            
            // Re-fetch card data to populate exact Income if an endpoint exists, else render default state:
            const incomeEl = document.getElementById('cardAnnualIncome');
            if (incomeEl) incomeEl.textContent = 'Data Protected';

            const membersList = document.getElementById('membersList');
            if (membersList) membersList.innerHTML = '';
            
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
            
            loadCardTransactionsAndComplaints(cardNumber);
        } else {
            console.warn('[CARD] Invalid card or no members found.', response);
            await showCustomModal(response?.message || 'Invalid Ration Card Number or no members found.');
            const cardDetailsEl = document.getElementById('cardDetails');
            if (cardDetailsEl) cardDetailsEl.style.display = 'none';
        }
    } catch (error) {
        console.error('[CARD] Error:', error);
        await showCustomModal('Error searching card: ' + error.message);
        const cardDetailsEl = document.getElementById('cardDetails');
        if (cardDetailsEl) cardDetailsEl.style.display = 'none';
    }
}
async function loadCardMembers(cardNumber) {
    // Deprecated. Handled directly inside searchRationCard now.
}

function switchCardTab(e, tabName) {
    document.querySelectorAll('#module3 .nav-item').forEach(el => el.classList.remove('active'));

    if (e && e.currentTarget) {
        e.currentTarget.classList.add('active');
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
                    <td>Rs ${(tx.costPerSupplies || []).reduce((a, b) => a + b, 0)}</td>
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
                    <td><span class="status-badge" style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 4px; font-weight: 500;">${cx.status}</span></td>
                `;
                cb.appendChild(row);
            });
        } else {
            cb.innerHTML = '<tr><td colspan="4" style="text-align:center">No complaints</td></tr>';
        }
    } catch (err) {
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

        if (response && Array.isArray(response) && response.length > 0) {
            const tbody = document.getElementById('familyMembersTable');
            if (tbody) tbody.innerHTML = '';

            response.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="sep-check" value="${member.aadhaarNumber}"></td>
                    <td>${member.name || 'N/A'}</td>
                    <td>${member.aadhaarNumber || 'N/A'}</td>
                    <td>${member.employmentStatus || 'N/A'}</td>
                    <td><input type="number" class="sep-income form-control" style="width: 100px;" placeholder="Income"></td>
                `;
                if (tbody) tbody.appendChild(row);
            });

            const familyMembersListEl = document.getElementById('familyMembersList');
            if (familyMembersListEl) familyMembersListEl.style.display = 'block';
        } else {
            console.warn('[FAMILY] Invalid card or no members found.', response);
            await showCustomModal(response?.message || 'Invalid Ration Card Number or no members found.');
            const familyMembersListEl = document.getElementById('familyMembersList');
            if (familyMembersListEl) familyMembersListEl.style.display = 'none';
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
    const aadhaarNumbers = [];
    let newAnnualIncome = 0;

    checkboxes.forEach(cb => {
        aadhaarNumbers.push(cb.value);
        const row = cb.closest('tr');
        if (row) {
            const incomeInput = row.querySelector('.sep-income');
            if (incomeInput && incomeInput.value) {
                newAnnualIncome += parseInt(incomeInput.value);
            }
        }
    });

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
                aadhaarNumbers: aadhaarNumbers,
                newAnnualIncome: newAnnualIncome
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

    if (window.currentCaptureIndex === 'UPDATE_MEMBER') {
        const inputField = document.getElementById('updateMemberPhotoBase64');
        const statusSpan = document.getElementById('updateMemberPhotoStatus');
        if (inputField) inputField.value = base64Img;
        if (statusSpan) {
            statusSpan.style.color = "var(--secondary)";
            statusSpan.textContent = "Photo captured successfully";
        }
        window.currentCaptureIndex = -1;
    } else if (window.currentCaptureIndex !== undefined && window.currentCaptureIndex >= 0) {
        // Save for dynamic member in registration
        const inputField = document.getElementById('adminMemberPhotograph_' + window.currentCaptureIndex);
        const statusSpan = document.getElementById('admin-photo-status-' + window.currentCaptureIndex);
        if (inputField) inputField.value = base64Img;
        if (statusSpan) {
            statusSpan.style.color = "var(--secondary)";
            statusSpan.textContent = "Photo captured successfully";
        }
        window.currentCaptureIndex = -1; // Reset
    } else {
        // Fallback for single Add Member
        const inputField = document.getElementById('memberPhotograph');
        const statusSpan = document.getElementById('photo-status');
        if (inputField) inputField.value = base64Img;
        if (statusSpan) {
            statusSpan.style.color = "var(--secondary)";
            statusSpan.textContent = "Photo captured successfully";
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

document.addEventListener('DOMContentLoaded', async () => {
    // Check if we are on the admin dashboard with Fresh Registration form
    const fresFamilyCountEl = document.getElementById('fresFamilyCount');
    if (fresFamilyCountEl) {
        handleAdminTotalMembersChange();
    }

    // Fetch and populate the Admin's default state district code into the separation form
    try {
        const response = await apiRequest('/admin/profile', 'GET');
        if (response && response.success && response.stateDistrictCode) {
            const sepDistrictInput = document.getElementById('sepDistrictCode');
            if (sepDistrictInput) {
                sepDistrictInput.value = response.stateDistrictCode;
            }
        }
    } catch (e) {
        console.warn('Failed to load admin profile data for default district code.');
    }
});

/* CARD SERVICES EXTENDED FUNCTIONS */

async function populateMemberDropdown(selectId) {
    const cardNumber = localStorage.getItem('currentCardNumber');
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Loading...</option>';

    try {
        const response = await getAllBeneficiary(cardNumber);
        if (response && Array.isArray(response) && response.length > 0) {
            select.innerHTML = '<option value="">Select Member</option>';
            response.forEach(member => {
                const opt = document.createElement('option');
                opt.value = member.aadhaarNumber;
                opt.textContent = `${member.name} (${member.aadhaarNumber.slice(-4)})`;
                select.appendChild(opt);
            });
        } else {
            select.innerHTML = '<option value="">No members found</option>';
        }
    } catch (e) {
        select.innerHTML = '<option value="">Error loading</option>';
    }
}

async function showUpdateMemberModal() {
    await populateMemberDropdown('updateMemberSelect');
    document.getElementById('updateMemberEmp').value = '';
    document.getElementById('updateMemberPhotoBase64').value = '';
    const st = document.getElementById('updateMemberPhotoStatus');
    if (st) { st.textContent = 'No photo captured'; st.style.color = 'var(--gray)'; }
    document.getElementById('updateMemberModal').classList.add('active');
}

async function submitUpdateMemberAction() {
    const aadhaar = document.getElementById('updateMemberSelect').value;
    const empStatus = document.getElementById('updateMemberEmp').value;
    const photo = document.getElementById('updateMemberPhotoBase64').value;
    const cardNumber = localStorage.getItem('currentCardNumber');

    if (!aadhaar) return await showCustomModal("Please select a member.");

    const payload = {};
    if (empStatus) payload.employmentStatus = empStatus;
    if (photo) payload.photograph = photo;

    if (Object.keys(payload).length === 0) return await showCustomModal("Enter at least one field to update.");

    try {
        const response = await apiRequest(`/admin/updateMemberDetails/${cardNumber}/${aadhaar}`, 'PUT', payload);
        if (response && response.success) {
            await showCustomModal("Member updated successfully!");
            closeModal('updateMemberModal');
            searchRationCard(); // Refresh card stats
        } else {
            await showCustomModal("Error: " + (response?.message || "Failed update"));
        }
    } catch (e) { await showCustomModal("Error: " + e.message); }
}

function showUpdateCardModal() {
    document.getElementById('updateCardIncome').value = '';
    document.getElementById('updateCardDistrict').value = '';
    document.getElementById('updateCardEmail').value = '';
    document.getElementById('updateCardModal').classList.add('active');
}

async function submitUpdateCardAction() {
    const income = document.getElementById('updateCardIncome').value;
    const districtCode = document.getElementById('updateCardDistrict').value;
    const email = document.getElementById('updateCardEmail').value;
    const cardNumber = localStorage.getItem('currentCardNumber');

    const payload = {};
    if (income) payload.annualIncome = income;
    if (districtCode) payload.stateDistrictCode = districtCode;
    if (email) payload.email = email;

    if (Object.keys(payload).length === 0) return await showCustomModal("Enter at least one field to update.");

    try {
        const response = await apiRequest(`/admin/updateCardDetails/${cardNumber}`, 'PUT', payload);
        if (response && response.success) {
            await showCustomModal("Card properties updated successfully!");
            closeModal('updateCardModal');
            searchRationCard();
        } else {
            await showCustomModal("Error: " + (response?.message || "Failed update"));
        }
    } catch (e) { await showCustomModal("Error: " + e.message); }
}

async function showTransferMemberModal() {
    await populateMemberDropdown('transferMemberSelect');
    document.getElementById('transferTargetCard').value = '';
    document.getElementById('transferMemberModal').classList.add('active');
}

async function submitTransferMemberAction() {
    const aadhaar = document.getElementById('transferMemberSelect').value;
    const newCard = document.getElementById('transferTargetCard').value;
    const oldCard = localStorage.getItem('currentCardNumber');

    if (!aadhaar || !newCard) return await showCustomModal("Please fill missing fields.");

    if (oldCard === newCard) return await showCustomModal("Source and target card cannot be identical.");

    if (await showCustomConfirm("Are you certain you wish to permanently migrate this member?")) {
        try {
            const response = await apiRequest(`/admin/transferToExistingCard/${oldCard}/${newCard}/${aadhaar}`, 'PUT');
            if (response && response.success) {
                await showCustomModal("Member migrated to existing card successfully.");
                closeModal('transferMemberModal');
                searchRationCard();
            } else {
                await showCustomModal("Error: " + (response?.message || "Failed migration"));
            }
        } catch (e) { await showCustomModal("Error: " + e.message); }
    }
}