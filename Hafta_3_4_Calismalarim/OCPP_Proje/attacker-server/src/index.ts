/**
 * Attacker Server (Rogue FTP/HTTP Server)
 * 
 * This server simulates the attacker's infrastructure that receives
 * stolen diagnostic files from compromised OCPP charge points.
 * 
 * Features:
 * - HTTP POST endpoint for file uploads (simulating FTP/HTTP upload target)
 * - Real-time analysis of stolen files for sensitive data
 * - Socket.io broadcasting to dashboard for visualization
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeFile, AnalysisResult } from './file-analyzer.js';

// Configuration
const PORT = process.env.PORT || 3001;
const STOLEN_DATA_DIR = path.join(process.cwd(), 'stolen-data');

// Ensure stolen-data directory exists
if (!fs.existsSync(STOLEN_DATA_DIR)) {
    fs.mkdirSync(STOLEN_DATA_DIR, { recursive: true });
}

// Express app setup
const app = express();
const httpServer = createServer(app);

// Socket.io setup for real-time dashboard communication
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
}));
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, STOLEN_DATA_DIR);
    },
    filename: (_req, file, cb) => {
        // Add timestamp to filename to avoid collisions
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const originalName = file.originalname || 'unknown';
        cb(null, `${timestamp}_${originalName}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
});

// Track connected dashboard clients
let connectedClients = 0;

// Socket.io connection handling
io.on('connection', (socket) => {
    connectedClients++;
    console.log(`🖥️  Dashboard connected (${connectedClients} clients)`);

    // Send welcome message with server status
    socket.emit('server_status', {
        status: 'online',
        stolenFilesCount: fs.readdirSync(STOLEN_DATA_DIR).filter(f => f !== '.gitkeep').length,
        connectedAt: new Date(),
    });

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`🖥️  Dashboard disconnected (${connectedClients} clients)`);
    });

    // Allow dashboard to request list of stolen files
    socket.on('get_stolen_files', async () => {
        try {
            const files = fs.readdirSync(STOLEN_DATA_DIR)
                .filter(f => f !== '.gitkeep')
                .map(f => {
                    const filePath = path.join(STOLEN_DATA_DIR, f);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: f,
                        size: stats.size,
                        stolenAt: stats.mtime,
                    };
                });
            socket.emit('stolen_files_list', files);
        } catch (err) {
            console.error('Error listing stolen files:', err);
        }
    });
});

// ============================================
// HTTP Routes
// ============================================

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'online',
        service: 'attacker-server',
        time: new Date().toISOString(),
        connectedDashboards: connectedClients,
    });
});

/**
 * Main upload endpoint - receives stolen files
 * This simulates the FTP/HTTP upload target specified in GetDiagnostics
 */
app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 INCOMING STOLEN DATA!');
    console.log('='.repeat(60));

    if (!req.file) {
        console.log('❌ No file received');
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    const { filename, path: filePath, size } = req.file;

    console.log(`📁 File: ${filename}`);
    console.log(`📊 Size: ${size} bytes`);
    console.log(`💾 Saved to: ${filePath}`);

    // Analyze the stolen file
    let analysisResult: AnalysisResult;
    try {
        analysisResult = await analyzeFile(filePath);
    } catch (err) {
        console.error('❌ Analysis failed:', err);
        analysisResult = {
            filename,
            size,
            isZip: false,
            sensitiveData: [],
            analyzedAt: new Date(),
        };
    }

    // Prepare event data for dashboard
    const eventData = {
        filename,
        originalName: req.file.originalname,
        size,
        stolenAt: new Date(),
        sourceIP: req.ip || req.socket.remoteAddress || 'unknown',
        analysis: {
            isZip: analysisResult.isZip,
            extractedFiles: analysisResult.extractedFiles,
            sensitiveDataCount: analysisResult.sensitiveData.length,
            sensitiveData: analysisResult.sensitiveData,
            preview: analysisResult.rawContent,
        },
    };

    // Broadcast to all connected dashboards
    console.log(`\n📡 Broadcasting 'file_stolen' event to ${connectedClients} dashboard(s)...`);
    io.emit('file_stolen', eventData);

    // Log summary
    if (analysisResult.sensitiveData.length > 0) {
        console.log('\n🚨 SENSITIVE DATA EXTRACTED:');
        analysisResult.sensitiveData.slice(0, 5).forEach((match, i) => {
            console.log(`   ${i + 1}. [${match.keyword}] ${match.context.substring(0, 60)}...`);
        });
        if (analysisResult.sensitiveData.length > 5) {
            console.log(`   ... and ${analysisResult.sensitiveData.length - 5} more matches`);
        }
    }

    console.log('='.repeat(60) + '\n');

    res.json({
        success: true,
        message: 'File received and analyzed',
        filename,
        sensitiveDataFound: analysisResult.sensitiveData.length,
    });
});

/**
 * Alternative PUT endpoint (some OCPP implementations use PUT)
 */
app.put('/upload/*', upload.single('file'), async (req: Request, res: Response) => {
    // Redirect to POST handler logic
    const handler = app._router.stack.find((layer: any) =>
        layer.route?.path === '/upload' && layer.route?.methods?.post
    );
    if (handler) {
        return handler.handle(req, res, () => { });
    }
    res.status(200).send('OK');
});

/**
 * List all stolen files
 */
app.get('/files', (_req: Request, res: Response) => {
    try {
        const files = fs.readdirSync(STOLEN_DATA_DIR)
            .filter(f => f !== '.gitkeep')
            .map(f => {
                const filePath = path.join(STOLEN_DATA_DIR, f);
                const stats = fs.statSync(filePath);
                return {
                    filename: f,
                    size: stats.size,
                    stolenAt: stats.mtime,
                };
            });
        res.json({ files, count: files.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to list files' });
    }
});

/**
 * Get content of a specific stolen file
 */
app.get('/files/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;
    const filePath = path.join(STOLEN_DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
    }

    res.download(filePath);
});

// ============================================
// Start Server
// ============================================

httpServer.listen(PORT, () => {
    console.log('\n' + '═'.repeat(60));
    console.log('🏴‍☠️  ATTACKER SERVER ONLINE');
    console.log('═'.repeat(60));
    console.log(`📡 HTTP Server: http://localhost:${PORT}`);
    console.log(`📤 Upload Endpoint: POST http://localhost:${PORT}/upload`);
    console.log(`🔌 Socket.io: ws://localhost:${PORT}`);
    console.log(`📂 Stolen data dir: ${STOLEN_DATA_DIR}`);
    console.log('═'.repeat(60));
    console.log('⏳ Waiting for incoming stolen data...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down attacker server...');
    io.close();
    httpServer.close();
    process.exit(0);
});
