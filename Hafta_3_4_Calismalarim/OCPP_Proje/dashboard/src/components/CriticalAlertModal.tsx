'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Lock, FileWarning, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StolenFileEvent } from '@/lib/useSocket';

interface CriticalAlertModalProps {
    alert: StolenFileEvent | null;
    onClose: () => void;
}

export function CriticalAlertModal({ alert, onClose }: CriticalAlertModalProps) {
    if (!alert) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={onClose}
                />

                {/* Alert container */}
                <motion.div
                    className="relative z-10 w-full max-w-lg bg-card border-2 border-destructive rounded-xl shadow-2xl overflow-hidden"
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 15 }}
                    style={{
                        boxShadow: '0 0 60px rgba(239, 68, 68, 0.3)',
                    }}
                >
                    {/* Animated border glow */}
                    <motion.div
                        className="absolute inset-0 border-2 border-destructive rounded-xl pointer-events-none"
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(239, 68, 68, 0.5)',
                                '0 0 40px rgba(239, 68, 68, 0.8)',
                                '0 0 20px rgba(239, 68, 68, 0.5)',
                            ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />

                    {/* Header */}
                    <div className="bg-destructive/20 border-b border-destructive p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                >
                                    <ShieldAlert className="h-8 w-8 text-destructive" />
                                </motion.div>
                                <div>
                                    <h2 className="text-xl font-bold text-destructive">
                                        🚨 KRİTİK UYARI
                                    </h2>
                                    <p className="text-sm text-destructive/80">
                                        Hassas veri sızıntısı tespit edildi!
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* File info */}
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <FileWarning className="h-8 w-8 text-destructive" />
                            <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm truncate">{alert.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(alert.size / 1024).toFixed(2)} KB •
                                    IP: {alert.sourceIP}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-destructive/10 rounded-lg text-center">
                                <p className="text-2xl font-bold text-destructive">
                                    {alert.analysis.sensitiveDataCount}
                                </p>
                                <p className="text-xs text-muted-foreground">Sır Bulundu</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg text-center">
                                <p className="text-2xl font-bold">
                                    {alert.analysis.extractedFiles?.length || 1}
                                </p>
                                <p className="text-xs text-muted-foreground">Dosya</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg text-center">
                                <Badge variant="destructive">KRİTİK</Badge>
                            </div>
                        </div>

                        {/* Sensitive data preview */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Lock className="h-4 w-4 text-destructive" />
                                Tespit Edilen Hassas Veriler:
                            </p>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {alert.analysis.sensitiveData.slice(0, 5).map((data, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex items-center gap-2 p-2 bg-destructive/5 rounded border border-destructive/20"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                                        <span className="font-mono text-xs truncate">
                                            <span className="text-destructive font-bold">[{data.keyword.toUpperCase()}]</span>
                                            {' '}{data.context}
                                        </span>
                                    </motion.div>
                                ))}
                                {alert.analysis.sensitiveData.length > 5 && (
                                    <p className="text-xs text-muted-foreground text-center py-1">
                                        +{alert.analysis.sensitiveData.length - 5} daha fazla...
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* File preview */}
                        {alert.analysis.preview && (
                            <div className="p-3 bg-slate-950 rounded-lg">
                                <p className="text-xs text-slate-400 mb-2">Dosya Önizleme:</p>
                                <pre className="text-xs text-green-400 font-mono overflow-x-auto max-h-20">
                                    {alert.analysis.preview}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-destructive/30 p-4">
                        <motion.button
                            onClick={onClose}
                            className="w-full py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Anladım - Detayları Göster
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
