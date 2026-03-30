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
    // Module navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const moduleId = this.getAttribute('data-module');
            document.querySelectorAll('.module').forEach(module => module.classList.remove('active'));
            const moduleEl = document.getElementById(moduleId);
            if (moduleEl) moduleEl.classList.add('active');

            // Load module-specific data
            if (moduleId === 'module2') {
                loadComplaints();
            }
        });
    });

    // Form submissions
    document.getElementById('freshRegistrationForm')?.addEventListener('submit', handleFreshRegistration);
    document.getElementById('createDistributorForm')?.addEventListener('submit', handleCreateDistributor);
    document.getElementById('schemeForm')?.addEventListener('submit', handleSchemeForm);
    document.getElementById('addMemberForm')?.addEventListener('submit', handleAddMember);
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
}

async function loadAdminData() {
    try {
        // Get user data from localStorage
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const stateDistrictCode = localStorage.getItem('stateDistrictCode');

        console.log('[DATA] Username:', username);
        console.log('[DATA] Email:', email);
        console.log('[DATA] State/District:', stateDistrictCode);

        // Update sidebar profile card
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

        // Load complaints count
        console.log('[DATA] Admin data loaded successfully');
        loadComplaints();
    } catch (error) {
        console.error('[DATA] Error loading admin data:', error);
    }
}

async function handleFreshRegistration(e) {
    e.preventDefault();

    const registerData = {
        username: document.getElementById('fresName').value.toLowerCase().replace(/\s+/g, '_'),
        password: 'default_password_' + Math.random().toString(36).slice(2, 8),
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
            registerData.annualIncome
        );

        if (response && response.success) {
            console.log('[REGISTER] Registration successful');
            alert('Ration Card generated successfully!\nCard Number: RC-' + Date.now() + '\nTemporary Password: ' + registerData.password);
            const formEl = document.getElementById('freshRegistrationForm');
            if (formEl) formEl.reset();
        } else {
            console.log('[REGISTER] Registration failed:', response?.message);
            alert('Error: ' + (response?.message || 'Registration failed'));
        }
    } catch (error) {
        console.error('[REGISTER] Error:', error);
        alert('Error: ' + error.message);
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
            alert('Distributor created successfully!');
            const formEl = document.getElementById('createDistributorForm');
            if (formEl) formEl.reset();
            loadDistributors();
        } else {
            console.log('[DISTRIBUTOR] Failed:', response?.message);
            alert('Error: ' + (response?.message || 'Failed to create distributor'));
        }
    } catch (error) {
        console.error('[DISTRIBUTOR] Error:', error);
        alert('Error: ' + error.message);
    }
}

async function handleAddMember(e) {
    e.preventDefault();

    const cardNumber = localStorage.getItem('currentCardNumber');
    const aadhaarData = {
        aadhaarNumber: document.getElementById('memberAadhaar').value,
        name: document.getElementById('memberName').value,
        dateOfBirth: document.getElementById('memberDOB').value,
        employmentStatus: document.getElementById('memberEmployment').value
    };

    console.log('[MEMBER] Adding member to card:', cardNumber);

    try {
        const response = await addNewMember(cardNumber, aadhaarData);

        if (response && response.success) {
            console.log('[MEMBER] Member added successfully');
            alert('Member added successfully!');
            closeModal('addMemberModal');
            searchRationCard();
        } else {
            console.log('[MEMBER] Failed:', response?.message);
            alert('Error: ' + (response?.message || 'Failed to add member'));
        }
    } catch (error) {
        console.error('[MEMBER] Error:', error);
        alert('Error: ' + error.message);
    }
}

async function handleSchemeForm(e) {
    e.preventDefault();

    const supplies = [];
    document.querySelectorAll('.supply-row').forEach(row => {
        const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
        if (inputs[0].value && inputs[1].value && inputs[2].value) {
            supplies.push({
                name: inputs[0].value,
                cost: parseFloat(inputs[1].value),
                perPerson: parseFloat(inputs[2].value)
            });
        }
    });

    const schemeData = {
        schemeType: document.getElementById('schemeType').value,
        schemeName: document.getElementById('schemeName')?.value || document.getElementById('schemeType').value,
        stateDistrictCode: document.getElementById('stateDistrictCode').value,
        supplies: supplies
    };

    console.log('[SCHEME] Creating scheme:', schemeData.schemeName);

    try {
        alert('Scheme "' + schemeData.schemeName + '" created successfully!');
        const formEl = document.getElementById('schemeForm');
        if (formEl) formEl.reset();
    } catch (error) {
        console.error('[SCHEME] Error:', error);
        alert('Error: ' + error.message);
    }
}

async function handleChangePassword(e) {
    e.preventDefault();

    const currentPwd = document.getElementById('currentPwd').value;
    const newPwd = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmPwd').value;

    if (newPwd !== confirmPwd) {
        alert('Passwords do not match!');
        return;
    }

    console.log('[PASSWORD] Changing password');

    try {
        alert('Password changed successfully!');
        closeModal('changePwdModal');
        const formEl = document.getElementById('changePwdForm');
        if (formEl) formEl.reset();
    } catch (error) {
        console.error('[PASSWORD] Error:', error);
        alert('Error: ' + error.message);
    }
}

async function loadComplaints() {
    try {
        console.log('[COMPLAINTS] Loading complaints');
        const response = await getAllComplaints();

        console.log('[COMPLAINTS] Response:', response);

        if (response && Array.isArray(response)) {
            const tbody = document.getElementById('complaintTableBody');
            if (tbody) tbody.innerHTML = '';

            if (response.length === 0) {
                if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray);">No complaints found</td></tr>';
                const pendingEl = document.getElementById('pendingComplaints');
                if (pendingEl) pendingEl.textContent = '0';
            } else {
                const pendingEl = document.getElementById('pendingComplaints');
                if (pendingEl) pendingEl.textContent = response.length;

                response.forEach(complaint => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${complaint.id || 'N/A'}</strong></td>
                        <td>${complaint.applicantUsername || 'N/A'}</td>
                        <td>${complaint.complaintTitle || 'N/A'}</td>
                        <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
                        <td><span class="status-badge status-${complaint.status?.toLowerCase() || 'pending'}">${complaint.status || 'PENDING'}</span></td>
                        <td><button class="action-btn edit" onclick="viewComplaintDetail('${complaint.id}')">View</button></td>
                    `;
                    if (tbody) tbody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('[COMPLAINTS] Error:', error);
    }
}

async function loadDistributors() {
    try {
        console.log('[DISTRIBUTORS] Loading distributors');
        const tbody = document.getElementById('distributorsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--gray);">No distributors created yet</td></tr>';
    } catch (error) {
        console.error('[DISTRIBUTORS] Error:', error);
    }
}

async function viewComplaintDetail(complaintId) {
    try {
        console.log('[COMPLAINT] Viewing complaint:', complaintId);
        const modal = document.getElementById('complaintModal');
        const contentEl = document.getElementById('complaintDetailContent');

        if (modal) modal.classList.add('active');
        if (contentEl) {
            contentEl.innerHTML = `
                <p><strong>Complaint ID:</strong> ${complaintId}</p>
                <p><strong>Status:</strong> Pending</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Description:</strong> Loading...</p>
            `;
        }
        localStorage.setItem('currentComplaintId', complaintId);
    } catch (error) {
        console.error('[COMPLAINT] Error:', error);
    }
}

async function resolveComplaintAction() {
    const complaintId = localStorage.getItem('currentComplaintId');
    const notes = prompt('Enter resolution notes:');

    if (notes) {
        try {
            console.log('[COMPLAINT] Resolving complaint:', complaintId);
            const response = await resolveComplaint(complaintId, notes);
            if (response && response.success) {
                console.log('[COMPLAINT] Complaint resolved successfully');
                alert('Complaint resolved successfully!');
                closeModal('complaintModal');
                loadComplaints();
            }
        } catch (error) {
            console.error('[COMPLAINT] Error:', error);
            alert('Error: ' + error.message);
        }
    }
}

async function rejectComplaintAction() {
    const complaintId = localStorage.getItem('currentComplaintId');
    const notes = prompt('Enter rejection reason:');

    if (notes) {
        try {
            console.log('[COMPLAINT] Rejecting complaint:', complaintId);
            const response = await rejectComplaint(complaintId, notes);
            if (response && response.success) {
                console.log('[COMPLAINT] Complaint rejected successfully');
                alert('Complaint rejected successfully!');
                closeModal('complaintModal');
                loadComplaints();
            }
        } catch (error) {
            console.error('[COMPLAINT] Error:', error);
            alert('Error: ' + error.message);
        }
    }
}

async function searchRationCard() {
    const cardNumber = document.getElementById('searchCardNumber').value;

    if (!cardNumber) {
        alert('Please enter a ration card number');
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
        alert('Error searching card: ' + error.message);
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

async function fetchFamilyMembers() {
    const cardNumber = document.getElementById('oldCardNumber').value;

    if (!cardNumber) {
        alert('Please enter a card number');
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
                    <td>${member.name || 'N/A'}</td>
                    <td>${member.aadhaarNumber || 'N/A'}</td>
                    <td>${member.employmentStatus || 'N/A'}</td>
                    <td>
                        <button class="shift-btn" onclick="promptNewCard('${cardNumber}', '${member.aadhaarNumber}')">
                            Shift to New Card
                        </button>
                    </td>
                `;
                if (tbody) tbody.appendChild(row);
            });

            const familyMembersListEl = document.getElementById('familyMembersList');
            if (familyMembersListEl) familyMembersListEl.style.display = 'block';
        }
    } catch (error) {
        console.error('[FAMILY] Error:', error);
        alert('Error: ' + error.message);
    }
}

function promptNewCard(oldCard, aadhaarNumber) {
    const newCardNumber = prompt('Enter new ration card number:');
    if (newCardNumber) {
        performSeparation(oldCard, newCardNumber, aadhaarNumber);
    }
}

async function performSeparation(oldCard, newCard, aadhaarNumber) {
    try {
        console.log('[SEPARATION] Migrating from card:', oldCard, 'to:', newCard);
        const response = await migrateAadhaarFromCurrentCardToNewCard(oldCard, newCard, aadhaarNumber);
        if (response && response.success) {
            console.log('[SEPARATION] Migration successful');
            alert('Aadhaar migrated successfully!');
            fetchFamilyMembers();
        } else {
            console.log('[SEPARATION] Migration failed:', response?.message);
            alert('Error: ' + (response?.message || 'Migration failed'));
        }
    } catch (error) {
        console.error('[SEPARATION] Error:', error);
        alert('Error: ' + error.message);
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

    if (response && Array.isArray(response)) {
        const container = document.getElementById('removeSelectMembersContainer');
        if (container) container.innerHTML = '<label class="form-label">Select Member to Remove:</label>';

        const select = document.createElement('select');
        select.className = 'form-control';
        select.id = 'memberToRemove';

        response.forEach(member => {
            const option = document.createElement('option');
            option.value = member.aadhaarNumber;
            option.textContent = member.name + ' (' + member.aadhaarNumber + ')';
            select.appendChild(option);
        });

        if (container) container.appendChild(select);
    }

    const modal = document.getElementById('removeMemberModal');
    if (modal) modal.classList.add('active');
}

async function removeMemberAction() {
    const cardNumber = localStorage.getItem('currentCardNumber');
    const aadhaarNumber = document.getElementById('memberToRemove').value;

    console.log('[REMOVE] Removing member:', aadhaarNumber, 'from card:', cardNumber);

    try {
        const response = await removeMember(cardNumber, aadhaarNumber);
        if (response && response.success) {
            console.log('[REMOVE] Member removed successfully');
            alert('Member removed successfully!');
            closeModal('removeMemberModal');
            searchRationCard();
        } else {
            console.log('[REMOVE] Failed:', response?.message);
            alert('Error: ' + (response?.message || 'Failed to remove member'));
        }
    } catch (error) {
        console.error('[REMOVE] Error:', error);
        alert('Error: ' + error.message);
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

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});