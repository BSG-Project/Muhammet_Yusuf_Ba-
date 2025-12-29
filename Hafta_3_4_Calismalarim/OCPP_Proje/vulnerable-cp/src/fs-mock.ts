/**
 * Mock File System
 * 
 * Simulates sensitive configuration files that exist on a real charge point.
 * These files contain cleartext credentials that should NEVER be exposed.
 * 
 * This demonstrates the vulnerability: when GetDiagnostics uploads logs
 * without proper URL validation, these secrets get sent to the attacker.
 * 
 * Reference: AGENT.md cite:7, cite:21
 */

/**
 * Simulated wpa_supplicant.conf - WiFi configuration with cleartext password
 */
export const WPA_SUPPLICANT_CONF = `# /etc/wpa_supplicant/wpa_supplicant.conf
# WARNING: This file contains sensitive credentials!
# Last modified: 2024-12-20

ctrl_interface=/var/run/wpa_supplicant
update_config=1
country=TR

network={
    ssid="CompanySecure"
    psk="Admin123!"
    key_mgmt=WPA-PSK
    priority=5
}

network={
    ssid="ChargePointBackup"
    psk="Backup@2024#Secure"
    key_mgmt=WPA-PSK
    priority=3
}

network={
    ssid="MaintenanceWiFi"
    psk="M4int3n4nc3P@ss"
    key_mgmt=WPA-PSK
    priority=1
}
`;

/**
 * Simulated OCPP client configuration with backend credentials
 */
export const OCPP_CONFIG = `# /etc/chargepoint/ocpp.conf
# OCPP Client Configuration
# DO NOT SHARE - Contains authentication credentials

[connection]
csms_url=ws://csms.company.com:8180/ocpp
charge_point_id=CP001
connection_timeout=30

[authentication]
# Basic Auth credentials for CSMS
auth_username=cp_service_account
auth_password=CsmsP@ssw0rd!2024

# Client certificate paths
client_cert=/etc/chargepoint/certs/client.pem
client_key=/etc/chargepoint/certs/client.key
# Private key password
key_password=CertKeyP@ss!

[backend_api]
# REST API for remote management
api_endpoint=https://api.company.com/chargepoints
api_key=sk_test_mock_api_key_for_demo
api_secret=whsec_mock_secret_for_demo

[database]
# Local SQLite for transaction logs
db_path=/var/lib/chargepoint/transactions.db
db_password=LocalDb#Secret
`;

/**
 * Simulated system info with network details
 */
export const SYSTEM_INFO = `# /var/log/chargepoint/system_info.log
# System Information Dump
# Generated: 2024-12-25 10:30:00

=== SYSTEM ===
Hostname: CP001-Istanbul
Model: PowerCharge Pro 150kW
Firmware: v2.4.1
Serial: PCH-2024-001234

=== NETWORK ===
eth0: 192.168.1.50/24
wlan0: 192.168.2.105/24
Default Gateway: 192.168.1.1
DNS: 8.8.8.8, 8.8.4.4

=== WIFI STATUS ===
SSID: CompanySecure
Signal: -45 dBm
Frequency: 5.2 GHz
Security: WPA2-PSK

=== VPN ===
OpenVPN Status: Connected
VPN Server: vpn.company.com
VPN Username: chargepoint_cp001
VPN Password: VpnAccess@2024

=== REMOTE ACCESS ===
SSH: Enabled (Port 22)
SSH User: admin
SSH Password: SshAdmin#2024

Telnet: Enabled (Port 23)
Telnet Password: TelnetPass123
`;

/**
 * Simulated error logs with stack traces (might contain paths/info)
 */
export const ERROR_LOG = `# /var/log/chargepoint/error.log
# Error log - Last 50 entries

[2024-12-25 08:15:32] ERROR: OCPP connection failed
  Reason: Authentication failed
  URL: ws://csms.company.com:8180/ocpp
  Credentials used: cp_service_account / CsmsP@ssw0rd!2024
  
[2024-12-25 08:20:15] WARN: Payment gateway timeout
  Gateway: https://payment.company.com/api/v1
  API Key: pk_test_mock_key_12345
  
[2024-12-25 09:00:00] INFO: Firmware update check
  Update server: https://firmware.company.com
  Auth token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret
`;

/**
 * Get all mock files as a combined diagnostics dump
 */
export function getDiagnosticsContent(): string {
    return [
        '========================================',
        'CHARGE POINT DIAGNOSTICS DUMP',
        'Generated: ' + new Date().toISOString(),
        '========================================',
        '',
        '### FILE: /etc/wpa_supplicant/wpa_supplicant.conf ###',
        WPA_SUPPLICANT_CONF,
        '',
        '### FILE: /etc/chargepoint/ocpp.conf ###',
        OCPP_CONFIG,
        '',
        '### FILE: /var/log/chargepoint/system_info.log ###',
        SYSTEM_INFO,
        '',
        '### FILE: /var/log/chargepoint/error.log ###',
        ERROR_LOG,
        '',
        '======== END OF DIAGNOSTICS ========',
    ].join('\n');
}

/**
 * Get mock files as individual entries for ZIP creation
 */
export function getMockFiles(): { name: string; content: string }[] {
    return [
        { name: 'etc/wpa_supplicant/wpa_supplicant.conf', content: WPA_SUPPLICANT_CONF },
        { name: 'etc/chargepoint/ocpp.conf', content: OCPP_CONFIG },
        { name: 'var/log/chargepoint/system_info.log', content: SYSTEM_INFO },
        { name: 'var/log/chargepoint/error.log', content: ERROR_LOG },
    ];
}
