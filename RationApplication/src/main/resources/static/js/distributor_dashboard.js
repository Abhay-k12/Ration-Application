// Navigation
const navItems = document.querySelectorAll('.nav-item');
const modules = document.querySelectorAll('.module');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        modules.forEach(m => m.classList.remove('active'));

        item.classList.add('active');
        const moduleId = item.dataset.module;
        document.getElementById(moduleId).classList.add('active');
    });
});

// ===== DYNAMIC FAMILY MEMBERS FORM =====
let memberCount = 1; // Start with 1 member (head)

// Initialize the form with just the head member
function initializeFamilyForm() {
    const container = document.getElementById('familyMembersContainer');
    if (!container) return;

    // Clear container and add head member
    container.innerHTML = '';
    addMemberForm(1, ' (Head)');
    memberCount = 1;

    // Update the total members display
    updateTotalMembers();
}

// Add a new member form
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
                <input type="text" class="form-control" placeholder="Enter full name" required>
            </div>
            <div class="form-group">
                <label class="form-label">Aadhaar Number</label>
                <input type="text" class="form-control" placeholder="12-digit Aadhaar" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label">Working Status</label>
                <select class="form-control">
                    <option value="">Select status</option>
                    <option>Government Employee</option>
                    <option>Private Employee</option>
                    <option>Student</option>
                    <option>Housewife</option>
                    <option>Retired</option>
                    <option>Unemployed</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Live Photograph</label>
            <div class="photo-upload" onclick="triggerPhotoUpload(this)">
                <i class="ri-camera-line"></i>
                <p>Click to capture photo</p>
                <input type="file" accept="image/*" capture="user" style="display: none;">
            </div>
        </div>
    `;

    container.appendChild(memberDiv);
}

// Update total members count
function updateTotalMembers() {
    const totalInput = document.getElementById('totalMembers');
    if (totalInput) {
        totalInput.value = memberCount;
    }
}

// Handle total members input change
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
        // Add more members
        for (let i = memberCount + 1; i <= newTotal; i++) {
            addMemberForm(i);
        }
    } else if (newTotal < memberCount) {
        // Remove extra members
        for (let i = memberCount; i > newTotal; i--) {
            const memberToRemove = document.getElementById(`member-${i}`);
            if (memberToRemove) {
                memberToRemove.remove();
            }
        }
    }

    memberCount = newTotal;
}

// Photo upload simulation
function triggerPhotoUpload(element) {
    const fileInput = element.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.click();
        fileInput.onchange = function() {
            // Show preview
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    element.innerHTML = `
                        <i class="ri-checkbox-circle-line" style="color: var(--secondary);"></i>
                        <p>Photo captured!</p>
                        <small style="font-size: 10px;">Click to retake</small>
                    `;
                    element.style.borderColor = 'var(--secondary)';
                };
                reader.readAsDataURL(this.files[0]);
            }
        };
    }
}

// Add new member button (alternative method)
function addNewMember() {
    memberCount++;
    addMemberForm(memberCount);
    updateTotalMembers();
}

// Module 4 functions
function showOnlineVerification() {
    document.getElementById('onlineSection').style.display = 'block';
    document.getElementById('offlineSection').style.display = 'none';
}

function showOfflineOTP() {
    document.getElementById('onlineSection').style.display = 'none';
    document.getElementById('offlineSection').style.display = 'block';
}

function simulateQRScan() {
    document.getElementById('verificationResult').style.display = 'block';
}

function selectFace(name) {
    document.getElementById('allocationSummary').style.display = 'block';
    alert(`Face verification initiated for ${name} (demo)`);
}

function completeAllocation() {
    alert('Ration allocation completed successfully!');
    document.getElementById('verificationResult').style.display = 'none';
    document.getElementById('onlineSection').style.display = 'none';
}

function sendOTP() {
    const rcNumber = document.getElementById('otpRcNumber').value;
    if (rcNumber) {
        document.getElementById('otpSection').style.display = 'block';
        alert('OTP sent to registered email: ra***@gmail.com');
    } else {
        alert('Please enter RC number');
    }
}

function verifyOTP() {
    document.getElementById('offlineAllocation').style.display = 'block';
    alert('OTP verified successfully!');
}

// Modal functions
function openComplaintModal(id) {
    document.getElementById('complaintModal').classList.add('active');
}

function openChangePwdModal() {
    document.getElementById('changePwdModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Form submissions
document.getElementById('registrationForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Collect all member data
    const familyMembers = [];
    for (let i = 1; i <= memberCount; i++) {
        const memberDiv = document.getElementById(`member-${i}`);
        if (memberDiv) {
            const name = memberDiv.querySelectorAll('input[type="text"]')[0]?.value || '';
            const aadhaar = memberDiv.querySelectorAll('input[type="text"]')[1]?.value || '';
            const dob = memberDiv.querySelector('input[type="date"]')?.value || '';
            const status = memberDiv.querySelector('select')?.value || '';

            familyMembers.push({
                name, aadhaar, dob, status
            });
        }
    }

    console.log('Registration Data:', {
        rcNumber: document.querySelector('input[placeholder="Enter existing RC number"]').value,
        income: document.querySelector('input[type="number"]').value,
        familyMembers: familyMembers
    });

    alert(`Digital ration card registration submitted for ${memberCount} family members!`);
});

document.getElementById('distributorComplaintForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Complaint registered as distributor!');
});

document.getElementById('beneficiaryComplaintForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Complaint registered on behalf of beneficiary!');
});

document.getElementById('changePwdForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Password updated successfully!');
    closeModal('changePwdModal');
});

// Mobile menu
document.querySelector('.mobile-menu')?.addEventListener('click', () => {
    alert('Mobile navigation would open');
});

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Initialize the form when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the registration module
    if (document.getElementById('familyMembersContainer')) {
        initializeFamilyForm();
    }
});