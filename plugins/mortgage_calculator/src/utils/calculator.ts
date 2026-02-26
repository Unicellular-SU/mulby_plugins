/**
 * 房贷计算工具函数
 */

export interface LoanInput {
  loanType: 'commercial' | 'provident' | 'combined';
  commercialAmount?: number;
  providentAmount?: number;
  totalAmount?: number;
  commercialRate: number; // 年利率，如 0.039
  providentRate: number; // 年利率
  loanTerm: number; // 贷款年限
  repaymentMethod: 'equalPrincipal' | 'equalInstallment'; // 等额本金 or 等额本息
}

export interface MonthlyPayment {
  month: number;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface CalculationResult {
  totalLoanAmount: number;
  monthlyPayment: number;
  firstMonthPayment: number;
  totalPayment: number;
  totalInterest: number;
  repaymentSchedule: MonthlyPayment[];
}

export interface EarlyRepaymentInput {
  originalLoan: LoanInput;
  earlyRepaymentAmount: number;
  repaymentMonth: number;
}

/**
 * 计算等额本息每月还款额
 */
export function calculateEqualInstallment(
  loanAmount: number,
  annualRate: number,
  years: number
): { monthlyPayment: number; totalInterest: number } {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  
  // 等额本息公式：每月还款额 = [贷款本金 × 月利率 × (1+月利率)^还款月数] ÷ [(1+月利率)^还款月数 - 1]
  const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - loanAmount;
  
  return {
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2))
  };
}

/**
 * 计算等额本金还款计划
 */
export function calculateEqualPrincipal(
  loanAmount: number,
  annualRate: number,
  years: number
): { firstMonthPayment: number; monthlyPayments: number[]; totalInterest: number } {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  const monthlyPrincipal = loanAmount / months;
  
  const monthlyPayments: number[] = [];
  let totalInterest = 0;
  
  for (let i = 0; i < months; i++) {
    const remainingPrincipal = loanAmount - (monthlyPrincipal * i);
    const monthlyInterest = remainingPrincipal * monthlyRate;
    const monthlyPayment = monthlyPrincipal + monthlyInterest;
    
    monthlyPayments.push(Number(monthlyPayment.toFixed(2)));
    totalInterest += monthlyInterest;
  }
  
  return {
    firstMonthPayment: monthlyPayments[0],
    monthlyPayments,
    totalInterest: Number(totalInterest.toFixed(2))
  };
}

/**
 * 生成详细的还款计划表
 */
export function generateRepaymentSchedule(
  loanAmount: number,
  annualRate: number,
  years: number,
  repaymentMethod: 'equalPrincipal' | 'equalInstallment'
): MonthlyPayment[] {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  const schedule: MonthlyPayment[] = [];
  
  if (repaymentMethod === 'equalInstallment') {
    const { monthlyPayment } = calculateEqualInstallment(loanAmount, annualRate, years);
    let remainingBalance = loanAmount;
    
    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingBalance * monthlyRate;
      const monthlyPrincipal = monthlyPayment - monthlyInterest;
      remainingBalance -= monthlyPrincipal;
      
      schedule.push({
        month: i,
        principal: Number(monthlyPrincipal.toFixed(2)),
        interest: Number(monthlyInterest.toFixed(2)),
        totalPayment: Number(monthlyPayment.toFixed(2)),
        remainingBalance: Number(Math.max(0, remainingBalance).toFixed(2))
      });
    }
  } else {
    // 等额本金
    const monthlyPrincipal = loanAmount / months;
    let remainingBalance = loanAmount;
    
    for (let i = 1; i <= months; i++) {
      const monthlyInterest = remainingBalance * monthlyRate;
      const monthlyPayment = monthlyPrincipal + monthlyInterest;
      remainingBalance -= monthlyPrincipal;
      
      schedule.push({
        month: i,
        principal: Number(monthlyPrincipal.toFixed(2)),
        interest: Number(monthlyInterest.toFixed(2)),
        totalPayment: Number(monthlyPayment.toFixed(2)),
        remainingBalance: Number(Math.max(0, remainingBalance).toFixed(2))
      });
    }
  }
  
  return schedule;
}

/**
 * 计算组合贷款
 */
export function calculateCombinedLoan(
  commercialAmount: number,
  commercialRate: number,
  providentAmount: number,
  providentRate: number,
  years: number,
  repaymentMethod: 'equalPrincipal' | 'equalInstallment'
): CalculationResult {
  const commercialResult = calculateLoan(commercialAmount, commercialRate, years, repaymentMethod);
  const providentResult = calculateLoan(providentAmount, providentRate, years, repaymentMethod);
  
  const totalLoanAmount = commercialAmount + providentAmount;
  const totalPayment = commercialResult.totalPayment + providentResult.totalPayment;
  const totalInterest = commercialResult.totalInterest + providentResult.totalInterest;
  
  // 合并还款计划
  const combinedSchedule: MonthlyPayment[] = [];
  const maxMonths = Math.max(commercialResult.repaymentSchedule.length, providentResult.repaymentSchedule.length);
  
  for (let i = 0; i < maxMonths; i++) {
    const commercial = commercialResult.repaymentSchedule[i] || { principal: 0, interest: 0, totalPayment: 0, remainingBalance: 0 };
    const provident = providentResult.repaymentSchedule[i] || { principal: 0, interest: 0, totalPayment: 0, remainingBalance: 0 };
    
    combinedSchedule.push({
      month: i + 1,
      principal: Number((commercial.principal + provident.principal).toFixed(2)),
      interest: Number((commercial.interest + provident.interest).toFixed(2)),
      totalPayment: Number((commercial.totalPayment + provident.totalPayment).toFixed(2)),
      remainingBalance: Number((commercial.remainingBalance + provident.remainingBalance).toFixed(2))
    });
  }
  
  return {
    totalLoanAmount,
    monthlyPayment: combinedSchedule[0]?.totalPayment || 0,
    firstMonthPayment: combinedSchedule[0]?.totalPayment || 0,
    totalPayment,
    totalInterest,
    repaymentSchedule: combinedSchedule
  };
}

/**
 * 主计算函数
 */
export function calculateLoan(
  loanAmount: number,
  annualRate: number,
  years: number,
  repaymentMethod: 'equalPrincipal' | 'equalInstallment'
): CalculationResult {
  let monthlyPayment = 0;
  let firstMonthPayment = 0;
  let totalPayment = 0;
  let totalInterest = 0;
  
  if (repaymentMethod === 'equalInstallment') {
    const result = calculateEqualInstallment(loanAmount, annualRate, years);
    monthlyPayment = result.monthlyPayment;
    firstMonthPayment = result.monthlyPayment;
    totalPayment = monthlyPayment * years * 12;
    totalInterest = result.totalInterest;
  } else {
    const result = calculateEqualPrincipal(loanAmount, annualRate, years);
    monthlyPayment = result.monthlyPayments[Math.floor(result.monthlyPayments.length / 2)]; // 取中间值作为参考月供
    firstMonthPayment = result.firstMonthPayment;
    totalPayment = result.monthlyPayments.reduce((sum, payment) => sum + payment, 0);
    totalInterest = result.totalInterest;
  }
  
  const repaymentSchedule = generateRepaymentSchedule(loanAmount, annualRate, years, repaymentMethod);
  
  return {
    totalLoanAmount: loanAmount,
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    firstMonthPayment: Number(firstMonthPayment.toFixed(2)),
    totalPayment: Number(totalPayment.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    repaymentSchedule
  };
}

/**
 * 提前还款计算
 */
export function calculateEarlyRepayment(
  originalLoan: LoanInput,
  earlyRepaymentAmount: number,
  repaymentMonth: number
): {
  newSchedule: MonthlyPayment[];
  interestSaved: number;
  newTotalPayment: number;
} {
  // 这里实现提前还款逻辑
  // 简化版本：计算提前还款后的剩余本金，重新计算剩余期限的还款
  const schedule = generateRepaymentSchedule(
    originalLoan.totalAmount || 0,
    originalLoan.commercialRate,
    originalLoan.loanTerm,
    originalLoan.repaymentMethod
  );
  
  if (repaymentMonth >= schedule.length) {
    return {
      newSchedule: schedule,
      interestSaved: 0,
      newTotalPayment: schedule.reduce((sum, item) => sum + item.totalPayment, 0)
    };
  }
  
  const remainingBalance = schedule[repaymentMonth - 1].remainingBalance;
  const newBalance = Math.max(0, remainingBalance - earlyRepaymentAmount);
  
  // 重新计算剩余期限的还款
  const remainingMonths = schedule.length - repaymentMonth;
  const newSchedule = [...schedule.slice(0, repaymentMonth)];
  
  if (newBalance > 0 && remainingMonths > 0) {
    const remainingSchedule = generateRepaymentSchedule(
      newBalance,
      originalLoan.commercialRate,
      remainingMonths / 12,
      originalLoan.repaymentMethod
    );
    
    // 调整月份编号
    const adjustedSchedule = remainingSchedule.map((item, index) => ({
      ...item,
      month: repaymentMonth + index + 1
    }));
    
    newSchedule.push(...adjustedSchedule);
  }
  
  const originalTotal = schedule.reduce((sum, item) => sum + item.totalPayment, 0);
  const newTotal = newSchedule.reduce((sum, item) => sum + item.totalPayment, 0);
  const interestSaved = originalTotal - newTotal;
  
  return {
    newSchedule,
    interestSaved: Number(interestSaved.toFixed(2)),
    newTotalPayment: Number(newTotal.toFixed(2))
  };
}

/**
 * 贷款能力评估
 */
export function assessLoanCapacity(
  monthlyIncome: number,
  monthlyExpenses: number,
  existingLoans: number,
  downPaymentRatio: number = 0.3
): {
  maxLoanAmount: number;
  affordableMonthlyPayment: number;
  suggestedLoanTerm: number;
  riskLevel: 'low' | 'medium' | 'high';
} {
  // 一般建议月供不超过月收入的40%
  const maxPaymentRatio = 0.4;
  const availableIncome = monthlyIncome - monthlyExpenses - existingLoans;
  const affordableMonthlyPayment = availableIncome * maxPaymentRatio;
  
  // 假设利率为4.5%，计算最大贷款额度
  const assumedRate = 0.045;
  const assumedTerm = 30; // 30年
  
  // 使用等额本息公式反推贷款额度
  const monthlyRate = assumedRate / 12;
  const months = assumedTerm * 12;
  const maxLoanAmount = affordableMonthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / 
    (monthlyRate * Math.pow(1 + monthlyRate, months));
  
  // 风险评估
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const debtToIncomeRatio = (affordableMonthlyPayment + existingLoans) / monthlyIncome;
  
  if (debtToIncomeRatio > 0.5) {
    riskLevel = 'high';
  } else if (debtToIncomeRatio > 0.35) {
    riskLevel = 'medium';
  }
  
  return {
    maxLoanAmount: Number(maxLoanAmount.toFixed(2)),
    affordableMonthlyPayment: Number(affordableMonthlyPayment.toFixed(2)),
    suggestedLoanTerm: assumedTerm,
    riskLevel
  };
}