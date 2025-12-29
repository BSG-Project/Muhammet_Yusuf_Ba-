/**
 * Vulnerable OCPP 1.6J Charge Point Simulator
 * 
 * This simulator demonstrates the GetDiagnostics vulnerability:
 * - Connects to Steve CSMS via WebSocket
 * - Responds to GetDiagnostics WITHOUT validating the upload URL
 * - Uploads sensitive configuration files to ANY specified location
 * 
 * VULNERABILITY: No URL validation in GetDiagnostics handler (cite:14)
 * This allows an attacker controlling the CSMS to exfiltrate data.
 */

import WebSocket from 'ws';
import AdmZip from 'adm-zip';
import FormData from 'form-data';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { getMockFiles, getDiagnosticsContent } from './fs-mock.js';

// Configuration
const STEVE_WS_URL = process.env.STEVE_URL || 'ws://localhost:8180/steve/websocket/CentralSystemService/CP001';
const CHARGE_POINT_ID = process.env.CP_ID || 'CP001';
const CHARGE_POINT_VENDOR = 'VulnerableVendor';
const CHARGE_POINT_MODEL = 'InsecureCharger-3000';
const RECONNECT_INTERVAL = 5000;

// OCPP Message Types
const CALL = 2;
const CALL_RESULT = 3;
const CALL_ERROR = 4;

// Track pending requests
const pendingRequests = new Map<string, (response: any) => void>();
let messageId = 0;
let ws: WebSocket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
    return `msg-${++messageId}-${Date.now()}`;
}

/**
 * Send OCPP CALL message
 */
function sendCall(action: string, payload: object): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket not connected'));
            return;
        }

        const id = generateMessageId();
        const message = JSON.stringify([CALL, id, action, payload]);

        console.log(`📤 [CALL] ${action}:`, JSON.stringify(payload, null, 2));

        pendingRequests.set(id, resolve);
        ws.send(message);

        // Timeout after 30 seconds
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error(`Timeout waiting for ${action} response`));
            }
        }, 30000);
    });
}

/**
 * Send OCPP CALL_RESULT message (response to incoming CALL)
 */
function sendCallResult(messageId: string, payload: object): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('❌ Cannot send response - WebSocket not connected');
        return;
    }

    const message = JSON.stringify([CALL_RESULT, messageId, payload]);
    console.log(`📤 [CALL_RESULT] ${messageId}:`, JSON.stringify(payload, null, 2));
    ws.send(message);
}

/**
 * Create diagnostics ZIP file
 */
function createDiagnosticsZip(): Buffer {
    console.log('📦 Creating diagnostics ZIP file...');

    const zip = new AdmZip();
    const files = getMockFiles();

    files.forEach(file => {
        console.log(`   📄 Adding: ${file.name}`);
        zip.addFile(file.name, Buffer.from(file.content, 'utf-8'));
    });

    // Also add a combined diagnostics.txt
    zip.addFile('diagnostics.txt', Buffer.from(getDiagnosticsContent(), 'utf-8'));

    const buffer = zip.toBuffer();
    console.log(`📦 ZIP created: ${buffer.length} bytes`);

    return buffer;
}

/**
 * Upload file to specified URL
 * 
 * ⚠️ VULNERABILITY: NO URL VALIDATION! ⚠️
 * This is intentional for the demo - real implementations MUST validate URLs.
 */
async function uploadDiagnostics(location: string): Promise<boolean> {
    console.log('\n' + '!'.repeat(60));
    console.log('⚠️  VULNERABILITY TRIGGERED: Uploading to UNVALIDATED URL');
    console.log('!'.repeat(60));
    console.log(`🎯 Target URL: ${location}`);
    console.log('⚠️  A secure implementation would validate this URL!');
    console.log('!'.repeat(60) + '\n');

    const zipBuffer = createDiagnosticsZip();

    try {
        const url = new URL(location);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        // Create form data for file upload
        const form = new FormData();
        form.append('file', zipBuffer, {
            filename: `diagnostics_${CHARGE_POINT_ID}_${Date.now()}.zip`,
            contentType: 'application/zip',
        });

        return new Promise((resolve, reject) => {
            const requestOptions: http.RequestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: form.getHeaders(),
            };

            console.log(`📤 Uploading to ${url.hostname}:${requestOptions.port}${url.pathname}...`);

            const req = httpModule.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`📥 Upload response: ${res.statusCode} ${res.statusMessage}`);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        console.log('✅ Diagnostics uploaded successfully!');
                        console.log('🚨 SENSITIVE DATA HAS BEEN EXFILTRATED TO ATTACKER SERVER!');
                        resolve(true);
                    } else {
                        console.log(`❌ Upload failed: ${data}`);
                        resolve(false);
                    }
                });
            });

            req.on('error', (err) => {
                console.error(`❌ Upload error: ${err.message}`);
                reject(err);
            });

            form.pipe(req);
        });
    } catch (err) {
        console.error(`❌ Failed to upload diagnostics: ${err}`);
        return false;
    }
}

/**
 * Send DiagnosticsStatusNotification to CSMS
 */
async function sendDiagnosticsStatus(status: 'Uploading' | 'Uploaded' | 'UploadFailed' | 'Idle'): Promise<void> {
    try {
        await sendCall('DiagnosticsStatusNotification', { status });
    } catch (err) {
        console.error(`❌ Failed to send DiagnosticsStatusNotification: ${err}`);
    }
}

/**
 * Handle incoming GetDiagnostics request
 * 
 * ⚠️ THIS IS THE VULNERABLE HANDLER ⚠️
 */
async function handleGetDiagnostics(messageId: string, payload: any): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🔔 RECEIVED GetDiagnostics REQUEST');
    console.log('='.repeat(60));
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    const { location, startTime, stopTime, retries, retryInterval } = payload;

    if (!location) {
        console.log('❌ No location specified in request');
        sendCallResult(messageId, { fileName: '' });
        return;
    }

    // Generate filename for response
    const fileName = `diagnostics_${CHARGE_POINT_ID}_${Date.now()}.zip`;

    // Respond immediately with filename (as per OCPP spec)
    sendCallResult(messageId, { fileName });

    // Start upload process
    console.log('\n🚀 Starting diagnostics upload process...');

    // Notify CSMS that upload is starting
    await sendDiagnosticsStatus('Uploading');

    // Perform the upload (VULNERABLE - no URL validation!)
    const success = await uploadDiagnostics(location);

    // Notify CSMS of final status
    if (success) {
        await sendDiagnosticsStatus('Uploaded');
    } else {
        await sendDiagnosticsStatus('UploadFailed');
    }

    console.log('='.repeat(60) + '\n');
}

/**
 * Handle incoming OCPP messages
 */
function handleMessage(data: WebSocket.Data): void {
    try {
        const message = JSON.parse(data.toString());
        const messageType = message[0];

        switch (messageType) {
            case CALL: {
                // Incoming request from CSMS
                const [, msgId, action, payload] = message;
                console.log(`\n📥 [CALL] ${action} from CSMS`);

                switch (action) {
                    case 'GetDiagnostics':
                        handleGetDiagnostics(msgId, payload);
                        break;

                    case 'Reset':
                        console.log('🔄 Reset requested');
                        sendCallResult(msgId, { status: 'Accepted' });
                        break;

                    case 'ChangeConfiguration':
                        console.log('⚙️ ChangeConfiguration requested');
                        sendCallResult(msgId, { status: 'Accepted' });
                        break;

                    case 'GetConfiguration':
                        console.log('📋 GetConfiguration requested');
                        sendCallResult(msgId, {
                            configurationKey: [
                                { key: 'HeartbeatInterval', readonly: false, value: '60' },
                                { key: 'ConnectionTimeOut', readonly: false, value: '30' },
                            ],
                            unknownKey: []
                        });
                        break;

                    case 'RemoteStartTransaction':
                        console.log('▶️ RemoteStartTransaction requested');
                        sendCallResult(msgId, { status: 'Accepted' });
                        break;

                    case 'RemoteStopTransaction':
                        console.log('⏹️ RemoteStopTransaction requested');
                        sendCallResult(msgId, { status: 'Accepted' });
                        break;

                    default:
                        console.log(`⚠️ Unhandled action: ${action}`);
                        sendCallResult(msgId, {});
                }
                break;
            }

            case CALL_RESULT: {
                // Response to our request
                const [, msgId, payload] = message;
                const resolver = pendingRequests.get(msgId);
                if (resolver) {
                    pendingRequests.delete(msgId);
                    resolver(payload);
                }
                break;
            }

            case CALL_ERROR: {
                // Error response
                const [, msgId, errorCode, errorDescription] = message;
                console.error(`❌ [CALL_ERROR] ${errorCode}: ${errorDescription}`);
                const resolver = pendingRequests.get(msgId);
                if (resolver) {
                    pendingRequests.delete(msgId);
                    resolver({ error: errorCode, description: errorDescription });
                }
                break;
            }
        }
    } catch (err) {
        console.error('❌ Failed to parse message:', err);
    }
}

/**
 * Perform BootNotification handshake
 */
async function bootNotification(): Promise<boolean> {
    console.log('\n📡 Sending BootNotification...');

    try {
        const response = await sendCall('BootNotification', {
            chargePointVendor: CHARGE_POINT_VENDOR,
            chargePointModel: CHARGE_POINT_MODEL,
            chargePointSerialNumber: 'SN-001234',
            chargeBoxSerialNumber: 'CB-001234',
            firmwareVersion: '1.0.0-vulnerable',
            iccid: '',
            imsi: '',
            meterType: 'VirtualMeter',
            meterSerialNumber: 'VM-001234',
        });

        console.log('📥 BootNotification response:', JSON.stringify(response, null, 2));

        if (response.status === 'Accepted') {
            console.log('✅ BootNotification accepted!');

            // Start heartbeat based on interval from CSMS
            const interval = (response.interval || 60) * 1000;
            startHeartbeat(interval);

            return true;
        } else {
            console.log(`⚠️ BootNotification status: ${response.status}`);
            return false;
        }
    } catch (err) {
        console.error('❌ BootNotification failed:', err);
        return false;
    }
}

/**
 * Start heartbeat timer
 */
function startHeartbeat(intervalMs: number): void {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    console.log(`💓 Starting heartbeat every ${intervalMs / 1000}s`);

    heartbeatInterval = setInterval(async () => {
        try {
            const response = await sendCall('Heartbeat', {});
            console.log(`💓 Heartbeat response: ${response.currentTime}`);
        } catch (err) {
            console.error('❌ Heartbeat failed:', err);
        }
    }, intervalMs);
}

/**
 * Connect to CSMS
 */
function connect(): void {
    console.log('\n' + '═'.repeat(60));
    console.log('🔌 VULNERABLE CHARGE POINT SIMULATOR');
    console.log('═'.repeat(60));
    console.log(`📍 Charge Point ID: ${CHARGE_POINT_ID}`);
    console.log(`🌐 Connecting to: ${STEVE_WS_URL}`);
    console.log('═'.repeat(60) + '\n');

    ws = new WebSocket(STEVE_WS_URL, ['ocpp1.6'], {
        handshakeTimeout: 10000,
    });

    ws.on('open', async () => {
        console.log('✅ WebSocket connected to CSMS!');

        // Perform boot notification
        const accepted = await bootNotification();

        if (accepted) {
            console.log('\n' + '─'.repeat(60));
            console.log('⏳ Waiting for CSMS commands...');
            console.log('💡 Send GetDiagnostics from Steve UI to trigger the vulnerability');
            console.log('─'.repeat(60) + '\n');
        }
    });

    ws.on('message', handleMessage);

    ws.on('close', (code, reason) => {
        console.log(`\n🔌 WebSocket closed: ${code} - ${reason.toString()}`);

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }

        // Reconnect after delay
        console.log(`🔄 Reconnecting in ${RECONNECT_INTERVAL / 1000}s...`);
        setTimeout(connect, RECONNECT_INTERVAL);
    });

    ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err.message);
    });
}

// Start the simulator
connect();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down charge point simulator...');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (ws) ws.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down charge point simulator...');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (ws) ws.close();
    process.exit(0);
});
