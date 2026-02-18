"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, Check, History, Trash2, X } from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/db";

export function TransactionList() {
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const transactions = useLiveQuery(() =>
		db.transactions.orderBy("date").reverse().toArray(),
	);

	if (!transactions)
		return (
			<div className="p-8 text-center text-muted-foreground/60 animate-pulse flex flex-col items-center gap-3">
				<div className="w-12 h-12 bg-muted rounded-full"></div>
				<p>Loading history...</p>
			</div>
		);

	if (transactions.length === 0) {
		return (
			<div className="text-center py-16 px-6 text-muted-foreground bg-card/50 rounded-2xl border border-dashed border-border flex flex-col items-center gap-3">
				<History className="w-8 h-8 opacity-20" />
				<p>No transactions recorded yet.</p>
				<p className="text-xs opacity-60">Add your first remittance above.</p>
			</div>
		);
	}

	const handleDelete = async (id: string) => {
		await db.transactions.delete(id);
		setConfirmDelete(null);
	};

	return (
		<div className="space-y-5">
			<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
				Recent History
			</h3>
			<div className="space-y-3">
				{transactions.map((tx) => (
					<div
						key={tx.id}
						className="group relative bg-card hover:bg-secondary/40 p-5 rounded-2xl shadow-sm border border-border/60 hover:border-primary/20 transition-all duration-200 overflow-hidden"
					>
						{/* Custom Confirmation Overlay */}
						{confirmDelete === tx.id && (
							<div className="absolute inset-0 bg-destructive/10 backdrop-blur-[2px] z-10 flex items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-200">
								<span className="text-xs font-bold text-destructive uppercase tracking-widest">
									Delete?
								</span>
								<button
									type="button"
									onClick={() => setConfirmDelete(null)}
									className="bg-background text-foreground p-2 rounded-full shadow-lg border border-border hover:bg-secondary transition-transform active:scale-90"
									aria-label="Cancel"
								>
									<X className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={() => handleDelete(tx.id)}
									className="bg-destructive text-destructive-foreground p-2 rounded-full shadow-lg hover:bg-destructive/90 transition-transform active:scale-90"
									aria-label="Confirm Delete"
								>
									<Check className="w-4 h-4" />
								</button>
							</div>
						)}

						<div className="flex justify-between items-start">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<span className="text-2xl font-bold text-foreground tracking-tight">
										£{tx.sourceAmount.toFixed(2)}
									</span>
									<ArrowRight className="w-4 h-4 text-muted-foreground/60" />
									<span className="text-2xl font-bold text-primary tracking-tight">
										Rs {tx.targetAmount.toFixed(2)}
									</span>
								</div>
								<span className="text-xs text-muted-foreground font-medium flex items-center gap-2">
									{tx.date}
									<span className="w-1 h-1 bg-border rounded-full"></span>
									Rate: {tx.exchangeRate.toFixed(2)}
								</span>
							</div>

							<button
								type="button"
								onClick={() => setConfirmDelete(tx.id)}
								className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-2 rounded-lg hover:bg-destructive/10 -mr-2 -mt-2 focus:opacity-100"
								title="Delete"
								aria-label="Delete transaction"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>

						{tx.note && (
							<div className="mt-3 pt-3 border-t border-border/50">
								<p className="text-sm text-foreground/80 italic">"{tx.note}"</p>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
