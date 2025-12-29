'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Server, Wifi, Lock, Zap, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AttackPhase } from '@/lib/useSocket';

interface NetworkTopologyProps {
    attackPhase: AttackPhase;
    isConnected: boolean;
}

// Animated data packet component
function DataPacket({
    from,
    to,
    color = 'red',
    delay = 0
}: {
    from: 'csms' | 'cp' | 'attacker';
    to: 'csms' | 'cp' | 'attacker';
    color?: 'red' | 'blue' | 'green';
    delay?: number;
}) {
    const positions = {
        csms: { x: 60, y: 80 },
        cp: { x: 200, y: 80 },
        attacker: { x: 200, y: 220 },
    };

    const colorMap = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#22c55e',
    };

    return (
        <motion.div
            className="absolute z-20"
            initial={{
                x: positions[from].x,
                y: positions[from].y,
                scale: 0,
                opacity: 0,
            }}
            animate={{
                x: positions[to].x,
                y: positions[to].y,
                scale: [0, 1.2, 1, 1.2, 0],
                opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
                duration: 1.5,
                delay,
                ease: 'easeInOut',
            }}
        >
            <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{
                    backgroundColor: colorMap[color],
                    boxShadow: `0 0 20px ${colorMap[color]}`,
                }}
            />
        </motion.div>
    );
}

// Connection line component
function ConnectionLine({
    x1, y1, x2, y2,
    active = false,
    alert = false,
    pulsing = false,
}: {
    x1: number; y1: number;
    x2: number; y2: number;
    active?: boolean;
    alert?: boolean;
    pulsing?: boolean;
}) {
    const baseColor = alert ? '#ef4444' : active ? '#3b82f6' : '#64748b';

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {/* Base line */}
            <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={baseColor}
                strokeWidth={alert ? 3 : 2}
                strokeOpacity={0.3}
            />

            {/* Animated overlay */}
            {(active || alert || pulsing) && (
                <motion.line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={baseColor}
                    strokeWidth={alert ? 4 : 2}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: 1,
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        pathLength: { duration: 0.5 },
                        opacity: { duration: 1.5, repeat: Infinity },
                    }}
                />
            )}

            {/* Glow effect for alert */}
            {alert && (
                <motion.line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#ef4444"
                    strokeWidth={8}
                    strokeOpacity={0.2}
                    filter="blur(4px)"
                    animate={{ strokeOpacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            )}
        </svg>
    );
}

// Network node component
function NetworkNode({
    icon: Icon,
    label,
    sublabel,
    status,
    position,
    alert = false,
    pulse = false,
}: {
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    status: 'normal' | 'active' | 'alert' | 'victim';
    position: { x: number; y: number };
    alert?: boolean;
    pulse?: boolean;
}) {
    const statusColors = {
        normal: 'bg-card border-border',
        active: 'bg-primary/10 border-primary',
        alert: 'bg-destructive/10 border-destructive',
        victim: 'bg-yellow-500/10 border-yellow-500',
    };

    const iconColors = {
        normal: 'text-muted-foreground',
        active: 'text-primary',
        alert: 'text-destructive',
        victim: 'text-yellow-500',
    };

    return (
        <motion.div
            className="absolute flex flex-col items-center gap-2"
            style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
            animate={pulse ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: pulse ? Infinity : 0 }}
        >
            <motion.div
                className={`p-4 rounded-xl border-2 shadow-lg ${statusColors[status]} relative`}
                animate={alert ? {
                    boxShadow: [
                        '0 0 0 0 rgba(239, 68, 68, 0)',
                        '0 0 20px 10px rgba(239, 68, 68, 0.3)',
                        '0 0 0 0 rgba(239, 68, 68, 0)',
                    ]
                } : {}}
                transition={{ duration: 1.5, repeat: alert ? Infinity : 0 }}
            >
                <Icon className={`h-8 w-8 ${iconColors[status]}`} />

                {alert && (
                    <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <AlertTriangle className="h-4 w-4 text-destructive fill-destructive" />
                    </motion.div>
                )}
            </motion.div>

            <span className="text-xs font-medium text-foreground">{label}</span>

            {sublabel && (
                <Badge
                    variant={status === 'alert' ? 'destructive' : status === 'victim' ? 'outline' : 'secondary'}
                    className="text-xs"
                >
                    {sublabel}
                </Badge>
            )}
        </motion.div>
    );
}

export function NetworkTopology({ attackPhase, isConnected }: NetworkTopologyProps) {
    const isIdle = attackPhase === 'idle';
    const isCommandSent = attackPhase === 'command_sent';
    const isExfiltrating = attackPhase === 'exfiltrating';
    const isComplete = attackPhase === 'complete';

    return (
        <div className="relative h-[350px] bg-muted/30 rounded-lg border overflow-hidden">
            {/* Background grid effect */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '20px 20px',
                }}
            />

            {/* Scan line effect */}
            <motion.div
                className="absolute inset-x-0 h-20 pointer-events-none"
                style={{
                    background: 'linear-gradient(transparent, rgba(59, 130, 246, 0.1), transparent)',
                }}
                animate={{ y: [-80, 350] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            {/* Connection Lines */}
            {/* CSMS to CP */}
            <ConnectionLine
                x1={100} y1={80}
                x2={170} y2={80}
                active={!isIdle}
                alert={isCommandSent}
                pulsing={isIdle && isConnected}
            />

            {/* CP to Attacker (vertical) */}
            <ConnectionLine
                x1={200} y1={110}
                x2={200} y2={190}
                active={isExfiltrating || isComplete}
                alert={isExfiltrating || isComplete}
            />

            {/* Data Packets */}
            <AnimatePresence>
                {isCommandSent && (
                    <DataPacket from="csms" to="cp" color="blue" />
                )}

                {(isExfiltrating || isComplete) && (
                    <>
                        <DataPacket from="cp" to="attacker" color="red" delay={0} />
                        <DataPacket from="cp" to="attacker" color="red" delay={0.3} />
                        <DataPacket from="cp" to="attacker" color="red" delay={0.6} />
                    </>
                )}
            </AnimatePresence>

            {/* Network Nodes */}
            <NetworkNode
                icon={Server}
                label="Steve CSMS"
                sublabel={isCommandSent ? 'Sending CMD' : 'Compromised'}
                status={isCommandSent ? 'active' : 'normal'}
                position={{ x: 60, y: 80 }}
                pulse={isCommandSent}
            />

            <NetworkNode
                icon={Wifi}
                label="CP001"
                sublabel={isExfiltrating ? 'UPLOADING!' : isComplete ? 'BREACHED' : 'Target'}
                status={isExfiltrating || isComplete ? 'victim' : 'normal'}
                position={{ x: 200, y: 80 }}
                alert={isExfiltrating}
                pulse={isExfiltrating}
            />

            <NetworkNode
                icon={Lock}
                label="Attacker Server"
                sublabel={isComplete ? 'DATA RECEIVED' : ':4000'}
                status={isComplete ? 'alert' : isExfiltrating ? 'active' : 'alert'}
                position={{ x: 200, y: 220 }}
                alert={isComplete}
                pulse={isComplete}
            />

            {/* Status indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <motion.div
                    className={`h-2 w-2 rounded-full ${isComplete ? 'bg-destructive' :
                            isExfiltrating ? 'bg-yellow-500' :
                                isIdle && isConnected ? 'bg-green-500' :
                                    'bg-muted-foreground'
                        }`}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs text-muted-foreground">
                    {isComplete ? 'BREACH DETECTED' :
                        isExfiltrating ? 'EXFILTRATION IN PROGRESS' :
                            isCommandSent ? 'COMMAND SENT' :
                                isConnected ? 'MONITORING' : 'OFFLINE'}
                </span>
            </div>

            {/* Attack phase indicator */}
            {!isIdle && (
                <motion.div
                    className="absolute top-3 right-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Badge variant="destructive" className="gap-1 animate-pulse">
                        <Zap className="h-3 w-3" />
                        ATTACK IN PROGRESS
                    </Badge>
                </motion.div>
            )}
        </div>
    );
}
