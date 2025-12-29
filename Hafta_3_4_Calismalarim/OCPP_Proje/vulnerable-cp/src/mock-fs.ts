/**
 * Mock File System - Simulated Configuration Files
 * 
 * This module simulates configuration files that exist on a charge point.
 * When GetDiagnostics is exploited, these "files" get bundled and sent 
 * to the attacker's server.
 * 
 * NOTE: All data is fictional and for demonstration purposes only.
 */

// Simulated wpa_supplicant.conf with WiFi credentials
export const WPA_SUPPLICANT_CONF = `
# /etc/wpa_supplicant/wpa_supplicant.conf
# WiFi Configuration - DEMO DATA
ctrl_interface=/var/run/wpa_supplicant
update_config=1
country=TR

network={
    ssid="Demo_Corporate_WiFi"
    psk="DemoPassword123!"
    key_mgmt=WPA-PSK
    priority=10
}

network={
    ssid="Demo_Backup_Network"
    psk="BackupDemo@456"
    key_mgmt=WPA-PSK
    priority=5
}
`;

// Simulated OCPP configuration with backend credentials
export const OCPP_CONFIG = `
# /etc/chargepoint/ocpp.conf
# OCPP Backend Configuration - DEMO DATA

[connection]
csms_url=ws://demo-csms.example.com:8180/ocpp
charge_point_id=CP001

[authentication]
username=demo_admin
password=DemoAdminPass!2024
api_key=demo_key_abc123xyz789
`;

// Simulated system information
export const SYSTEM_INFO = `
# System Diagnostics - DEMO DATA
Hostname: CP001-DemoChargePoint
Model: DemoCharger-3000
Serial: DEMO-2024-001234

# Network Configuration
eth0_ip=192.168.1.100
gateway=192.168.1.1
dns=8.8.8.8

# Remote Access (DEMO)
ssh_user=demo_admin
ssh_password=DemoSSH@2024
`;

/**
 * Get all mock configuration as a single diagnostics dump
 */
export function getDiagnosticsData(): string {
    return [
        '='.repeat(50),
        'CHARGE POINT DIAGNOSTICS - DEMO',
        'Generated: ' + new Date().toISOString(),
        '='.repeat(50),
        '',
        WPA_SUPPLICANT_CONF,
        OCPP_CONFIG,
        SYSTEM_INFO,
        '',
        '='.repeat(50),
    ].join('\n');
}
