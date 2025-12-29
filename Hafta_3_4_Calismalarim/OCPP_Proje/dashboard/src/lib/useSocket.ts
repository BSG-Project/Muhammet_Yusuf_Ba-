'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
export interface SensitiveMatch {
    keyword: string;
    line: number;
    context: string;
}

export interface StolenFileEvent {
    filename: string;
    originalName: string;
    size: number;
    stolenAt: Date;
    sourceIP: string;
    analysis: {
        isZip: boolean;
        extractedFiles?: string[];
        sensitiveDataCount: number;
        sensitiveData: SensitiveMatch[];
        preview?: string;
    };
}

export interface ServerStatus {
    status: 'online' | 'offline';
    stolenFilesCount: number;
    connectedAt: Date;
}

export interface AttackLog {
    id: string;
    timestamp: Date;
    type: 'connection' | 'command' | 'file_stolen' | 'alert';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    source: string;
    message: string;
    data?: StolenFileEvent;
}

export type AttackPhase = 'idle' | 'command_sent' | 'exfiltrating' | 'complete';

interface UseSocketReturn {
    isConnected: boolean;
    isConnecting: boolean;
    logs: AttackLog[];
    stolenFiles: StolenFileEvent[];
    attackPhase: AttackPhase;
    serverStatus: ServerStatus | null;
    latestAlert: StolenFileEvent | null;
    clearAlert: () => void;
    simulateAttack: () => void; // For testing without full system
}

const ATTACKER_SERVER_URL = process.env.NEXT_PUBLIC_ATTACKER_URL || 'http://localhost:3001';

export function useSocket(): UseSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [logs, setLogs] = useState<AttackLog[]>([]);
    const [stolenFiles, setStolenFiles] = useState<StolenFileEvent[]>([]);
    const [attackPhase, setAttackPhase] = useState<AttackPhase>('idle');
    const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
    const [latestAlert, setLatestAlert] = useState<StolenFileEvent | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const logIdCounter = useRef(0);

    // Helper to add a log entry
    const addLog = useCallback((
        type: AttackLog['type'],
        severity: AttackLog['severity'],
        source: string,
        message: string,
        data?: StolenFileEvent
    ) => {
        const newLog: AttackLog = {
            id: `log-${++logIdCounter.current}-${Date.now()}`,
            timestamp: new Date(),
            type,
            severity,
            source,
            message,
            data,
        };
        setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
        return newLog;
    }, []);

    // Simulate attack for demo/testing
    const simulateAttack = useCallback(() => {
        // Phase 1: Command received
        setAttackPhase('command_sent');
        addLog('command', 'high', 'Steve CSMS', 'GetDiagnostics command sent to CP001');

        setTimeout(() => {
            addLog('command', 'medium', 'CP001', 'GetDiagnostics received, preparing diagnostics...');
        }, 500);

        // Phase 2: Exfiltration
        setTimeout(() => {
            setAttackPhase('exfiltrating');
            addLog('command', 'high', 'CP001', 'Uploading diagnostics to http://attacker:4000/upload');
        }, 1500);

        // Phase 3: File stolen
        setTimeout(() => {
            const mockStolenFile: StolenFileEvent = {
                filename: `diagnostics_CP001_${Date.now()}.zip`,
                originalName: 'diagnostics.zip',
                size: 4523,
                stolenAt: new Date(),
                sourceIP: '192.168.1.50',
                analysis: {
                    isZip: true,
                    extractedFiles: [
                        'etc/wpa_supplicant/wpa_supplicant.conf',
                        'etc/chargepoint/ocpp.conf',
                        'var/log/chargepoint/system_info.log',
                    ],
                    sensitiveDataCount: 12,
                    sensitiveData: [
                        { keyword: 'password', line: 8, context: 'psk="Admin123!"' },
                        { keyword: 'ssid', line: 6, context: 'ssid="CompanySecure"' },
                        { keyword: 'api_key', line: 15, context: 'api_key=sk_test_mock_api_key_for_demo' },
                        { keyword: 'password', line: 22, context: 'auth_password=CsmsP@ssw0rd!2024' },
                    ],
                    preview: '# WiFi Configuration\nssid="CompanySecure"\npsk="Admin123!"\n...',
                },
            };

            setStolenFiles(prev => [mockStolenFile, ...prev]);
            setLatestAlert(mockStolenFile);
            addLog('file_stolen', 'critical', 'Attacker Server',
                `FILE CAPTURED: ${mockStolenFile.filename} (${mockStolenFile.analysis.sensitiveDataCount} secrets found!)`,
                mockStolenFile
            );
            setAttackPhase('complete');

            // Reset to idle after animation completes
            setTimeout(() => {
                setAttackPhase('idle');
            }, 3000);
        }, 3000);
    }, [addLog]);

    const clearAlert = useCallback(() => {
        setLatestAlert(null);
    }, []);

    useEffect(() => {
        // Initialize socket connection
        setIsConnecting(true);

        const socket = io(ATTACKER_SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            console.log('🔌 Connected to Attacker Server');
            setIsConnected(true);
            setIsConnecting(false);
            addLog('connection', 'info', 'Dashboard', 'Connected to Attacker Server');
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Disconnected from Attacker Server:', reason);
            setIsConnected(false);
            addLog('connection', 'medium', 'Dashboard', `Disconnected: ${reason}`);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            setIsConnecting(false);
            setIsConnected(false);
        });

        // Server status event
        socket.on('server_status', (status: ServerStatus) => {
            console.log('📊 Server status:', status);
            setServerStatus(status);
            addLog('connection', 'info', 'Attacker Server',
                `Server online. ${status.stolenFilesCount} files previously captured.`);
        });

        // Main event: file_stolen
        socket.on('file_stolen', (data: StolenFileEvent) => {
            console.log('🚨 FILE STOLEN EVENT:', data);

            // Update attack phase
            setAttackPhase('exfiltrating');

            // Parse date if needed
            const stolenFile: StolenFileEvent = {
                ...data,
                stolenAt: new Date(data.stolenAt),
            };

            // Add to stolen files
            setStolenFiles(prev => [stolenFile, ...prev]);

            // Trigger alert
            setLatestAlert(stolenFile);

            // Add critical log
            addLog('file_stolen', 'critical', 'Attacker Server',
                `🚨 FILE CAPTURED: ${stolenFile.filename} - ${stolenFile.analysis.sensitiveDataCount} secrets extracted!`,
                stolenFile
            );

            // Transition to complete, then idle
            setTimeout(() => {
                setAttackPhase('complete');
                setTimeout(() => setAttackPhase('idle'), 3000);
            }, 500);
        });

        // Request initial file list
        socket.emit('get_stolen_files');

        socket.on('stolen_files_list', (files: Array<{ filename: string; size: number; stolenAt: Date }>) => {
            console.log('📂 Existing stolen files:', files.length);
            // Could populate historical data here if needed
        });

        // Cleanup
        return () => {
            socket.disconnect();
        };
    }, [addLog]);

    return {
        isConnected,
        isConnecting,
        logs,
        stolenFiles,
        attackPhase,
        serverStatus,
        latestAlert,
        clearAlert,
        simulateAttack,
    };
}
