
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseISO, addMonths, differenceInMonths, format, getDay, subMonths, startOfMonth, isAfter } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('date, amount, branch');

        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('date, amount, category, branch');

        if (salesError || expensesError) {
            throw new Error('Failed to fetch data');
        }

        if (!sales || sales.length === 0) {
            return NextResponse.json({ timeline: [], expenseCategories: [], forecast: [], weekdayStats: [], branchComparison: [] });
        }

        const monthlyData: Record<string, { sales: number; expenses: number; date: Date }> = {};
        const expenseCategories: Record<string, number> = {};
        const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];

        // Branch Comparison Logic
        // We want to track sales/expenses per branch per month
        // Structure: "2024-01": { Rawson: {sales:0, expenses:0}, Rivadavia: {sales:0, expenses:0} }
        const branchMonthlyStats: Record<string, Record<string, { sales: number, expenses: number }>> = {};

        const getMonthKey = (dateStr: string) => dateStr.substring(0, 7); // "YYYY-MM"
        const normalizeBranch = (b: string) => b ? b.trim() : 'Unknown';

        // Helper to init branch stats
        const initBranchStat = (key: string, branch: string) => {
            if (!branchMonthlyStats[key]) branchMonthlyStats[key] = {};
            if (!branchMonthlyStats[key][branch]) branchMonthlyStats[key][branch] = { sales: 0, expenses: 0 };
        };

        // Process Sales
        sales.forEach(sale => {
            const dateObj = parseISO(sale.date);
            const key = getMonthKey(sale.date);

            // General Monthly
            if (!monthlyData[key]) monthlyData[key] = { sales: 0, expenses: 0, date: parseISO(key + "-01") };
            monthlyData[key].sales += Number(sale.amount);

            // Weekday
            const dayIndex = getDay(dateObj);
            weekdayTotals[dayIndex] += Number(sale.amount);

            // Branch
            const branch = normalizeBranch(sale.branch);
            initBranchStat(key, branch);
            branchMonthlyStats[key][branch].sales += Number(sale.amount);
        });

        // Process Expenses
        expenses?.forEach(expense => {
            const key = getMonthKey(expense.date);
            if (!monthlyData[key]) monthlyData[key] = { sales: 0, expenses: 0, date: parseISO(key + "-01") };
            monthlyData[key].expenses += Number(expense.amount);

            if (expense.category) {
                expenseCategories[expense.category] = (expenseCategories[expense.category] || 0) + Number(expense.amount);
            }

            // Branch
            const branch = normalizeBranch(expense.branch);
            initBranchStat(key, branch);
            branchMonthlyStats[key][branch].expenses += Number(expense.amount);
        });

        // --- Timeline & Forecast Logic ---
        let timeline = Object.values(monthlyData).sort((a, b) => a.date.getTime() - b.date.getTime());

        const forecast = [];
        if (timeline.length >= 2) {
            const firstDate = timeline[0].date;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            const n = timeline.length;

            timeline.forEach(point => {
                const x = differenceInMonths(point.date, firstDate);
                const y = point.sales;
                sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
            });

            const denominator = (n * sumXX - sumX * sumX);
            if (denominator !== 0) {
                const slope = (n * sumXY - sumX * sumY) / denominator;
                const intercept = (sumY - slope * sumX) / n;
                const lastDate = timeline[timeline.length - 1].date;
                const lastX = differenceInMonths(lastDate, firstDate);

                for (let i = 1; i <= 3; i++) {
                    const nextX = lastX + i;
                    const predictedSales = slope * nextX + intercept;
                    const nextDate = addMonths(lastDate, i);
                    forecast.push({
                        month: format(nextDate, 'yyyy-MM'),
                        amount: Math.max(0, predictedSales)
                    });
                }
            }
        }

        const formattedTimeline = timeline.map(t => ({
            month: format(t.date, 'yyyy-MM'),
            sales: t.sales,
            expenses: t.expenses
        }));

        // --- Weekday Stats ---
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const orderedIndices = [1, 2, 3, 4, 5, 6, 0];
        const weekdayStats = orderedIndices.map(i => ({
            day: dayNames[i],
            sales: weekdayTotals[i]
        }));

        // --- Branch Comparison (Last 3 Months) ---
        // 1. Get all unique month keys sorted descending
        const sortedAvailableMonths = Object.keys(branchMonthlyStats).sort().reverse();
        // 2. Take top 3
        const last3Months = sortedAvailableMonths.slice(0, 3).reverse(); // Reverse back to chronological

        const branchComparison = last3Months.map(monthKey => {
            const monthData = branchMonthlyStats[monthKey];
            // Flatten: { month: '2023-11', rawsonSales: X, rawsonExpenses: Y, rivadaviaSales: Z ... }
            // We assume branches are named 'Rawson' and 'Rivadavia' usually, but code handles dynamic
            const result: any = { month: monthKey };

            // Iterate over branches found in that month
            Object.keys(monthData).forEach(branchName => {
                // Clean key specific (e.g., Rawson Sales)
                // We'll normalize to lowercase for dynamic keys or fixed for known
                // Let's use formatted keys for dynamic mapping in frontend
                result[`${branchName}_sales`] = monthData[branchName].sales;
                result[`${branchName}_expenses`] = monthData[branchName].expenses;
            });
            return result;
        });

        return NextResponse.json({
            timeline: formattedTimeline,
            expenseCategories: Object.entries(expenseCategories)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value),
            forecast,
            weekdayStats,
            branchComparison
        });

    } catch (error: any) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
