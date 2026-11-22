const API_BASE_URL = 'http://localhost:8081';

// ===== SESSION MANAGEMENT (1 HOUR DURABLE SESSION) =====
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds

function getSessionExpiry() {
    const expiryStr = sessionStorage.getItem('sessionExpiry') || localStorage.getItem('sessionExpiry');
    return expiryStr ? parseInt(expiryStr, 10) : 0;
}

function updateSessionExpiry() {
    const expiryTime = Date.now() + SESSION_DURATION_MS;
    try {
        sessionStorage.setItem('sessionExpiry', expiryTime.toString());
        localStorage.setItem('sessionExpiry', expiryTime.toString());
    } catch (_) {}
}

function touchSession() {
    const token = getAuthToken();
    if (token) {
        updateSessionExpiry();
    }
}

function isSessionValid() {
    const token = getAuthToken();
    if (!token) {
        return false;
    }
    const expiry = getSessionExpiry();
    // If token exists but expiry not set yet (e.g. existing session), initialize 1-hour duration
    if (!expiry) {
        updateSessionExpiry();
        return true;
    }
    if (Date.now() > expiry) {
        console.warn('[AUTH] Session duration of 1 hour has expired.');
        removeAuthToken();
        return false;
    }
    return true;
}

function getAuthToken() {
    return sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
}

function setAuthToken(token) {
    try {
        sessionStorage.setItem('jwtToken', token);
        localStorage.setItem('jwtToken', token);
    } catch (_) {}
    updateSessionExpiry();
}

function removeAuthToken() {
    const keys = ['jwtToken', 'sessionExpiry', 'userRole', 'username', 'email', 'stateDistrictCode', 'currentCardNumber'];
    keys.forEach(k => {
        try {
            sessionStorage.removeItem(k);
            localStorage.removeItem(k);
        } catch (_) {}
    });
}

// Durable session tracking across tab switches and window focus
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (isSessionValid()) {
                touchSession();
                console.log('[AUTH] Tab active: Session touched and extended for 1 hour');
            }
        }
    });
}

if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
        if (isSessionValid()) {
            touchSession();
        }
    });
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

        // If request succeeded, refresh 1-hour session expiry
        if (response.ok) {
            touchSession();
        }

        // Handle 401 Unauthorized - token is rejected or invalid
        if (response.status === 401 && endpoint !== '/auth/login') {
            console.warn('[API] Unauthorized (401) from server - Redirecting to login');
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

async function verifyBeneficiary(rationCardNumber, isApproved) {
    return apiRequest(
        `/distributor/verifyBeneficiary?beneficiaryUsername=${rationCardNumber}&isApproved=${isApproved}`,
        'POST'
    );
}

async function processTransaction(beneficiaryUsername, aadhaarNumber, useOthersScheme = false, verificationMethod = 'FACE') {
    return apiRequest(
        `/distributor/processTransaction?beneficiaryUsername=${encodeURIComponent(beneficiaryUsername)}&aadhaarNumber=${encodeURIComponent(aadhaarNumber)}&useOthersScheme=${useOthersScheme}&verificationMethod=${encodeURIComponent(verificationMethod)}`,
        'POST'
    );
}

async function getDistributorComplaints() {
    return apiRequest('/distributor/getComplaints', 'GET');
}

async function submitDistributorComplaint(title, description, category, priority) {
    return apiRequest('/distributor/submitComplaint', 'POST', {
        complaintTitle: title,
        description: description,
        category: category,
        priority: priority
    });
}

async function submitBeneficiaryComplaintByDistributor(beneficiaryUsername, title, description, category, priority) {
    return apiRequest(
        `/distributor/submitBeneficiaryComplaint?beneficiaryUsername=${beneficiaryUsername}`,
        'POST',
        {
            complaintTitle: title,
            description: description,
            category: category,
            priority: priority
        }
    );
}

// ===== ADMIN ENDPOINTS =====
async function getAdminDashboardStats() {
    return apiRequest('/admin/stats', 'GET');
}

async function addNewMember(cardNumber, aadhaar) {
    return apiRequest(`/admin/addNewMember/${cardNumber}`, 'PUT', aadhaar);
}

async function addMemberToCard(cardNumber, aadhaar) {
    return addNewMember(cardNumber, aadhaar);
}

async function deleteUserFromCard(cardNumber, userAadhaarNumber) {
    return apiRequest(`/admin/deleteUser/${cardNumber}/${userAadhaarNumber}`, 'DELETE');
}

async function separateCardMembers(payload) {
    return apiRequest('/admin/separateCard', 'POST', payload);
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

async function registerDistributor(username, password, email, stateDistrictCode) {
    return apiRequest('/auth/register', 'POST', {
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
    return isSessionValid();
}

function getUserRole() {
    return sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
}

function getUsername() {
    return sessionStorage.getItem('username') || localStorage.getItem('username');
}

async function getCardDetails(cardNumber) {
    return apiRequest(`/admin/getCardDetails/${cardNumber}`, 'GET');
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
    return new Promise((resolve) => {
        let modal = document.getElementById('genericModal');
        if (!modal) {
            const modalHtml = `
                <div class="modal" id="genericModal" style="z-index: 999999;">
                    <div class="modal-content" style="max-width: 420px; text-align: center; border-top: 5px solid var(--primary);">
                        <h3 id="genericModalTitle" style="color: var(--primary); margin-bottom: 12px; font-size: 1.25rem;">Notification</h3>
                        <p id="genericModalMessage" style="color: #475569; font-size: 0.95rem; margin-bottom: 24px; line-height: 1.5; word-break: break-word;"></p>
                        <div id="genericModalInputContainer" style="display: none; margin-bottom: 20px;">
                            <input type="text" id="genericModalInput" class="form-control" style="width: 100%; box-sizing: border-box; text-align: left;" placeholder="Enter details...">
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="genericModalCancelBtn" class="submit-btn" style="display: none; background: #94a3b8; width: auto; padding: 10px 24px;">Cancel</button>
                            <button id="genericModalOkBtn" class="submit-btn" style="width: auto; min-width: 120px; padding: 10px 24px;">OK</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
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
            resolve();
        };
        
        okBtn.addEventListener('click', handleOk);
        modal.classList.add('active');
    });
};

window.showCustomConfirm = function(message, title = 'Please Confirm') {
    return new Promise((resolve) => {
        let modal = document.getElementById('genericModal');
        if (!modal) {
            window.showCustomModal(message, title);
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

window.showCustomPrompt = function(message, defaultValue = '', title = 'Input Required') {
    return new Promise((resolve) => {
        let modal = document.getElementById('genericModal');
        if (!modal) {
            window.showCustomModal(message, title);
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
