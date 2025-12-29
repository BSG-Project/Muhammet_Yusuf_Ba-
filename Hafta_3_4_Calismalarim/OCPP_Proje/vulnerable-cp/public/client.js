/**
 * PowerCharge Pro - HMI Client Script
 * Handles Socket.io connection and UI updates
 */

// Connect to server
const socket = io();

// DOM Elements
const elements = {
    // Status indicators
    systemStatus: document.getElementById('systemStatus'),
    ocppStatus: document.getElementById('ocppStatus'),

    // Control buttons
    btnPlugIn: document.getElementById('btnPlugIn'),
    btnSwipe: document.getElementById('btnSwipe'),
    btnUnplug: document.getElementById('btnUnplug'),
    btnClearLogs: document.getElementById('btnClearLogs'),

    // State displays
    connectorStatus: document.getElementById('connectorStatus'),
    meterValue: document.getElementById('meterValue'),
    transactionId: document.getElementById('transactionId'),
    idTag: document.getElementById('idTag'),

    // Config fields
    configSsid: document.getElementById('configSsid'),
    configPassword: document.getElementById('configPassword'),
    configCsms: document.getElementById('configCsms'),
    configCpId: document.getElementById('configCpId'),

    // Log terminal
    logTerminal: document.getElementById('logTerminal'),
};

// Status badge classes
const statusClasses = {
    'Available': 'available',
    'Preparing': 'preparing',
    'Charging': 'charging',
    'Finishing': 'charging',
    'Faulted': 'faulted',
};

const statusLabels = {
    'Available': 'Müsait',
    'Preparing': 'Hazırlanıyor',
    'Charging': 'Şarj Oluyor',
    'Finishing': 'Tamamlanıyor',
    'Faulted': 'Hatalı',
};

// ============================================
// Socket Event Handlers
// ============================================

socket.on('connect', () => {
    console.log('Connected to HMI server');
    updateSystemStatus(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from HMI server');
    updateSystemStatus(false);
});

socket.on('status_update', (state) => {
    updateDeviceState(state);
});

socket.on('ocpp_status', (data) => {
    updateOcppStatus(data.connected);
});

socket.on('meter_update', (data) => {
    elements.meterValue.textContent = data.value.toLocaleString();
});

socket.on('log', (data) => {
    addLogEntry(data.message, data.type);
});

socket.on('config_data', (config) => {
    elements.configSsid.value = config.ssid;
    elements.configPassword.value = config.password;
    elements.configCsms.value = config.csmsUrl;
    elements.configCpId.value = config.chargePointId;
});

// ============================================
// UI Update Functions
// ============================================

function updateSystemStatus(online) {
    const dot = elements.systemStatus.querySelector('.status-dot');
    const text = elements.systemStatus.querySelector('strong');

    if (online) {
        dot.className = 'status-dot online';
        text.textContent = 'ÇEVRİMİÇİ';
    } else {
        dot.className = 'status-dot offline';
        text.textContent = 'ÇEVRİMDIŞI';
    }
}

function updateOcppStatus(connected) {
    const dot = elements.ocppStatus.querySelector('.status-dot');
    const text = elements.ocppStatus.querySelector('strong');

    if (connected) {
        dot.className = 'status-dot online';
        text.textContent = 'Bağlı';
    } else {
        dot.className = 'status-dot offline';
        text.textContent = 'Bağlantı Yok';
    }
}

function updateDeviceState(state) {
    // Update connector status badge
    const statusClass = statusClasses[state.status] || 'available';
    const statusLabel = statusLabels[state.status] || state.status;

    elements.connectorStatus.innerHTML = `
        <span class="status-badge ${statusClass}">${statusLabel}</span>
    `;

    // Update meter value
    elements.meterValue.textContent = state.meterValue.toLocaleString();

    // Update transaction ID
    elements.transactionId.textContent = state.transactionId || '-';

    // Update ID tag
    elements.idTag.textContent = state.idTag || '-';
}

function addLogEntry(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;

    elements.logTerminal.appendChild(entry);
    elements.logTerminal.scrollTop = elements.logTerminal.scrollHeight;

    // Keep only last 100 entries
    while (elements.logTerminal.children.length > 100) {
        elements.logTerminal.removeChild(elements.logTerminal.firstChild);
    }
}

function clearLogs() {
    elements.logTerminal.innerHTML = '<div class="log-entry info">[Sistem] Loglar temizlendi</div>';
}

// ============================================
// Button Event Handlers
// ============================================

elements.btnPlugIn.addEventListener('click', () => {
    socket.emit('simulate_plugin');
});

elements.btnSwipe.addEventListener('click', () => {
    socket.emit('simulate_swipe');
});

elements.btnUnplug.addEventListener('click', () => {
    socket.emit('simulate_unplug');
});

elements.btnClearLogs.addEventListener('click', () => {
    clearLogs();
});

// ============================================
// Initialization
// ============================================

console.log('PowerCharge Pro HMI Client initialized');
addLogEntry('[Sistem] HMI Panel yüklendi', 'info');
