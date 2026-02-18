'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Trash2, ArrowRight } from 'lucide-react';

export function TransactionList() {
    const transactions = useLiveQuery(
        () => db.transactions.orderBy('date').reverse().toArray()
    );

    if (!transactions) return <div className="p-4 text-center text-gray-500">Loading history...</div>;

    if (transactions.length === 0) {
        return (
            <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No transactions yet.
            </div>
        );
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            db.transactions.delete(id);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Recent History</h3>
            {transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{tx.date}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg font-bold text-gray-800">£{tx.sourceAmount.toFixed(2)}</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="text-lg font-bold text-purple-600">Rs {tx.targetAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(tx.id)}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-50 pt-2 mt-1">
                        <div className="text-xs text-gray-500 flex flex-col">
                            <span>Rate: {tx.exchangeRate.toFixed(2)}</span>
                            {tx.note && <span className="text-gray-400 italic mt-1">"{tx.note}"</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
