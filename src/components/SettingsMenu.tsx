'use client';

import { useState, useRef } from 'react';
import { exportDatabase, importDatabase } from '@/lib/db';
import { Download, Upload, Settings, X, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import { saveAs } from 'file-saver';

export function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [importStatus, setImportStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            const json = await exportDatabase();
            const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
            saveAs(blob, `remittance-backup-${new Date().toISOString().split('T')[0]}.json`);
        } catch (e) {
            console.error('Export failed', e);
            alert('Failed to export data');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const result = await importDatabase(text);
            if (result.errors.length > 0) {
                setImportStatus({
                    msg: `Imported ${result.added} new, updated ${result.updated}. ${result.errors.length} errors.`,
                    type: 'error'
                });
                console.warn('Import errors:', result.errors);
            } else {
                setImportStatus({
                    msg: `Success! Added ${result.added}, Updated ${result.updated} records.`,
                    type: 'success'
                });
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            setImportStatus({ msg: 'Failed to read file.', type: 'error' });
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition rounded-full"
                title="Settings & Backup"
                aria-label="Settings"
            >
                <Settings className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 h-[100dvh]">
                    <div className="bg-card text-card-foreground rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 border border-border max-h-[90dvh] overflow-y-auto">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition rounded-full p-1 hover:bg-secondary"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Settings & Backup
                        </h2>

                        <div className="space-y-4">
                            {/* Export */}
                            <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
                                    <Download className="w-4 h-4" /> Export Data
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                    Download your transaction history as a JSON file to back it up or move it to another device.
                                </p>
                                <button
                                    onClick={handleExport}
                                    className="w-full bg-background border border-border hover:bg-secondary/50 text-foreground font-medium py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <FileJson className="w-4 h-4" /> Download Backup
                                </button>
                            </div>

                            {/* Import */}
                            <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
                                    <Upload className="w-4 h-4" /> Import Data
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                    Restore your history from a backup file. Existing transactions will be updated.
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json"
                                    className="hidden"
                                />
                                <button
                                    onClick={handleImportClick}
                                    className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-medium py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" /> Select Backup File
                                </button>

                                {importStatus && (
                                    <div className={`mt-4 text-xs p-3 rounded-lg border flex items-start gap-2 ${importStatus.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                                        : 'bg-destructive/10 border-destructive/20 text-destructive'
                                        }`}>
                                        {importStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                        <span className="break-words">{importStatus.msg}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                            Remittance Tracker v1.0 • Client-side Storage
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
