'use client';

import { motion } from 'framer-motion';
import {
    Wifi,
    Key,
    Shield,
    Globe,
    Lock,
    AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SensitiveMatch } from '@/lib/useSocket';

interface SensitiveDataCardProps {
    data: SensitiveMatch;
    index: number;
}

// Map keywords to icons and categories
const keywordConfig: Record<string, {
    icon: React.ElementType;
    category: string;
    color: string;
    bgColor: string;
}> = {
    password: {
        icon: Key,
        category: 'Şifre',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    passwd: {
        icon: Key,
        category: 'Şifre',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    pwd: {
        icon: Key,
        category: 'Şifre',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    psk: {
        icon: Wifi,
        category: 'WiFi Şifresi',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    ssid: {
        icon: Wifi,
        category: 'WiFi Ağı',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    wpa_psk: {
        icon: Wifi,
        category: 'WPA Şifresi',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    wpa_passphrase: {
        icon: Wifi,
        category: 'WPA Şifresi',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    api_key: {
        icon: Globe,
        category: 'API Anahtarı',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    apikey: {
        icon: Globe,
        category: 'API Anahtarı',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    token: {
        icon: Shield,
        category: 'Token',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
    },
    secret: {
        icon: Lock,
        category: 'Gizli Anahtar',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    credential: {
        icon: Key,
        category: 'Kimlik Bilgisi',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    private_key: {
        icon: Lock,
        category: 'Özel Anahtar',
        color: 'text-red-600',
        bgColor: 'bg-red-600/10',
    },
    auth: {
        icon: Shield,
        category: 'Yetkilendirme',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
    },
};

// Extract the actual value from context
function extractValue(context: string): { label: string; value: string } | null {
    // Try to match patterns like key="value" or key=value
    const patterns = [
        /(?:password|passwd|pwd|psk|ssid|auth_password|api_key|secret)[=:]\s*["']?([^"'\s\n]+)["']?/i,
        /["']([^"']+)["']/,
    ];

    for (const pattern of patterns) {
        const match = context.match(pattern);
        if (match && match[1]) {
            return { label: 'Değer', value: match[1] };
        }
    }

    return null;
}

// Mask sensitive value for display (show first/last chars)
function maskValue(value: string, showChars: number = 3): string {
    if (value.length <= showChars * 2) {
        return '*'.repeat(value.length);
    }
    const start = value.substring(0, showChars);
    const end = value.substring(value.length - showChars);
    const middle = '*'.repeat(Math.min(value.length - showChars * 2, 8));
    return `${start}${middle}${end}`;
}

export function SensitiveDataCard({ data, index }: SensitiveDataCardProps) {
    const config = keywordConfig[data.keyword.toLowerCase()] || {
        icon: AlertTriangle,
        category: 'Hassas Veri',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
    };

    const Icon = config.icon;
    const extracted = extractValue(data.context);

    return (
        <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
            className={`relative p-3 rounded-lg border ${config.bgColor} border-opacity-30 overflow-hidden group`}
        >
            {/* Animated border effect */}
            <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                    background: `linear-gradient(90deg, transparent, ${config.color.replace('text-', 'rgba(')}, 0.1), transparent)`,
                }}
            />

            <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${config.color} border-current`}>
                            {config.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            Satır {data.line}
                        </span>
                    </div>

                    {/* Extracted value display */}
                    {extracted && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">{extracted.label}:</span>
                            <code className={`text-sm font-bold ${config.color} bg-black/20 px-2 py-0.5 rounded`}>
                                {maskValue(extracted.value)}
                            </code>
                            <motion.button
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    // Could add a reveal feature here
                                }}
                            >
                                👁️
                            </motion.button>
                        </div>
                    )}

                    {/* Full context */}
                    <div className="font-mono text-xs text-muted-foreground bg-black/10 rounded px-2 py-1 overflow-x-auto">
                        <code className="whitespace-nowrap">{data.context}</code>
                    </div>
                </div>

                {/* Severity indicator */}
                <motion.div
                    className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>
        </motion.div>
    );
}

// Summary stats component
interface SensitiveDataSummaryProps {
    sensitiveData: SensitiveMatch[];
}

export function SensitiveDataSummary({ sensitiveData }: SensitiveDataSummaryProps) {
    // Count by category
    const categoryCounts: Record<string, number> = {};

    sensitiveData.forEach(data => {
        const config = keywordConfig[data.keyword.toLowerCase()];
        const category = config?.category || 'Diğer';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(([category, count]) => {
                const config = Object.values(keywordConfig).find(c => c.category === category);
                const Icon = config?.icon || AlertTriangle;
                const color = config?.color || 'text-destructive';

                return (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config?.bgColor || 'bg-destructive/10'} border border-opacity-30`}
                    >
                        <Icon className={`h-3 w-3 ${color}`} />
                        <span className={`text-xs font-medium ${color}`}>{category}</span>
                        <Badge variant="secondary" className="h-4 px-1 text-xs">
                            {count}
                        </Badge>
                    </motion.div>
                );
            })}
        </div>
    );
}
