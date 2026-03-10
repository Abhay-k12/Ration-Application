    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Module navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const moduleId = this.getAttribute('data-module');
            document.querySelectorAll('.module').forEach(module => module.classList.remove('active'));
            document.getElementById(moduleId).classList.add('active');
        });
    });

    // Fetch family members for separation
    function fetchFamilyMembers() {
        const cardNumber = document.getElementById('oldCardNumber').value;
        if (cardNumber.length >= 8) {
            document.getElementById('familyMembersList').style.display = 'block';
        }
    }

    // Shift member to new card
    function shiftToNewCard(name) {
        alert(`${name} shifted to new card successfully! New card number: RC-${Date.now()}`);
    }

    // Search ration card
    function searchRationCard() {
        const cardNumber = document.getElementById('searchCardNumber').value;
        if (cardNumber) {
            document.getElementById('cardDetails').style.display = 'block';
            document.getElementById('displayCardNumber').textContent = cardNumber;
        } else {
            alert('Please enter a ration card number');
        }
    }

    // View transactions
    function viewTransactions() {
        alert('Showing transaction history for this card');
    }

    // Update member photo
    function updateMemberPhoto() {
        alert('Photo update functionality - would open camera/file picker');
    }

    // Update details
    function updateDetails() {
        alert('Update details form would open');
    }

    // Complaint functions
    function viewComplaint(id) {
        document.getElementById('complaintModal').classList.add('active');
    }

    function resolveComplaint() {
        alert('Complaint resolved successfully');
        closeModal('complaintModal');
    }

    function rejectComplaint() {
        alert('Complaint rejected');
        closeModal('complaintModal');
    }

    // Scheme functions
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
            <input type="number" class="form-control" placeholder="Per person">
            <button type="button" class="remove-supply" onclick="this.parentElement.remove()">
                <i class="ri-delete-bin-line"></i>
            </button>
        `;
        container.appendChild(newRow);
    }

    // Modal functions
    function openChangePwdModal() {
        document.getElementById('changePwdModal').classList.add('active');
    }

    function showAddMemberModal() {
        document.getElementById('addMemberModal').classList.add('active');
    }

    function showRemoveMemberModal() {
        alert('Select member to remove from the list');
    }

    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // Form submissions
    document.getElementById('freshRegistrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const cardNumber = 'RC-' + Date.now();
        alert(`New ration card created successfully! Card Number: ${cardNumber}`);
    });

    document.getElementById('schemeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Scheme created successfully!');
    });

    document.getElementById('changePwdForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Password changed successfully!');
        closeModal('changePwdModal');
    });

    document.getElementById('addMemberForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Member added successfully!');
        closeModal('addMemberModal');
    });