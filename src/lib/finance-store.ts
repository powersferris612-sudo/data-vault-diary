// Browser-side "data folder" — keys mirror file names: "year:2026", "profile"
// All shapes match the spec one-to-one so JSON export/import is a real .json file.

export type AdditionalIncome = { id: string; source: string; amount: number; date: string; note?: string };

export type Income = {
  salary: number;
  additional: AdditionalIncome[];
  total: number;
};

export type Budget = {
  parents: number;
  loans: number;
  travel: number;
  food: number;
  transport: number;
  shopping: number;
  mobile: number;
  misc: number;
  emergencyFund: number;
  mutualFunds: number;
  govCertificates: number;
  stocks: number;
  custom?: Record<string, number>;
};

export type ExpenseTag = "fixed" | "lifestyle" | "investment" | "saving";
export type Expense = {
  id: string;
  category: keyof Budget | string;
  amount: number;
  date: string;
  note?: string;
  tag: ExpenseTag;
};

export type InvestmentBucket = { contributed: number; totalToDate: number; returnRate?: number };
export type Investments = {
  emergencyFund: InvestmentBucket;
  mutualFunds: InvestmentBucket;
  govCertificates: InvestmentBucket;
  stocks: InvestmentBucket;
};

export type MonthData = {
  label: string;
  completeness: {
    incomeLogged: boolean;
    budgetSet: boolean;
    expensesAdded: boolean;
    investmentsLogged: boolean;
    lastUpdated: string;
  };
  income: Income;
  budget: Budget;
  expenses: Expense[];
  investments: Investments;
};

export type YearSummary = Partial<{
  totalEarned: number; totalSpent: number; totalSaved: number; totalInvested: number;
  averageMonthlySavings: number; bestSavingMonth: string; worstSpendingMonth: string;
}>;

export type YearData = {
  year: number;
  summary: YearSummary;
  months: Record<string, MonthData>;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  targetDate: string;
  bucket: "emergencyFund" | "mutualFunds" | "govCertificates" | "stocks" | "general";
  done?: boolean;
};

export type Profile = {
  name: string;
  currency: string;
  monthlySalary: number;
  savingsGoal: number;
  startMonth: string;
  startYear: number;
  goals: Goal[];
};

export const DEFAULT_BUDGET: Budget = {
  parents: 20000, loans: 100000, travel: 10000,
  food: 15000, transport: 5000, shopping: 5000, mobile: 3000, misc: 5000,
  emergencyFund: 30000, mutualFunds: 27000, govCertificates: 30000, stocks: 10000,
};

export const BUDGET_LABELS: Record<keyof Budget, string> = {
  parents: "Parents Support",
  loans: "Loan Repayments",
  travel: "Home Visit / Travel",
  food: "Food & Entertainment",
  transport: "Transport",
  shopping: "Clothes & Shopping",
  mobile: "Mobile & Subscriptions",
  misc: "Miscellaneous",
  emergencyFund: "Emergency Fund",
  mutualFunds: "Islamic Mutual Funds",
  govCertificates: "Gov Certificates",
  stocks: "Stocks (PSX)",
  custom: "Custom",
};

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const monthKey = (m: number) => String(m).padStart(2, "0");

export function emptyMonth(year: number, monthIdx0: number, prevBudget?: Budget): MonthData {
  return {
    label: `${MONTH_NAMES[monthIdx0]} ${year}`,
    completeness: { incomeLogged: false, budgetSet: false, expensesAdded: false, investmentsLogged: false, lastUpdated: "" },
    income: { salary: 0, additional: [], total: 0 },
    budget: prevBudget ? { ...prevBudget } : { ...DEFAULT_BUDGET },
    expenses: [],
    investments: {
      emergencyFund: { contributed: 0, totalToDate: 0 },
      mutualFunds: { contributed: 0, totalToDate: 0, returnRate: 18 },
      govCertificates: { contributed: 0, totalToDate: 0, returnRate: 20 },
      stocks: { contributed: 0, totalToDate: 0, returnRate: 15 },
    },
  };
}

export const DEFAULT_PROFILE: Profile = {
  name: "Habib",
  currency: "PKR",
  monthlySalary: 250000,
  savingsGoal: 97000,
  startMonth: "05",
  startYear: 2026,
  goals: [
    { id: "g1", name: "Emergency Fund 3.9L", target: 390000, saved: 30000, targetDate: "2027-05-01", bucket: "emergencyFund" },
    { id: "g2", name: "Car Down Payment", target: 800000, saved: 0, targetDate: "2028-05-01", bucket: "general" },
  ],
};

// ---- storage (localStorage; SSR-safe via guards) ----
const isClient = () => typeof window !== "undefined";

export function loadProfile(): Profile {
  if (!isClient()) return DEFAULT_PROFILE;
  const raw = localStorage.getItem("hf:profile");
  if (!raw) {
    localStorage.setItem("hf:profile", JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  try { return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }; } catch { return DEFAULT_PROFILE; }
}
export function saveProfile(p: Profile) {
  if (!isClient()) return;
  localStorage.setItem("hf:profile", JSON.stringify(p));
}

export function loadYear(year: number): YearData {
  if (!isClient()) return { year, summary: {}, months: {} };
  const raw = localStorage.getItem(`hf:year:${year}`);
  if (!raw) {
    const fresh: YearData = { year, summary: {}, months: {} };
    // Seed May 2026
    if (year === 2026) {
      const may = emptyMonth(2026, 4);
      may.income = {
        salary: 250000,
        additional: [{ id: "a1", source: "Freelancing", amount: 80000, date: "2026-05-10", note: "" }],
        total: 330000,
      };
      may.expenses = [
        { id: "e1", category: "food", amount: 3500, date: "2026-05-03", note: "Dinner with friends", tag: "lifestyle" },
        { id: "e2", category: "parents", amount: 20000, date: "2026-05-01", note: "Monthly support", tag: "fixed" },
        { id: "e3", category: "loans", amount: 100000, date: "2026-05-02", note: "EMI", tag: "fixed" },
        { id: "e4", category: "transport", amount: 4200, date: "2026-05-08", note: "Careem", tag: "lifestyle" },
        { id: "e5", category: "mobile", amount: 2800, date: "2026-05-05", note: "Telco", tag: "fixed" },
        { id: "e6", category: "shopping", amount: 6800, date: "2026-05-15", note: "Eid clothes", tag: "lifestyle" },
        { id: "e7", category: "food", amount: 5400, date: "2026-05-20", note: "Groceries", tag: "lifestyle" },
        { id: "e8", category: "misc", amount: 3000, date: "2026-05-22", note: "Gift", tag: "lifestyle" },
      ];
      may.investments = {
        emergencyFund:   { contributed: 30000, totalToDate: 30000 },
        mutualFunds:     { contributed: 27000, totalToDate: 27000, returnRate: 18 },
        govCertificates: { contributed: 30000, totalToDate: 30000, returnRate: 20 },
        stocks:          { contributed: 10000, totalToDate: 10000, returnRate: 15 },
      };
      may.completeness = { incomeLogged: true, budgetSet: true, expensesAdded: true, investmentsLogged: true, lastUpdated: "2026-05-22" };
      fresh.months["05"] = may;
    }
    localStorage.setItem(`hf:year:${year}`, JSON.stringify(fresh));
    return fresh;
  }
  try { return JSON.parse(raw); } catch { return { year, summary: {}, months: {} }; }
}

export function saveYear(year: number, data: YearData) {
  if (!isClient()) return;
  data.summary = computeSummary(data);
  localStorage.setItem(`hf:year:${year}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("hf:data-changed"));
}

export function getMonth(year: number, mk: string): MonthData | null {
  const y = loadYear(year);
  return y.months[mk] ?? null;
}

export function ensureMonth(year: number, monthIdx0: number): MonthData {
  const y = loadYear(year);
  const mk = monthKey(monthIdx0 + 1);
  if (!y.months[mk]) {
    // copy previous month's budget if exists
    let prevBudget: Budget | undefined;
    for (let i = monthIdx0 - 1; i >= 0; i--) {
      const k = monthKey(i + 1);
      if (y.months[k]) { prevBudget = y.months[k].budget; break; }
    }
    if (!prevBudget) {
      const prevYear = loadYear(year - 1);
      const lastKey = Object.keys(prevYear.months).sort().pop();
      if (lastKey) prevBudget = prevYear.months[lastKey].budget;
    }
    y.months[mk] = emptyMonth(year, monthIdx0, prevBudget);
    saveYear(year, y);
  }
  return y.months[mk];
}

export function updateMonth(year: number, mk: string, updater: (m: MonthData) => MonthData) {
  const y = loadYear(year);
  const cur = y.months[mk] ?? emptyMonth(year, parseInt(mk) - 1);
  const next = updater(cur);
  next.income.total = next.income.salary + next.income.additional.reduce((s, a) => s + a.amount, 0);
  next.completeness = {
    incomeLogged: next.income.total > 0,
    budgetSet: Object.values(next.budget).some(v => typeof v === "number" && v > 0),
    expensesAdded: next.expenses.length >= 5,
    investmentsLogged: Object.values(next.investments).some(b => b.contributed > 0),
    lastUpdated: new Date().toISOString().slice(0, 10),
  };
  y.months[mk] = next;
  saveYear(year, y);
}

export function totalExpenses(m: MonthData) { return m.expenses.reduce((s, e) => s + e.amount, 0); }
export function totalInvested(m: MonthData) {
  return Object.values(m.investments).reduce((s, b) => s + (b.contributed || 0), 0);
}
export function savedAmount(m: MonthData) {
  return m.income.total - totalExpenses(m) - totalInvested(m);
}
export function savingsRate(m: MonthData) {
  const inc = m.income.total; if (!inc) return 0;
  return Math.round(((savedAmount(m) + totalInvested(m)) / inc) * 100);
}

export function computeSummary(y: YearData): YearSummary {
  const months = Object.entries(y.months);
  if (!months.length) return {};
  let totalEarned = 0, totalSpent = 0, totalInvested = 0, totalSaved = 0;
  let bestSaveAmt = -Infinity, bestSaveMonth = "";
  let worstSpendAmt = -Infinity, worstSpendMonth = "";
  for (const [mk, m] of months) {
    totalEarned += m.income.total;
    const sp = m.expenses.reduce((s, e) => s + e.amount, 0);
    const inv = Object.values(m.investments).reduce((s, b) => s + b.contributed, 0);
    totalSpent += sp; totalInvested += inv;
    const saved = m.income.total - sp - inv;
    totalSaved += saved + inv; // money kept (savings + invested)
    if (saved > bestSaveAmt) { bestSaveAmt = saved; bestSaveMonth = MONTH_NAMES[parseInt(mk) - 1]; }
    if (sp > worstSpendAmt) { worstSpendAmt = sp; worstSpendMonth = MONTH_NAMES[parseInt(mk) - 1]; }
  }
  return {
    totalEarned, totalSpent, totalInvested, totalSaved,
    averageMonthlySavings: Math.round(totalSaved / months.length),
    bestSavingMonth: bestSaveMonth, worstSpendingMonth: worstSpendMonth,
  };
}

export function fmtMoney(n: number, currency = "PKR") {
  if (n == null || isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${sign}₨${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₨${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₨${(abs / 1000).toFixed(1)}k`;
  return `${sign}₨${abs.toLocaleString("en-PK")}`;
}
export function fmtMoneyExact(n: number) {
  if (n == null || isNaN(n)) return "—";
  return `₨${Math.round(n).toLocaleString("en-PK")}`;
}

export function exportYear(year: number) {
  const y = loadYear(year);
  const blob = new Blob([JSON.stringify(y, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${year}.json`; a.click();
  URL.revokeObjectURL(url);
}

export async function importYearFromFile(file: File) {
  const text = await file.text();
  const data = JSON.parse(text) as YearData;
  if (!data.year || !data.months) throw new Error("Invalid year file");
  saveYear(data.year, data);
  return data.year;
}

export function resetMonth(year: number, mk: string) {
  const y = loadYear(year);
  const m = y.months[mk]; if (!m) return;
  m.expenses = [];
  m.completeness.expensesAdded = false;
  m.completeness.lastUpdated = new Date().toISOString().slice(0, 10);
  saveYear(year, y);
}

export function listAllYears(): number[] {
  if (!isClient()) return [2026];
  const years = new Set<number>([2026]);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("hf:year:")) years.add(parseInt(k.slice("hf:year:".length)));
  }
  return Array.from(years).sort();
}
