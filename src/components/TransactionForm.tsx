"use client";

import { Banknote, Calendar, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Currency,
	ExchangeRate,
	Money,
	TransactionId,
} from "@/domain/primitives";
import { RemittanceTransaction } from "@/domain/transaction";
import { db } from "@/lib/db";
import { fetchExchangeRate } from "@/services/currency";

export function TransactionForm() {
	const [rate, setRate] = useState<number | null>(null);
	const [loadingRate, setLoadingRate] = useState(false);
	const [gbp, setGbp] = useState<string>("");
	const [npr, setNpr] = useState<string>("");
	const [date, setDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [note, setNote] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	useEffect(() => {
		const loadRate = async () => {
			setLoadingRate(true);
			const result = await fetchExchangeRate();
			setLoadingRate(false);
			if (result.success) {
				setRate(result.value);
			} else {
				setError("Failed to fetch live rate. Please enter manually.");
			}
		};
		loadRate();
	}, []);

	const handleGbpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setGbp(val);
		if (rate && val) {
			const m = Money.of(val, Currency.GBP);
			const r = ExchangeRate.of(rate);
			if (m.success && r.success) {
				const nprMoney = Money.multiplyByRate(m.value, r.value, Currency.NPR);
				setNpr(Money.toDecimalString(nprMoney));
			}
		} else if (val === "") {
			setNpr("");
		}
	};

	const handleNprChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setNpr(val);
		if (rate && val) {
			// Backward conversion requires careful math to avoid floating point issues too.
			// However, the spec primarily focused on Forward conversion (GBP -> NPR).
			// For backward, we can use the same principle: divide by rate scaled.
			const m = Money.of(val, Currency.NPR);
			const r = ExchangeRate.of(rate);
			if (m.success && r.success) {
				// Reverse: (minorUnits * 10^6) / scaledRate
				const rateScaleFactor = 1000000n;
				const raw =
					(m.value.minorUnits * rateScaleFactor + r.value.scaledValue / 2n) /
					r.value.scaledValue;
				setGbp(
					Money.toDecimalString({ minorUnits: raw, currency: Currency.GBP }),
				);
			}
		} else if (val === "") {
			setGbp("");
		}
	};

	const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setRate(val === "" ? null : parseFloat(val));
		if (gbp && val !== "") {
			const m = Money.of(gbp, Currency.GBP);
			const r = ExchangeRate.of(val);
			if (m.success && r.success) {
				const nprMoney = Money.multiplyByRate(m.value, r.value, Currency.NPR);
				setNpr(Money.toDecimalString(nprMoney));
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccessMsg(null);

		const rawId = TransactionId.new();
		const result = RemittanceTransaction.create({
			id: rawId,
			sourceAmount: gbp,
			targetAmount: npr,
			exchangeRate: rate || 0,
			date: date,
			note: note || undefined,
		});

		if (!result.success) {
			if (result.error.type === "ValidationError") {
				setError(`${result.error.field}: ${result.error.message}`);
			} else {
				setError(result.error.message);
			}
			return;
		}

		try {
			await db.transactions.add({
				id: result.value.id,
				date: result.value.date,
				sourceAmount: Number(result.value.sourceAmount.minorUnits) / 100, // DB still uses numbers for simplicity in search/sort
				targetAmount: Number(result.value.targetAmount.minorUnits) / 100,
				exchangeRate: ExchangeRate.toNumber(result.value.exchangeRate),
				note: result.value.note,
				createdAt: Date.now(),
			});

			setSuccessMsg("Transaction saved successfully!");
			setGbp("");
			setNpr("");
			setNote("");
			setTimeout(() => setSuccessMsg(null), 3000);
		} catch (e) {
			setError("Failed to save to database.");
			console.error(e);
		}
	};

	return (
		<div className="bg-card text-card-foreground p-6 rounded-2xl shadow-lg border border-border/50">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<Banknote className="w-5 h-5 text-primary" />
					New Transaction
				</h2>
				{rate && (
					<div
						className={`text-xs px-2 py-1 rounded-full font-medium ${loadingRate ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
					>
						1 GBP = {rate.toFixed(2)} NPR
					</div>
				)}
			</div>

			{error && (
				<div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-2">
					{error}
				</div>
			)}

			{successMsg && (
				<div className="bg-green-500/10 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm font-medium border border-green-500/20 animate-in fade-in slide-in-from-top-2">
					{successMsg}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-5">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<label
							htmlFor="gbp-input"
							className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1"
						>
							GBP ( £ )
						</label>
						<input
							id="gbp-input"
							type="number"
							step="0.01"
							value={gbp}
							onChange={handleGbpChange}
							className="w-full p-3 bg-secondary/50 border border-transparent focus:border-primary/50 text-foreground rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-lg"
							placeholder="0.00"
							required
							min="0"
						/>
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="npr-input"
							className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1"
						>
							NPR ( Rs )
						</label>
						<input
							id="npr-input"
							type="number"
							step="0.01"
							value={npr}
							onChange={handleNprChange}
							className="w-full p-3 bg-secondary/50 border border-transparent focus:border-primary/50 text-foreground rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-lg"
							placeholder="0.00"
							required
							min="0"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<label
							htmlFor="rate-input"
							className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1"
						>
							Exchange Rate
						</label>
						<div className="relative">
							<input
								id="rate-input"
								type="number"
								step="0.01"
								value={rate || ""}
								onChange={handleRateChange}
								className="w-full p-3 bg-secondary/30 border border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
								placeholder="Rate"
								required
							/>
							{loadingRate && (
								<div className="absolute right-3 top-3">
									<Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
								</div>
							)}
						</div>
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="date-input"
							className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1"
						>
							Date
						</label>
						<div className="relative">
							<input
								id="date-input"
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								max={new Date().toISOString().split("T")[0]}
								className="w-full p-3 bg-secondary/30 border border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm appearance-none"
								required
							/>
							<Calendar className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
						</div>
					</div>
				</div>

				<div className="space-y-1.5">
					<label
						htmlFor="note-input"
						className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1"
					>
						Note (Optional)
					</label>
					<textarea
						id="note-input"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						className="w-full p-3 bg-secondary/30 border border-border text-foreground rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
						placeholder="e.g. Festival gift..."
						rows={2}
						maxLength={200}
					/>
				</div>

				<button
					type="submit"
					className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] flex items-center justify-center gap-2"
				>
					<Save className="w-4 h-4" />
					Save Transaction
				</button>
			</form>
		</div>
	);
}
