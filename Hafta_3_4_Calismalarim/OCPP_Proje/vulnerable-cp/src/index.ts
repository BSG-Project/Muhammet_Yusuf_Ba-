/**
 * Vulnerable OCPP 1.6J Charge Point Simulator with HMI Panel
 * 
 * Features:
 * - OCPP 1.6J WebSocket client connecting to Steve CSMS
 * - Local Web Admin Panel (HMI) on port 3002
 * - Socket.io for real-time UI updates
 * - Vulnerable GetDiagnostics handler (no URL validation)
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import WebSocket from 'ws';
import AdmZip from 'adm-zip';
import axios from 'axios';
import FormData from 'form-data';
import * as path from 'path';
import { getDiagnosticsData, WPA_SUPPLICANT_CONF, OCPP_CONFIG } from './mock-fs.js';

// ============================================
// Configuration
// ============================================
const HMI_PORT = 3002;
const STEVE_WS_URL = process.env.STEVE_URL || 'ws://localhost:8180/steve/websocket/CentralSystemService/CP001';
const CHARGE_POINT_ID = 'CP001';
const CHARGE_POINT_VENDOR = 'PowerCharge';
const CHARGE_POINT_MODEL = 'Pro-3000';
const RECONNECT_INTERVAL = 5000;

// ============================================
// Express + Socket.io Setup
// ============================================
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
});

// Serve static files from /public
app.use(express.static(path.join(process.cwd(), 'public')));

// ============================================
// Device State
// ============================================
interface DeviceState {
    status: 'Available' | 'Preparing' | 'Charging' | 'Finishing' | 'Faulted';
    connectorId: number;
    meterValue: number;
    transactionId: number | null;
    idTag: string | null;
    ocppConnected: boolean;
}

const deviceState: DeviceState = {
    status: 'Available',
    connectorId: 1,
    meterValue: 0,
    transactionId: null,
    idTag: null,
    ocppConnected: false,
};

// ============================================
// Logging Helper
// ============================================
function log(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    const prefix = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        success: '✅',
    }[type];

    const logEntry = `[${timestamp}] ${prefix} ${message}`;
    console.log(logEntry);
    io.emit('log', { message: logEntry, type, timestamp });
}

function updateStatus(newStatus: DeviceState['status']): void {
    deviceState.status = newStatus;
    io.emit('status_update', deviceState);
    log(`Durum değişti: ${newStatus}`, 'info');
}

// ============================================
// OCPP Message Types
// ============================================
const CALL = 2;
const CALL_RESULT = 3;
const CALL_ERROR = 4;

// Track pending requests
const pendingRequests = new Map<string, (response: unknown) => void>();
let messageId = 0;
let ws: WebSocket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

function generateMessageId(): string {
    return `msg-${++messageId}-${Date.now()}`;
}

// ============================================
// OCPP Communication
// ============================================
function sendCall(action: string, payload: object): Promise<unknown> {
    return new Promise((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket not connected'));
            return;
        }

        const id = generateMessageId();
        const message = JSON.stringify([CALL, id, action, payload]);

        log(`OCPP Gönderiliyor: ${action}`, 'info');

        pendingRequests.set(id, resolve);
        ws.send(message);

        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error(`Timeout: ${action}`));
            }
        }, 30000);
    });
}

function sendCallResult(msgId: string, payload: object): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify([CALL_RESULT, msgId, payload]));
}

// ============================================
// Diagnostics Upload (VULNERABLE!)
// ============================================
function createDiagnosticsZip(): Buffer {
    log('Teşhis ZIP dosyası oluşturuluyor...', 'info');

    const zip = new AdmZip();
    zip.addFile('diagnostics.txt', Buffer.from(getDiagnosticsData(), 'utf-8'));
    zip.addFile('wpa_supplicant.conf', Buffer.from(WPA_SUPPLICANT_CONF, 'utf-8'));
    zip.addFile('ocpp.conf', Buffer.from(OCPP_CONFIG, 'utf-8'));

    return zip.toBuffer();
}

async function uploadDiagnostics(location: string): Promise<boolean> {
    log('═'.repeat(50), 'warning');
    log('⚠️ SALDIRI VEKTÖRÜ: GetDiagnostics alındı!', 'error');
    log(`🎯 Hedef URL: ${location}`, 'error');
    log('⚠️ URL DOĞRULAMASI YAPILMIYOR - GÜVENLİK AÇIĞI!', 'error');
    log('═'.repeat(50), 'warning');

    const zipBuffer = createDiagnosticsZip();

    try {
        log('Uploading sensitive.zip...', 'warning');

        const form = new FormData();
        form.append('file', zipBuffer, {
            filename: `diagnostics_${CHARGE_POINT_ID}_${Date.now()}.zip`,
            contentType: 'application/zip',
        });

        const response = await axios.post(location, form, {
            headers: form.getHeaders(),
            timeout: 30000,
        });

        log(`Yükleme tamamlandı: ${response.status}`, 'error');
        log('🚨 HASSAS VERİLER SALDIRGANA GÖNDERİLDİ!', 'error');

        return true;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        log(`Yükleme hatası: ${errorMessage}`, 'error');
        return false;
    }
}

// ============================================
// OCPP Message Handlers
// ============================================
async function handleGetDiagnostics(msgId: string, payload: { location?: string }): Promise<void> {
    const { location } = payload;

    if (!location) {
        sendCallResult(msgId, { fileName: '' });
        return;
    }

    const fileName = `diagnostics_${CHARGE_POINT_ID}_${Date.now()}.zip`;
    sendCallResult(msgId, { fileName });

    await sendCall('DiagnosticsStatusNotification', { status: 'Uploading' });
    const success = await uploadDiagnostics(location);
    await sendCall('DiagnosticsStatusNotification', { status: success ? 'Uploaded' : 'UploadFailed' });
}

function handleMessage(data: WebSocket.Data): void {
    try {
        const message = JSON.parse(data.toString());
        const messageType = message[0];

        switch (messageType) {
            case CALL: {
                const [, msgId, action, payload] = message;
                log(`OCPP Alındı: ${action}`, 'info');

                if (action === 'GetDiagnostics') {
                    handleGetDiagnostics(msgId, payload);
                } else if (action === 'RemoteStartTransaction') {
                    log('Uzaktan şarj başlatma isteği alındı', 'info');
                    sendCallResult(msgId, { status: 'Accepted' });
                    simulateCharging();
                } else if (action === 'RemoteStopTransaction') {
                    log('Uzaktan şarj durdurma isteği alındı', 'info');
                    sendCallResult(msgId, { status: 'Accepted' });
                    simulateUnplug();
                } else {
                    sendCallResult(msgId, { status: 'Accepted' });
                }
                break;
            }

            case CALL_RESULT: {
                const [, msgId, payload] = message;
                const resolver = pendingRequests.get(msgId);
                if (resolver) {
                    pendingRequests.delete(msgId);
                    resolver(payload);
                }
                break;
            }

            case CALL_ERROR: {
                const [, msgId, errorCode, errorDesc] = message;
                log(`OCPP Hatası: ${errorCode} - ${errorDesc}`, 'error');
                pendingRequests.delete(msgId);
                break;
            }
        }
    } catch (err) {
        log('Mesaj ayrıştırma hatası', 'error');
    }
}

// ============================================
// Simulation Functions
// ============================================
async function simulatePlugIn(): Promise<void> {
    log('Kablo takıldı - Hazırlanıyor...', 'success');
    updateStatus('Preparing');

    try {
        await sendCall('StatusNotification', {
            connectorId: deviceState.connectorId,
            status: 'Preparing',
            errorCode: 'NoError',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        log('StatusNotification gönderilemedi', 'error');
    }
}

async function simulateSwipeCard(): Promise<void> {
    if (deviceState.status !== 'Preparing') {
        log('Önce kabloyu takın!', 'warning');
        return;
    }

    log('RFID kart okutuldu - Şarj başlatılıyor...', 'success');
    deviceState.idTag = 'DEMO_CARD_002';

    try {
        const response = await sendCall('StartTransaction', {
            connectorId: deviceState.connectorId,
            idTag: deviceState.idTag,
            meterStart: deviceState.meterValue,
            timestamp: new Date().toISOString(),
        }) as { transactionId?: number; idTagInfo?: { status: string } };

        if (response.idTagInfo?.status === 'Accepted') {
            deviceState.transactionId = response.transactionId || 1;
            simulateCharging();
        } else {
            log('Şarj başlatma reddedildi', 'error');
            updateStatus('Available');
        }
    } catch (err) {
        log('StartTransaction hatası', 'error');
    }
}

function simulateCharging(): void {
    updateStatus('Charging');
    log('⚡ Şarj başladı', 'success');

    // Simulate meter values increasing
    const meterInterval = setInterval(() => {
        if (deviceState.status !== 'Charging') {
            clearInterval(meterInterval);
            return;
        }
        deviceState.meterValue += Math.floor(Math.random() * 100) + 50;
        io.emit('meter_update', { value: deviceState.meterValue });
    }, 2000);
}

async function simulateUnplug(): Promise<void> {
    if (deviceState.transactionId) {
        log('Şarj durduruluyor...', 'info');

        try {
            await sendCall('StopTransaction', {
                transactionId: deviceState.transactionId,
                meterStop: deviceState.meterValue,
                timestamp: new Date().toISOString(),
                reason: 'Local',
            });
        } catch (err) {
            log('StopTransaction hatası', 'error');
        }

        deviceState.transactionId = null;
        deviceState.idTag = null;
    }

    log('Kablo çıkarıldı', 'info');
    updateStatus('Available');

    try {
        await sendCall('StatusNotification', {
            connectorId: deviceState.connectorId,
            status: 'Available',
            errorCode: 'NoError',
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        log('StatusNotification gönderilemedi', 'error');
    }
}

// ============================================
// OCPP Connection
// ============================================
async function bootNotification(): Promise<boolean> {
    log('BootNotification gönderiliyor...', 'info');

    try {
        const response = await sendCall('BootNotification', {
            chargePointVendor: CHARGE_POINT_VENDOR,
            chargePointModel: CHARGE_POINT_MODEL,
            chargePointSerialNumber: 'SN-DEMO-001',
            firmwareVersion: '1.0.0',
        }) as { status: string; interval?: number };

        if (response.status === 'Accepted') {
            log('CSMS bağlantısı kabul edildi!', 'success');
            const interval = (response.interval || 60) * 1000;

            if (heartbeatInterval) clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(async () => {
                try {
                    await sendCall('Heartbeat', {});
                } catch {
                    // Ignore heartbeat errors
                }
            }, interval);

            return true;
        }
        return false;
    } catch (err) {
        log('BootNotification hatası', 'error');
        return false;
    }
}

function connectToCSMS(): void {
    log(`CSMS'e bağlanılıyor: ${STEVE_WS_URL}`, 'info');

    ws = new WebSocket(STEVE_WS_URL, ['ocpp1.6']);

    ws.on('open', async () => {
        deviceState.ocppConnected = true;
        io.emit('ocpp_status', { connected: true });
        log('CSMS bağlantısı kuruldu!', 'success');

        if (await bootNotification()) {
            log('Sistem hazır - Komut bekleniyor...', 'success');
        }
    });

    ws.on('message', handleMessage);

    ws.on('close', () => {
        deviceState.ocppConnected = false;
        io.emit('ocpp_status', { connected: false });
        log('CSMS bağlantısı kesildi', 'warning');
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        setTimeout(connectToCSMS, RECONNECT_INTERVAL);
    });

    ws.on('error', (err) => {
        log(`WebSocket hatası: ${err.message}`, 'error');
    });
}

// ============================================
// Socket.io Event Handlers (from HMI)
// ============================================
io.on('connection', (socket) => {
    log('HMI Panel bağlandı', 'info');

    // Send current state
    socket.emit('status_update', deviceState);
    socket.emit('ocpp_status', { connected: deviceState.ocppConnected });
    socket.emit('config_data', {
        ssid: 'Corporate_Secure',
        password: 'Admin123!',
        csmsUrl: STEVE_WS_URL,
        chargePointId: CHARGE_POINT_ID,
    });

    socket.on('simulate_plugin', () => simulatePlugIn());
    socket.on('simulate_swipe', () => simulateSwipeCard());
    socket.on('simulate_unplug', () => simulateUnplug());

    socket.on('disconnect', () => {
        log('HMI Panel bağlantısı kesildi', 'info');
    });
});

// ============================================
// Start Server
// ============================================
httpServer.listen(HMI_PORT, () => {
    console.log('\n' + '═'.repeat(60));
    console.log('⚡ POWERCHARGE PRO - ŞARJ İSTASYONU SİMÜLATÖRÜ');
    console.log('═'.repeat(60));
    console.log(`🖥️  HMI Panel: http://localhost:${HMI_PORT}`);
    console.log(`🔌 OCPP CSMS: ${STEVE_WS_URL}`);
    console.log('═'.repeat(60) + '\n');

    // Connect to CSMS
    connectToCSMS();
});

process.on('SIGINT', () => {
    console.log('\n🛑 Sistem kapatılıyor...');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (ws) ws.close();
    process.exit(0);
});
