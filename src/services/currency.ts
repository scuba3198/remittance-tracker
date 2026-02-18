import { Result } from '@/lib/result';

const API_URL = 'https://api.exchangerate-api.com/v4/latest/GBP';

export type ExchangeRateData = {
    base: string;
    date: string;
    rates: Record<string, number>;
};

export const fetchExchangeRate = async (): Promise<Result<number, string>> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            return Result.err(`API Error: ${response.statusText}`);
        }
        const data: ExchangeRateData = await response.json();
        const rate = data.rates['NPR'];

        if (!rate) {
            return Result.err('NPR rate not found in response');
        }

        return Result.ok(rate);
    } catch (error) {
        return Result.err(error instanceof Error ? error.message : 'Unknown network error');
    }
};
