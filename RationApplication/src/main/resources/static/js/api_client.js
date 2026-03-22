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
        console.log(`${method} ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 401 Unauthorized
        if (response.status === 401) {
            removeAuthToken();
            window.location.href = '/login_page.html';
            return null;
        }

        // Try to parse as JSON
        const text = await response.text();
        let result;
        try {
            result = text ? JSON.parse(text) : {};
        } catch {
            result = { message: text, success: response.ok };
        }

        return {
            ...result,
            status: response.status,
            ok: response.ok
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            message: error.message,
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
    return apiRequest('/auth/login', 'POST', { username, password });
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

async function submitComplaint(title, description, category, priority) {
    return apiRequest('/beneficiary/submitComplaint', 'POST', {
        complaintTitle: title,
        description,
        category,
        priority
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

async function processTransaction(beneficiaryUsername, aadhaarNumber, schemeId, isOnline, qrCodeUsed) {
    return apiRequest('/distributor/processTransaction', 'POST', {
        beneficiaryUsername,
        aadhaarNumber,
        schemeId,
        isOnline,
        qrCodeUsed
    });
}

async function getDistributorComplaints() {
    return apiRequest('/distributor/getComplaints', 'GET');
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