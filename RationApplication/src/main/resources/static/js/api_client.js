const API_BASE_URL = 'http://localhost:8081';

function getAuthToken() {
    return localStorage.getItem('jwtToken');
}

function setAuthToken(token) {
    localStorage.setItem('jwtToken', token);
}

function removeAuthToken() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
}

async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
    const headers = {};

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        if (isFormData) {
            config.body = data;
        } else {
            config.body = JSON.stringify(data);
        }
    }

    try {
        console.log(`[API] ${method} ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Try to parse as JSON first
        const text = await response.text();
        let result;
        try {
            result = text ? JSON.parse(text) : {};
        } catch {
            result = { message: text, success: response.ok };
        }

        // Add status and ok to result
        result.status = response.status;
        result.ok = response.ok;

        console.log(`[API Response] Status: ${response.status}, Success: ${result.success}`);

        // Handle 401 Unauthorized - but NOT for login endpoint
        if (response.status === 401 && endpoint !== '/auth/login') {
            console.log('[API] Unauthorized - Removing auth and redirecting to login');
            removeAuthToken();
            window.location.href = '/login_page.html';
            return null;
        }

        return result;
    } catch (error) {
        console.error('[API Error]', error);
        return {
            success: false,
            message: error.message || 'Network error occurred',
            status: 0,
            ok: false
        };
    }
}

// ===== AUTHENTICATION ENDPOINTS =====
async function register(username, password, email, roles, stateDistrictCode, annualIncome = 0) {
    return apiRequest('/auth/register', 'POST', {
        username,
        password,
        email,
        roles,
        stateDistrictCode,
        annualIncome
    });
}

async function login(username, password) {
    console.log('[Login] Attempting login with username:', username);
    const result = await apiRequest('/auth/login', 'POST', { username, password });
    console.log('[Login] Result:', result);
    return result;
}

async function refreshTokenEndpoint() {
    const token = getAuthToken();
    if (!token) return null;
    return apiRequest('/auth/refresh', 'POST', null);
}

// ===== QR CODE ENDPOINTS =====
async function generateQRCode() {
    return apiRequest('/beneficiary/generateQR', 'POST');
}

async function scanQRCode(qrData) {
    return apiRequest(`/distributor/scanQR?qrData=${encodeURIComponent(qrData)}`, 'POST');
}

// ===== BENEFICIARY ENDPOINTS =====
async function getBeneficiaryTransactions() {
    return apiRequest('/beneficiary/getTransactions', 'GET');
}

async function getBeneficiaryComplaints() {
    return apiRequest('/beneficiary/getComplaints', 'GET');
}

async function submitComplaint(title, description, category, documentLink) {
    return apiRequest('/beneficiary/submitComplaint', 'POST', {
        complaintTitle: title,
        description: description,
        category: category,
        documentLink: documentLink
    });
}

// ===== DISTRIBUTOR ENDPOINTS =====
async function registerBeneficiary(beneficiary) {
    return apiRequest('/distributor/register', 'PUT', beneficiary);
}

async function verifyBeneficiary(beneficiaryUsername, isApproved) {
    return apiRequest(
        `/distributor/verifyBeneficiary?beneficiaryUsername=${beneficiaryUsername}&isApproved=${isApproved}`,
        'POST'
    );
}

async function processTransaction(beneficiaryUsername, aadhaarNumber, useOthersScheme) {
    return apiRequest(
        `/distributor/processTransaction?beneficiaryUsername=${beneficiaryUsername}&aadhaarNumber=${aadhaarNumber}&useOthersScheme=${useOthersScheme}`,
        'POST'
    );
}

async function getDistributorComplaints() {
    return apiRequest('/distributor/getComplaints', 'GET');
}

async function submitDistributorComplaint(title, description, category, priority) {
    return apiRequest('/distributor/submitComplaint', 'POST', {
        complaintTitle: title,
        description,
        category,
        priority
    });
}

async function submitDistributorBeneficiaryComplaint(beneficiaryUsername, title, description, category, priority) {
    return apiRequest(`/distributor/submitBeneficiaryComplaint?beneficiaryUsername=${beneficiaryUsername}`, 'POST', {
        complaintTitle: title,
        description,
        category,
        priority
    });
}


// ===== ADMIN ENDPOINTS =====
async function addNewMember(cardNumber, aadhaarData) {
    return apiRequest(`/admin/addNewMember/${cardNumber}`, 'PUT', aadhaarData);
}

async function removeMember(cardNumber, aadhaarNumber) {
    return apiRequest(`/admin/delete/${cardNumber}/${aadhaarNumber}`, 'DELETE');
}

async function migrateAadhaarFromCurrentCardToNewCard(oldCardNumber, newCardNumber, userAadhaarNumber) {
    return apiRequest(
        `/admin/separationCase/${oldCardNumber}/${newCardNumber}/${userAadhaarNumber}`,
        'PUT'
    );
}

async function getAllBeneficiary(cardNumber) {
    return apiRequest(`/admin/getAllBeneficiary/${cardNumber}`, 'GET');
}

async function getAllComplaints() {
    return apiRequest('/admin/getAllComplaints', 'GET');
}

async function resolveComplaint(complaintId, resolutionNotes) {
    return apiRequest(
        `/admin/resolveComplaint/${complaintId}?resolutionNotes=${encodeURIComponent(resolutionNotes)}`,
        'PUT'
    );
}

async function rejectComplaint(complaintId, resolutionNotes) {
    return apiRequest(
        `/admin/rejectComplaint/${complaintId}?resolutionNotes=${encodeURIComponent(resolutionNotes)}`,
        'PUT'
    );
}

async function createDistributor(username, password, email, stateDistrictCode) {
    return apiRequest('/admin/createDistributor', 'POST', {
        username,
        password,
        email,
        stateDistrictCode,
        roles: ['DISTRIBUTOR']
    });
}

// ===== UTILITY FUNCTIONS =====
function logout() {
    removeAuthToken();
    window.location.href = '/login_page.html';
}

function isAuthenticated() {
    return getAuthToken() !== null;
}

function getUserRole() {
    return localStorage.getItem('userRole');
}

function getUsername() {
    return localStorage.getItem('username');
}

async function getBeneficiaryTransactions() {
    return apiRequest('/beneficiary/getTransactions', 'GET');
}

async function getBeneficiaryComplaints() {
    return apiRequest('/beneficiary/getComplaints', 'GET');
}

async function getBeneficiaryMembers() {
    return apiRequest('/beneficiary/getMembers', 'GET');
}

// ===== SCHEME ENDPOINTS =====
async function createScheme(schemeName, schemeType, stateDistrictCode, suppliesName, suppliesCost, supplyPerPerson) {
    return apiRequest('/scheme/create', 'POST', {
        schemeName,
        schemeType,
        stateDistrictCode,
        suppliesName,
        suppliesCost,
        supplyPerPerson
    });
}

async function getSchemesByDistrict(stateDistrictCode) {
    return apiRequest(`/scheme/getByDistrict?stateDistrictCode=${stateDistrictCode}`, 'GET');
}

async function getSchemeById(schemeId) {
    return apiRequest(`/scheme/getById/${schemeId}`, 'GET');
}

async function getAllSchemes() {
    return apiRequest('/scheme/getAll', 'GET');
}

async function updateScheme(schemeId, schemeName, schemeType, stateDistrictCode, suppliesName, suppliesCost, supplyPerPerson) {
    return apiRequest(`/scheme/update/${schemeId}`, 'PUT', {
        schemeName,
        schemeType,
        stateDistrictCode,
        suppliesName,
        suppliesCost,
        supplyPerPerson
    });
}

async function deleteScheme(schemeId) {
    return apiRequest(`/scheme/delete/${schemeId}`, 'DELETE');
}

async function getBeneficiaryProfile() {
    return apiRequest('/beneficiary/me', 'GET');
}

// ===== CUSTOM MODALS =====
window.showCustomModal = function(message, title = 'Notification') {
    return new Promise(resolve => {
        let modal = document.getElementById('genericModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
            <div id="genericModal" class="modal">
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <h3 id="genericModalTitle" style="color:var(--primary); margin-bottom: 15px;"></h3>
                    <p id="genericModalMessage" style="margin-bottom: 20px; font-size: 15px;"></p>
                    <div id="genericModalInputContainer" style="display: none; margin-bottom: 20px;">
                        <input type="text" id="genericModalInput" class="form-control" />
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="genericModalCancelBtn" class="submit-btn" style="background: var(--gray); display: none; width: auto; padding: 10px 20px;">Cancel</button>
                        <button id="genericModalOkBtn" class="submit-btn" style="width: auto; padding: 10px 20px;">OK</button>
                    </div>
                </div>
            </div>
            `);
            modal = document.getElementById('genericModal');
        }

        document.getElementById('genericModalTitle').textContent = title;
        document.getElementById('genericModalMessage').textContent = message;
        document.getElementById('genericModalInputContainer').style.display = 'none';
        document.getElementById('genericModalCancelBtn').style.display = 'none';
        
        const okBtn = document.getElementById('genericModalOkBtn');
        const handleOk = () => {
            okBtn.removeEventListener('click', handleOk);
            modal.classList.remove('active');
            resolve(true);
        };
        okBtn.addEventListener('click', handleOk);
        modal.classList.add('active');
    });
};

window.showCustomConfirm = function(message, title = 'Confirm') {
    return new Promise(resolve => {
        let modal = document.getElementById('genericModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
            <div id="genericModal" class="modal">
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <h3 id="genericModalTitle" style="color:var(--primary); margin-bottom: 15px;"></h3>
                    <p id="genericModalMessage" style="margin-bottom: 20px; font-size: 15px;"></p>
                    <div id="genericModalInputContainer" style="display: none; margin-bottom: 20px;">
                        <input type="text" id="genericModalInput" class="form-control" />
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="genericModalCancelBtn" class="submit-btn" style="background: var(--gray); display: none; width: auto; padding: 10px 20px;">Cancel</button>
                        <button id="genericModalOkBtn" class="submit-btn" style="width: auto; padding: 10px 20px;">OK</button>
                    </div>
                </div>
            </div>
            `);
            modal = document.getElementById('genericModal');
        }

        document.getElementById('genericModalTitle').textContent = title;
        document.getElementById('genericModalMessage').textContent = message;
        document.getElementById('genericModalInputContainer').style.display = 'none';
        
        const cancelBtn = document.getElementById('genericModalCancelBtn');
        cancelBtn.style.display = 'block';
        
        const okBtn = document.getElementById('genericModalOkBtn');
        const handleOk = () => { cleanup(); resolve(true); };
        const handleCancel = () => { cleanup(); resolve(false); };
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.classList.remove('active');
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.classList.add('active');
    });
};

window.showCustomPrompt = function(message, title = 'Input Required', defaultValue = '') {
    return new Promise(resolve => {
        let modal = document.getElementById('genericModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
            <div id="genericModal" class="modal">
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <h3 id="genericModalTitle" style="color:var(--primary); margin-bottom: 15px;"></h3>
                    <p id="genericModalMessage" style="margin-bottom: 20px; font-size: 15px;"></p>
                    <div id="genericModalInputContainer" style="display: none; margin-bottom: 20px;">
                        <input type="text" id="genericModalInput" class="form-control" />
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="genericModalCancelBtn" class="submit-btn" style="background: var(--gray); display: none; width: auto; padding: 10px 20px;">Cancel</button>
                        <button id="genericModalOkBtn" class="submit-btn" style="width: auto; padding: 10px 20px;">OK</button>
                    </div>
                </div>
            </div>
            `);
            modal = document.getElementById('genericModal');
        }

        document.getElementById('genericModalTitle').textContent = title;
        document.getElementById('genericModalMessage').textContent = message;
        
        const inputContainer = document.getElementById('genericModalInputContainer');
        inputContainer.style.display = 'block';
        
        const inputField = document.getElementById('genericModalInput');
        inputField.value = defaultValue;
        
        const cancelBtn = document.getElementById('genericModalCancelBtn');
        cancelBtn.style.display = 'block';
        
        const okBtn = document.getElementById('genericModalOkBtn');
        const handleOk = () => { cleanup(); resolve(inputField.value); };
        const handleCancel = () => { cleanup(); resolve(null); };
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.classList.remove('active');
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.classList.add('active');
        
        setTimeout(() => inputField.focus(), 100);
    });
};