'use client';

import {
  ShieldAlert,
  Lock,
  FileWarning,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSocket, StolenFileEvent } from '@/lib/useSocket';
import { NetworkTopology } from '@/components/NetworkTopology';
import { CriticalAlertModal } from '@/components/CriticalAlertModal';
import { SensitiveDataCard, SensitiveDataSummary } from '@/components/SensitiveDataCard';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const {
    isConnected,
    isConnecting,
    logs,
    stolenFiles,
    attackPhase,
    latestAlert,
    clearAlert,
    simulateAttack,
  } = useSocket();

  const [selectedFile, setSelectedFile] = useState<StolenFileEvent | null>(null);

  // Get connection status display
  const getConnectionStatus = () => {
    if (isConnecting) return { text: 'Bağlanıyor...', color: 'bg-yellow-500 animate-pulse' };
    if (isConnected) return { text: 'Attacker Server Bağlı', color: 'bg-green-500 glow-green' };
    return { text: 'Bağlantı Yok', color: 'bg-red-500' };
  };

  const connectionStatus = getConnectionStatus();
  const criticalCount = logs.filter(l => l.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-background dark">
      {/* Critical Alert Modal */}
      <CriticalAlertModal
        alert={latestAlert}
        onClose={() => {
          clearAlert();
          if (latestAlert) {
            setSelectedFile(latestAlert);
          }
        }}
      />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-destructive/10 rounded-lg"
                animate={criticalCount > 0 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: criticalCount > 0 ? Infinity : 0 }}
              >
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  OCPP Security Monitor
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tehdit İstihbarat Paneli
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Demo button */}
              <motion.button
                onClick={simulateAttack}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm text-primary transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={attackPhase !== 'idle'}
              >
                {attackPhase === 'idle' ? (
                  <>
                    <Play className="h-4 w-4" />
                    Demo Saldırı
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Devam Ediyor...
                  </>
                )}
              </motion.button>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${connectionStatus.color}`} />
                <span className="text-sm text-muted-foreground">
                  {connectionStatus.text}
                </span>
              </div>

              {/* Stats */}
              <Badge variant="outline" className="gap-1">
                <FileWarning className="h-3 w-3" />
                {stolenFiles.length} Dosya Yakalandı
              </Badge>

              <Badge
                variant="destructive"
                className={criticalCount > 0 ? 'pulse-alert' : ''}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {criticalCount} Kritik
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Left Panel - Network Topology */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Ağ Topolojisi
                    </CardTitle>
                    <CardDescription>
                      Saldırı akışı görselleştirmesi
                    </CardDescription>
                  </div>
                  <Badge
                    variant={attackPhase !== 'idle' ? 'destructive' : 'outline'}
                    className={attackPhase !== 'idle' ? 'animate-pulse' : ''}
                  >
                    {attackPhase !== 'idle' ? 'SALDIRI!' : 'Canlı'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <NetworkTopology
                  attackPhase={attackPhase}
                  isConnected={isConnected}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Live Threat Log */}
          <div className="col-span-12 lg:col-span-7">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileWarning className="h-5 w-5 text-destructive" />
                      Canlı Tehdit Günlüğü
                    </CardTitle>
                    <CardDescription>
                      Gerçek zamanlı güvenlik olayları
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {logs.length} Olay
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden max-h-[350px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[80px]">Zaman</TableHead>
                        <TableHead className="w-[80px]">Seviye</TableHead>
                        <TableHead className="w-[100px]">Kaynak</TableHead>
                        <TableHead>Olay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {logs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              Olaylar bekleniyor...
                            </TableCell>
                          </TableRow>
                        ) : (
                          logs.map((log) => (
                            <motion.tr
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className={`cursor-pointer transition-colors hover:bg-muted/50 ${log.severity === 'critical' ? 'bg-destructive/10' : ''
                                }`}
                              onClick={() => log.data && setSelectedFile(log.data)}
                            >
                              <TableCell className="font-mono text-xs">
                                {log.timestamp.toLocaleTimeString('tr-TR')}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    log.severity === 'critical' ? 'destructive' :
                                      log.severity === 'high' ? 'destructive' :
                                        log.severity === 'medium' ? 'default' :
                                          'secondary'
                                  }
                                  className={log.severity === 'critical' ? 'pulse-alert text-xs' : 'text-xs'}
                                >
                                  {log.severity === 'critical' ? 'KRİTİK' :
                                    log.severity === 'high' ? 'YÜKSEK' :
                                      log.severity === 'medium' ? 'ORTA' :
                                        log.severity === 'low' ? 'DÜŞÜK' : 'BİLGİ'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {log.source}
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">
                                {log.message}
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Waiting indicator */}
                {logs.length === 0 && (
                  <div className="mt-4">
                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertTitle>Beklemede</AlertTitle>
                      <AlertDescription>
                        Sistem saldırı simülasyonu için hazır. &quot;Demo Saldırı&quot; butonuna tıklayın
                        veya gerçek GetDiagnostics komutu gönderin.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Panel - Stolen Data Analysis */}
          <div className="col-span-12">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-destructive" />
                      Çalınan Veri Analizi
                    </CardTitle>
                    <CardDescription>
                      Yakalanan dosyalardan çıkarılan hassas bilgiler
                    </CardDescription>
                  </div>
                  {selectedFile && (
                    <Badge variant="destructive" className="gap-1">
                      <FileWarning className="h-3 w-3" />
                      {selectedFile.analysis.sensitiveDataCount} Sır Bulundu
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {selectedFile ? (
                    <motion.div
                      key={selectedFile.filename}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* File Info */}
                      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <FileWarning className="h-10 w-10 text-destructive" />
                        <div className="flex-1">
                          <p className="font-medium font-mono">{selectedFile.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(2)} KB •
                            Çalındı: {new Date(selectedFile.stolenAt).toLocaleString('tr-TR')} •
                            IP: {selectedFile.sourceIP}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={selectedFile.analysis.isZip ? 'default' : 'secondary'}>
                            {selectedFile.analysis.isZip ? 'ZIP' : 'TEXT'}
                          </Badge>
                          <Progress value={100} className="w-24 mt-2" />
                        </div>
                      </div>

                      {/* Extracted files (if ZIP) */}
                      {selectedFile.analysis.extractedFiles && selectedFile.analysis.extractedFiles.length > 0 && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-2">Çıkarılan Dosyalar:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedFile.analysis.extractedFiles.map((file, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs font-mono">
                                {file.split('/').pop()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sensitive Data Summary */}
                      {selectedFile.analysis.sensitiveData.length > 0 && (
                        <SensitiveDataSummary sensitiveData={selectedFile.analysis.sensitiveData} />
                      )}

                      {/* Sensitive Data List */}
                      <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                        {selectedFile.analysis.sensitiveData.length > 0 ? (
                          selectedFile.analysis.sensitiveData.map((data, idx) => (
                            <SensitiveDataCard key={idx} data={data} index={idx} />
                          ))
                        ) : (
                          <p className="text-center py-4 text-muted-foreground">
                            Hassas veri detayları burada görüntülenecek
                          </p>
                        )}
                      </div>

                      {/* File Preview */}
                      {selectedFile.analysis.preview && (
                        <div className="p-4 bg-slate-950 rounded-lg">
                          <p className="text-xs text-slate-400 mb-2">Dosya Önizleme:</p>
                          <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                            {selectedFile.analysis.preview}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Lock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">Dosya Seçilmedi</p>
                      <p className="text-sm">
                        Çalınan veri analizini görüntülemek için yukarıdaki tehdit olaylarından birine tıklayın
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>OCPP Güvenlik Açığı PoC - Yalnızca Eğitim Amaçlı</p>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Sistem Aktif</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Bağlantı Bekleniyor</span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
