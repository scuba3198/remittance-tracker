"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className="w-9 h-9" />; // Placeholder to avoid layout shift
	}

	return (
		<button
			type="button"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="p-2 rounded-full bg-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-white/10 shadow-sm"
			aria-label="Toggle Theme"
		>
			{theme === "dark" ? (
				<Sun className="h-5 w-5 text-yellow-400" />
			) : (
				<Moon className="h-5 w-5 text-slate-700" />
			)}
		</button>
	);
}
