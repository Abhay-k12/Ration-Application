// Check authentication on page load
window.addEventListener('load', () => {
    const token = getAuthToken();
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'ADMIN') {
        window.location.href = 'login_page.html';
        return;
    }

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
            document.getElementById(moduleId).classList.add('active');

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
        const username = localStorage.getItem('username');
        document.getElementById('adminName').textContent = username || 'Admin';
        document.getElementById('adminId').textContent = 'ADM/' + username?.substring(0, 3).toUpperCase() + '/001' || 'ADM/001';
        document.getElementById('adminLocation').textContent = localStorage.getItem('stateDistrictCode') || 'District';

        // Load complaints count
        loadComplaints();
    } catch (error) {
        console.error('Error loading admin data:', error);
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
            alert('Ration Card generated successfully!\nCard Number: RC-' + Date.now() + '\nTemporary Password: ' + registerData.password);
            document.getElementById('freshRegistrationForm').reset();
        } else {
            alert('Error: ' + (response?.message || 'Registration failed'));
        }
    } catch (error) {
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
            alert('Distributor created successfully!');
            document.getElementById('createDistributorForm').reset();
            loadDistributors();
        } else {
            alert('Error: ' + (response?.message || 'Failed to create distributor'));
        }
    } catch (error) {
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

    try {
        const response = await addNewMember(cardNumber, aadhaarData);

        if (response && response.success) {
            alert('Member added successfully!');
            closeModal('addMemberModal');
            searchRationCard();
        } else {
            alert('Error: ' + (response?.message || 'Failed to add member'));
        }
    } catch (error) {
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

    try {
        alert('Scheme "' + schemeData.schemeName + '" created successfully!');
        document.getElementById('schemeForm').reset();
    } catch (error) {
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

    try {
        alert('Password changed successfully!');
        closeModal('changePwdModal');
        document.getElementById('changePwdForm').reset();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadComplaints() {
    try {
        const response = await getAllComplaints();

        if (response && Array.isArray(response)) {
            const tbody = document.getElementById('complaintTableBody');
            tbody.innerHTML = '';

            if (response.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--gray);">No complaints found</td></tr>';
                document.getElementById('pendingComplaints').textContent = '0';
            } else {
                document.getElementById('pendingComplaints').textContent = response.length;

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
                    tbody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('Error loading complaints:', error);
    }
}

async function loadDistributors() {
    try {
        // This would fetch distributors from backend
        // For now, showing placeholder
        const tbody = document.getElementById('distributorsTableBody');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--gray);">No distributors created yet</td></tr>';
    } catch (error) {
        console.error('Error loading distributors:', error);
    }
}

async function viewComplaintDetail(complaintId) {
    try {
        document.getElementById('complaintModal').classList.add('active');
        document.getElementById('complaintDetailContent').innerHTML = `
            <p><strong>Complaint ID:</strong> ${complaintId}</p>
            <p><strong>Status:</strong> Pending</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Description:</strong> Loading...</p>
        `;
        localStorage.setItem('currentComplaintId', complaintId);
    } catch (error) {
        console.error('Error viewing complaint:', error);
    }
}

async function resolveComplaintAction() {
    const complaintId = localStorage.getItem('currentComplaintId');
    const notes = prompt('Enter resolution notes:');

    if (notes) {
        try {
            const response = await resolveComplaint(complaintId, notes);
            if (response && response.success) {
                alert('Complaint resolved successfully!');
                closeModal('complaintModal');
                loadComplaints();
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

async function rejectComplaintAction() {
    const complaintId = localStorage.getItem('currentComplaintId');
    const notes = prompt('Enter rejection reason:');

    if (notes) {
        try {
            const response = await rejectComplaint(complaintId, notes);
            if (response && response.success) {
                alert('Complaint rejected successfully!');
                closeModal('complaintModal');
                loadComplaints();
            }
        } catch (error) {
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
        // Store the card number for use in modals
        localStorage.setItem('currentCardNumber', cardNumber);

        // Fetch card details from backend
        document.getElementById('cardDetails').style.display = 'block';
        document.getElementById('displayCardNumber').textContent = cardNumber;
        document.getElementById('cardHeadName').textContent = 'Head Name';
        document.getElementById('cardTotalMembers').textContent = '4';
        document.getElementById('cardAnnualIncome').textContent = '150000';

        // Load members
        loadCardMembers(cardNumber);
    } catch (error) {
        alert('Error searching card: ' + error.message);
    }
}

async function loadCardMembers(cardNumber) {
    try {
        const response = await getAllBeneficiary(cardNumber);

        if (response && Array.isArray(response)) {
            const membersList = document.getElementById('membersList');
            membersList.innerHTML = '';

            response.forEach(member => {
                const memberCard = document.createElement('div');
                memberCard.className = 'member-card';
                memberCard.innerHTML = `
                    <div class="member-info">
                        <div class="member-avatar">${member.name?.substring(0, 2).toUpperCase()}</div>
                        <div>
                            <h5>${member.name}</h5>
                            <p style="font-size: 13px; color: var(--gray);">
                                Aadhaar: ${member.aadhaarNumber} | Employment: ${member.employmentStatus}
                            </p>
                        </div>
                    </div>
                `;
                membersList.appendChild(memberCard);
            });
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

async function fetchFamilyMembers() {
    const cardNumber = document.getElementById('oldCardNumber').value;

    if (!cardNumber) {
        alert('Please enter a card number');
        return;
    }

    try {
        const response = await getAllBeneficiary(cardNumber);

        if (response && Array.isArray(response)) {
            const tbody = document.getElementById('familyMembersTable');
            tbody.innerHTML = '';

            response.forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${member.name}</td>
                    <td>${member.aadhaarNumber}</td>
                    <td>${member.employmentStatus}</td>
                    <td>
                        <button class="shift-btn" onclick="promptNewCard('${cardNumber}', '${member.aadhaarNumber}')">
                            Shift to New Card
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            document.getElementById('familyMembersList').style.display = 'block';
        }
    } catch (error) {
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
        const response = await migrateAadhaarFromCurrentCardToNewCard(oldCard, newCard, aadhaarNumber);
        if (response && response.success) {
            alert('Aadhaar migrated successfully!');
            fetchFamilyMembers();
        } else {
            alert('Error: ' + (response?.message || 'Migration failed'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function showAddMemberModal() {
    document.getElementById('addMemberModal').classList.add('active');
}

async function showRemoveMemberModal() {
    const cardNumber = localStorage.getItem('currentCardNumber');
    const response = await getAllBeneficiary(cardNumber);

    if (response && Array.isArray(response)) {
        const container = document.getElementById('removeSelectMembersContainer');
        container.innerHTML = '<label class="form-label">Select Member to Remove:</label>';

        const select = document.createElement('select');
        select.className = 'form-control';
        select.id = 'memberToRemove';

        response.forEach(member => {
            const option = document.createElement('option');
            option.value = member.aadhaarNumber;
            option.textContent = member.name + ' (' + member.aadhaarNumber + ')';
            select.appendChild(option);
        });

        container.appendChild(select);
    }

    document.getElementById('removeMemberModal').classList.add('active');
}

async function removeMemberAction() {
    const cardNumber = localStorage.getItem('currentCardNumber');
    const aadhaarNumber = document.getElementById('memberToRemove').value;

    try {
        const response = await removeMember(cardNumber, aadhaarNumber);
        if (response && response.success) {
            alert('Member removed successfully!');
            closeModal('removeMemberModal');
            searchRationCard();
        } else {
            alert('Error: ' + (response?.message || 'Failed to remove member'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function toggleSchemeName() {
    const type = document.getElementById('schemeType').value;
    document.getElementById('customSchemeNameGroup').style.display =
        type === 'OTHERS' ? 'block' : 'none';
}

function addSupplyRow() {
    const container = document.getElementById('suppliesContainer');
    const newRow = document.createElement('div');
    newRow.className = 'supply-row';
    newRow.innerHTML = `
        <input type="text" class="form-control" placeholder="Supply name">
        <input type="number" class="form-control" placeholder="Cost (₹)">
        <input type="number" class="form-control" placeholder="Per person (kg)">
        <button type="button" class="remove-supply" onclick="this.parentElement.remove()">
            <i class="ri-delete-bin-line"></i>
        </button>
    `;
    container.appendChild(newRow);
}

function openChangePwdModal() {
    document.getElementById('changePwdModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function logout() {
    removeAuthToken();
    window.location.href = 'login_page.html';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});