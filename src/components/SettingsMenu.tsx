'use client';

import { useState, useRef } from 'react';
import { exportDatabase, importDatabase } from '@/lib/db';
import { Download, Upload, Settings, X, FileJson } from 'lucide-react';
import { saveAs } from 'file-saver';

export function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);
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
                setImportStatus(`Imported ${result.added} new, updated ${result.updated}. Errors: ${result.errors.length}`);
                console.warn('Import errors:', result.errors);
            } else {
                setImportStatus(`Success! Added ${result.added}, Updated ${result.updated}.`);
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            setImportStatus('Failed to read file.');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition bg-white rounded-full shadow-sm"
                title="Settings & Backup"
            >
                <Settings className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-600" />
                            Settings & Backup
                        </h2>

                        <div className="space-y-6">
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                                    <Download className="w-4 h-4" /> Export Data
                                </h3>
                                <p className="text-sm text-indigo-700 mb-3">
                                    Download your transaction history as a JSON file to back it up or move it to another device.
                                </p>
                                <button
                                    onClick={handleExport}
                                    className="w-full bg-white border border-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                                >
                                    <FileJson className="w-4 h-4" /> Download Backup
                                </button>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Import Data
                                </h3>
                                <p className="text-sm text-purple-700 mb-3">
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
                                    className="w-full bg-white border border-purple-200 text-purple-700 font-medium py-2 px-4 rounded-lg hover:bg-purple-100 transition flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-4 h-4" /> Select Backup File
                                </button>
                                {importStatus && (
                                    <div className="mt-3 text-xs font-mono bg-white p-2 rounded border border-purple-200 text-purple-800 break-words">
                                        {importStatus}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 text-center text-xs text-gray-400">
                            Remittance Tracker v1.0 • Client-side Storage
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
