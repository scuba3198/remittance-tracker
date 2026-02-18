'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { fetchExchangeRate } from '@/services/currency';
import { RemittanceTransaction } from '@/domain/transaction';
import { TransactionId } from '@/domain/primitives';
import { Loader2, Save } from 'lucide-react';

export function TransactionForm() {
    const [rate, setRate] = useState<number | null>(null);
    const [loadingRate, setLoadingRate] = useState(false);
    const [gbp, setGbp] = useState<string>('');
    const [npr, setNpr] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Fetch rate on mount
    useEffect(() => {
        const loadRate = async () => {
            setLoadingRate(true);
            const result = await fetchExchangeRate();
            setLoadingRate(false);
            if (result.success) {
                setRate(result.value);
            } else {
                setError('Failed to fetch live rate. Please enter manually.');
            }
        };
        loadRate();
    }, []);

    // Recalculate NPR when GBP changes
    const handleGbpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setGbp(val);
        if (rate && val && !isNaN(parseFloat(val))) {
            setNpr((parseFloat(val) * rate).toFixed(2));
        } else if (val === '') {
            setNpr('');
        }
    };

    // Recalculate GBP when NPR changes (optional, but good UX)
    const handleNprChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNpr(val);
        if (rate && val && !isNaN(parseFloat(val))) {
            setGbp((parseFloat(val) / rate).toFixed(2));
        } else if (val === '') {
            setGbp('');
        }
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            setRate(val);
            // Update NPR based on new rate if GBP exists
            if (gbp && !isNaN(parseFloat(gbp))) {
                setNpr((parseFloat(gbp) * val).toFixed(2));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        // Create Domain Entity to validate
        const rawId = TransactionId.new();
        const result = RemittanceTransaction.create({
            id: rawId,
            sourceAmount: parseFloat(gbp),
            targetAmount: parseFloat(npr),
            exchangeRate: rate || 0,
            date: date,
            note: note || undefined,
        });

        if (!result.success) {
            if (result.error.type === 'ValidationError') {
                setError(`${result.error.field}: ${result.error.message}`);
            } else {
                setError(result.error.message);
            }
            return;
        }

        // Persist to Dexie
        try {
            await db.transactions.add({
                id: result.value.id,
                date: result.value.date,
                sourceAmount: result.value.sourceAmount.amount,
                targetAmount: result.value.targetAmount.amount,
                exchangeRate: result.value.exchangeRate,
                note: result.value.note, // Optional
                createdAt: Date.now()
            });

            setSuccessMsg('Transaction saved!');
            // Reset form (keep rate and date)
            setGbp('');
            setNpr('');
            setNote('');
        } catch (e) {
            setError('Failed to save to database.');
            console.error(e);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Save className="w-5 h-5 text-indigo-600" />
                New Transaction
            </h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Exchange Rate */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Exchange Rate (1 GBP = ? NPR)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={rate || ''}
                            onChange={handleRateChange}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="Fetching..."
                            required
                        />
                        {loadingRate && (
                            <div className="absolute right-3 top-3">
                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* GBP Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Amount (GBP)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={gbp}
                            onChange={handleGbpChange}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="0.00"
                            required
                            min="0"
                        />
                    </div>

                    {/* NPR Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Amount (NPR)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={npr}
                            onChange={handleNprChange}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            placeholder="0.00"
                            required
                            min="0"
                        />
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]} // Prevent future
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                        required
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Note (Optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                        placeholder="e.g. Sent for festival..."
                        rows={2}
                        maxLength={200}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg active:scale-95 transform duration-150"
                >
                    Save Transaction
                </button>
            </form>
        </div>
    );
}
