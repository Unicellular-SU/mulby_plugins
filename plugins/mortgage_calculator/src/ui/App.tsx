import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  Download,
  BarChart3,
  Home,
  Building,
  Wallet,
  Target,
  RefreshCw,
  Share2,
  FileText,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import html2canvas from 'html2canvas';
import { 
  calculateLoan, 
  calculateCombinedLoan, 
  calculateEarlyRepayment,
  assessLoanCapacity,
  type LoanInput,
  type MonthlyPayment,
  type CalculationResult
} from '../utils/calculator';
import { LoanType, RateComparison, ChartData } from '../types';

const App: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison' | 'assessment' | 'early'>('calculator');
  const [loanType, setLoanType] = useState<'commercial' | 'provident' | 'combined'>('commercial');
  const [repaymentMethod, setRepaymentMethod] = useState<'equalPrincipal' | 'equalInstallment'>('equalInstallment');
  
  // 贷款参数
  const [commercialAmount, setCommercialAmount] = useState<string>('1000000');
  const [providentAmount, setProvidentAmount] = useState<string>('500000');
  const [commercialRate, setCommercialRate] = useState<string>('0.039');
  const [providentRate, setProvidentRate] = useState<string>('0.0325');
  const [loanTerm, setLoanTerm] = useState<string>('30');
  
  // 计算结果
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<MonthlyPayment[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // 提前还款参数
  const [earlyRepaymentAmount, setEarlyRepaymentAmount] = useState<string>('100000');
  const [repaymentMonth, setRepaymentMonth] = useState<string>('12');
  const [earlyRepaymentResult, setEarlyRepaymentResult] = useState<any>(null);
  
  // 贷款能力评估参数
  const [monthlyIncome, setMonthlyIncome] = useState<string>('20000');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('8000');
  const [existingLoans, setExistingLoans] = useState<string>('0');
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  
  // 利率对比数据
  const [rateComparisons, setRateComparisons] = useState<RateComparison[]>([
    { bank: '工商银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '建设银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '农业银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '中国银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '招商银行', rate: 0.0385, term: '5年以上', notes: '优质客户' },
    { bank: '公积金贷款', rate: 0.0325, term: '5年以上', notes: '首套房' },
  ]);
  
  // 贷款类型配置
  const loanTypes: LoanType[] = [
    { id: 'commercial', name: '商业贷款', description: '商业银行提供的住房贷款', icon: '🏦' },
    { id: 'provident', name: '公积金贷款', description: '住房公积金管理中心提供的贷款', icon: '💰' },
    { id: 'combined', name: '组合贷款', description: '商业贷款 + 公积金贷款', icon: '🔗' },
  ];
  
  // 还款方式配置
  const repaymentMethods = [
    { id: 'equalInstallment', name: '等额本息', description: '每月还款额相同' },
    { id: 'equalPrincipal', name: '等额本金', description: '每月还款本金相同，利息递减' },
  ];
  
  // 图表数据
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  
  // 导出引用
  const exportRef = useRef<HTMLDivElement>(null);
  
  // 初始化计算
  useEffect(() => {
    handleCalculate();
  }, []);
  
  // 处理计算
  const handleCalculate = () => {
    setIsCalculating(true);
    
    try {
      let result: CalculationResult;
      const commercialAmt = parseFloat(commercialAmount) || 0;
      const providentAmt = parseFloat(providentAmount) || 0;
      const commercialRt = parseFloat(commercialRate) || 0;
      const providentRt = parseFloat(providentRate) || 0;
      const term = parseFloat(loanTerm) || 0;
      
      if (loanType === 'combined') {
        result = calculateCombinedLoan(
          commercialAmt,
          commercialRt,
          providentAmt,
          providentRt,
          term,
          repaymentMethod
        );
      } else if (loanType === 'provident') {
        result = calculateLoan(
          providentAmt,
          providentRt,
          term,
          repaymentMethod
        );
      } else {
        result = calculateLoan(
          commercialAmt,
          commercialRt,
          term,
          repaymentMethod
        );
      }
      
      setCalculationResult(result);
      setRepaymentSchedule(result.repaymentSchedule.slice(0, 12)); // 只显示前12个月
      
      // 准备图表数据
      prepareChartData(result);
      
    } catch (error) {
      console.error('计算错误:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // 准备图表数据
  const prepareChartData = (result: CalculationResult) => {
    // 还款构成饼图数据
    const pieData: ChartData[] = [
      { name: '贷款本金', value: result.totalLoanAmount, color: '#007AFF' },
      { name: '总利息', value: result.totalInterest, color: '#34C759' },
    ];
    
    // 每月还款明细图表数据（前12个月）
    const monthlyData = result.repaymentSchedule.slice(0, 12).map((item, index) => ({
      name: `第${item.month}月`,
      本金: item.principal,
      利息: item.interest,
      总还款: item.totalPayment,
    }));
    
    setChartData(pieData);
    setMonthlyChartData(monthlyData);
  };
  
  // 处理提前还款计算
  const handleEarlyRepaymentCalculate = () => {
    const input: LoanInput = {
      loanType,
      commercialAmount: parseFloat(commercialAmount) || 0,
      providentAmount: parseFloat(providentAmount) || 0,
      totalAmount: (parseFloat(commercialAmount) || 0) + (parseFloat(providentAmount) || 0),
      commercialRate: parseFloat(commercialRate) || 0,
      providentRate: parseFloat(providentRate) || 0,
      loanTerm: parseFloat(loanTerm) || 0,
      repaymentMethod,
    };
    
    const result = calculateEarlyRepayment(
      input,
      parseFloat(earlyRepaymentAmount) || 0,
      parseFloat(repaymentMonth) || 0
    );
    
    setEarlyRepaymentResult(result);
  };
  
  // 处理贷款能力评估
  const handleAssessmentCalculate = () => {
    const result = assessLoanCapacity(
      parseFloat(monthlyIncome) || 0,
      parseFloat(monthlyExpenses) || 0,
      parseFloat(existingLoans) || 0
    );
    
    setAssessmentResult(result);
  };
  
  // 导出为图片 - 简化版本，避免图表渲染问题
  const handleExportToImage = async () => {
    if (!calculationResult) return;
    
    try {
      // 创建一个简单的导出内容，不包含复杂图表
      const exportContainer = document.createElement('div');
      exportContainer.style.width = '800px';
      exportContainer.style.padding = '40px';
      exportContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      exportContainer.style.borderRadius = '20px';
      exportContainer.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
      exportContainer.style.color = '#ffffff';
      
      // 标题
      const title = document.createElement('h2');
      title.textContent = '🏠 房贷计算结果';
      title.style.marginBottom = '20px';
      title.style.textAlign = 'center';
      title.style.fontSize = '28px';
      title.style.fontWeight = 'bold';
      
      // 生成时间
      const subtitle = document.createElement('p');
      subtitle.textContent = `生成时间: ${new Date().toLocaleString('zh-CN')}`;
      subtitle.style.textAlign = 'center';
      subtitle.style.marginBottom = '30px';
      subtitle.style.fontSize = '14px';
      subtitle.style.opacity = '0.9';
      
      // 贷款信息
      const loanInfo = document.createElement('div');
      loanInfo.style.background = 'rgba(255, 255, 255, 0.2)';
      loanInfo.style.borderRadius = '10px';
      loanInfo.style.padding = '20px';
      loanInfo.style.marginBottom = '30px';
      
      const loanTypeText = loanType === 'commercial' ? '商业贷款' : 
                          loanType === 'provident' ? '公积金贷款' : '组合贷款';
      const amount = loanType === 'combined' ? 
        `${formatCurrency(parseFloat(commercialAmount) + parseFloat(providentAmount))}` :
        loanType === 'commercial' ? formatCurrency(parseFloat(commercialAmount)) :
        formatCurrency(parseFloat(providentAmount));
      
      loanInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 16px;">贷款类型:</span>
          <span style="font-size: 16px; font-weight: 600;">${loanTypeText}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 16px;">贷款金额:</span>
          <span style="font-size: 16px; font-weight: 600;">${amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 16px;">贷款期限:</span>
          <span style="font-size: 16px; font-weight: 600;">${loanTerm}年</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 16px;">还款方式:</span>
          <span style="font-size: 16px; font-weight: 600;">${repaymentMethod === 'equalInstallment' ? '等额本息' : '等额本金'}</span>
        </div>
      `;
      
      // 计算结果卡片
      const resultsContainer = document.createElement('div');
      resultsContainer.style.background = '#ffffff';
      resultsContainer.style.borderRadius = '15px';
      resultsContainer.style.padding = '30px';
      resultsContainer.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.2)';
      resultsContainer.style.color = '#333333';
      
      const resultsTitle = document.createElement('h3');
      resultsTitle.textContent = '📊 计算结果';
      resultsTitle.style.marginBottom = '25px';
      resultsTitle.style.textAlign = 'center';
      resultsTitle.style.fontSize = '22px';
      resultsTitle.style.color = '#007AFF';
      
      // 创建结果网格
      const resultsGrid = document.createElement('div');
      resultsGrid.style.display = 'grid';
      resultsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      resultsGrid.style.gap = '20px';
      resultsGrid.style.marginBottom = '30px';
      
      // 添加结果项
      const resultItems = [
        { label: '贷款总额', value: formatCurrency(calculationResult.totalLoanAmount) },
        { label: '月均还款', value: formatCurrency(calculationResult.monthlyPayment) },
        { label: '首月还款', value: formatCurrency(calculationResult.firstMonthPayment) },
        { label: '总还款额', value: formatCurrency(calculationResult.totalPayment) },
        { label: '总利息', value: formatCurrency(calculationResult.totalInterest) },
        { label: '利息占比', value: formatPercent(calculationResult.totalInterest / calculationResult.totalLoanAmount) },
      ];
      
      resultItems.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.style.background = '#f8f9fa';
        resultItem.style.borderRadius = '10px';
        resultItem.style.padding = '20px';
        resultItem.style.textAlign = 'center';
        resultItem.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        
        const value = document.createElement('div');
        value.textContent = item.value;
        value.style.fontSize = '20px';
        value.style.fontWeight = 'bold';
        value.style.color = '#007AFF';
        value.style.marginBottom = '8px';
        
        const label = document.createElement('div');
        label.textContent = item.label;
        label.style.fontSize = '14px';
        label.style.color = '#666666';
        
        resultItem.appendChild(value);
        resultItem.appendChild(label);
        resultsGrid.appendChild(resultItem);
      });
      
      // 还款计划表（简化）
      const tableTitle = document.createElement('h4');
      tableTitle.textContent = '📅 前12个月还款计划';
      tableTitle.style.marginBottom = '15px';
      tableTitle.style.fontSize = '18px';
      tableTitle.style.color = '#333333';
      
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '20px';
      
      // 表头
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr style="background: #007AFF; color: white;">
          <th style="padding: 12px; text-align: left; border-radius: 8px 0 0 0;">期数</th>
          <th style="padding: 12px; text-align: right;">月供总额</th>
          <th style="padding: 12px; text-align: right;">本金</th>
          <th style="padding: 12px; text-align: right; border-radius: 0 8px 0 0;">利息</th>
        </tr>
      `;
      
      // 表格内容
      const tbody = document.createElement('tbody');
      repaymentSchedule.slice(0, 12).forEach(item => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #e9ecef';
        row.innerHTML = `
          <td style="padding: 10px; color: #666;">第${item.month}期</td>
          <td style="padding: 10px; text-align: right; font-weight: 600; color: #333;">${formatCurrency(item.totalPayment)}</td>
          <td style="padding: 10px; text-align: right; color: #007AFF;">${formatCurrency(item.principal)}</td>
          <td style="padding: 10px; text-align: right; color: #34C759;">${formatCurrency(item.interest)}</td>
        `;
        tbody.appendChild(row);
      });
      
      table.appendChild(thead);
      table.appendChild(tbody);
      
      // 免责声明
      const disclaimer = document.createElement('div');
      disclaimer.style.textAlign = 'center';
      disclaimer.style.marginTop = '20px';
      disclaimer.style.padding = '15px';
      disclaimer.style.background = '#f8f9fa';
      disclaimer.style.borderRadius = '8px';
      disclaimer.style.fontSize = '12px';
      disclaimer.style.color = '#666666';
      disclaimer.textContent = '💡 计算结果仅供参考，实际贷款条件以银行审批为准';
      
      // 组装所有元素
      resultsContainer.appendChild(resultsTitle);
      resultsContainer.appendChild(resultsGrid);
      resultsContainer.appendChild(tableTitle);
      resultsContainer.appendChild(table);
      resultsContainer.appendChild(disclaimer);
      
      exportContainer.appendChild(title);
      exportContainer.appendChild(subtitle);
      exportContainer.appendChild(loanInfo);
      exportContainer.appendChild(resultsContainer);
      
      // 添加到文档并隐藏
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '-9999px';
      document.body.appendChild(exportContainer);
      
      // 生成图片
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      // 清理
      document.body.removeChild(exportContainer);
      
      // 下载
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `房贷计算结果_${new Date().getTime()}.png`;
      link.click();
    } catch (error) {
      console.error('导出失败:', error);
    }
  };
  
  // 格式化金额
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  // 格式化百分比
  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };
  
  // 渲染计算器标签页
  const renderCalculatorTab = () => (
    <div className="glass-card fade-in">
      <div className="form-group">
        <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <Calculator size={20} />
          贷款类型
        </h3>
        <div className="radio-group">
          {loanTypes.map((type) => (
            <label key={type.id} className="radio-label">
              <input
                type="radio"
                name="loanType"
                value={type.id}
                checked={loanType === type.id}
                onChange={(e) => setLoanType(e.target.value as any)}
              />
              <span className="radio-custom"></span>
              <span>{type.icon} {type.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="form-row">
        {loanType === 'combined' && (
          <>
            <div className="form-group">
              <label className="form-label">
                <Building size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
                商贷金额 (元)
              </label>
              <input
                type="number"
                className="form-control"
                value={commercialAmount}
                onChange={(e) => setCommercialAmount(e.target.value)}
                placeholder="请输入商贷金额"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Wallet size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
                公积金金额 (元)
              </label>
              <input
                type="number"
                className="form-control"
                value={providentAmount}
                onChange={(e) => setProvidentAmount(e.target.value)}
                placeholder="请输入公积金金额"
              />
            </div>
          </>
        )}
        
        {loanType === 'commercial' && (
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
              贷款金额 (元)
            </label>
            <input
              type="number"
              className="form-control"
              value={commercialAmount}
              onChange={(e) => setCommercialAmount(e.target.value)}
              placeholder="请输入贷款金额"
            />
          </div>
        )}
        
        {loanType === 'provident' && (
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
              贷款金额 (元)
            </label>
            <input
              type="number"
              className="form-control"
              value={providentAmount}
              onChange={(e) => setProvidentAmount(e.target.value)}
              placeholder="请输入贷款金额"
            />
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">
            <Percent size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
            {loanType === 'provident' ? '公积金利率' : '商贷利率'} (%)
          </label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            value={loanType === 'provident' ? providentRate : commercialRate}
            onChange={(e) => loanType === 'provident' ? setProvidentRate(e.target.value) : setCommercialRate(e.target.value)}
            placeholder="请输入年利率"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <Calendar size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
            贷款年限 (年)
          </label>
          <input
            type="number"
            className="form-control"
            value={loanTerm}
            onChange={(e) => setLoanTerm(e.target.value)}
            placeholder="请输入贷款年限"
          />
        </div>
      </div>
      
      <div className="form-group">
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>还款方式</h3>
        <div className="radio-group">
          {repaymentMethods.map((method) => (
            <label key={method.id} className="radio-label">
              <input
                type="radio"
                name="repaymentMethod"
                value={method.id}
                checked={repaymentMethod === method.id}
                onChange={(e) => setRepaymentMethod(e.target.value as any)}
              />
              <span className="radio-custom"></span>
              <span>{method.name}</span>
              <span className="tooltip" style={{ marginLeft: 'var(--spacing-xs)' }}>
                <Info size={14} />
                <span className="tooltip-text">{method.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleCalculate}
          disabled={isCalculating}
          style={{ minWidth: '200px' }}
        >
          {isCalculating ? (
            <>
              <span className="loading" style={{ marginRight: 'var(--spacing-sm)' }}></span>
              计算中...
            </>
          ) : (
            <>
              <Calculator size={20} />
              开始计算
            </>
          )}
        </button>
      </div>
      
      {calculationResult && (
        <>
          <div ref={exportRef}>
            <div className="divider"></div>
            
            <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <TrendingUp size={20} />
              计算结果
            </h3>
            
            <div className="result-grid">
              <div className="result-card">
                <div className="result-value">{formatCurrency(calculationResult.totalLoanAmount)}</div>
                <div className="result-label">贷款总额</div>
              </div>
              <div className="result-card">
                <div className="result-value">{formatCurrency(calculationResult.monthlyPayment)}</div>
                <div className="result-label">月均还款</div>
              </div>
              <div className="result-card">
                <div className="result-value">{formatCurrency(calculationResult.firstMonthPayment)}</div>
                <div className="result-label">首月还款</div>
              </div>
              <div className="result-card">
                <div className="result-value">{formatCurrency(calculationResult.totalPayment)}</div>
                <div className="result-label">总还款额</div>
              </div>
              <div className="result-card">
                <div className="result-value">{formatCurrency(calculationResult.totalInterest)}</div>
                <div className="result-label">总利息</div>
              </div>
              <div className="result-card">
                <div className="result-value">{formatPercent(calculationResult.totalInterest / calculationResult.totalLoanAmount)}</div>
                <div className="result-label">利息占比</div>
              </div>
            </div>
            
            <div className="chart-container">
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>还款构成</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-container">
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>前12个月还款明细</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => formatCurrency(value).replace('¥', '')} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="本金" fill="#007AFF" />
                  <Bar dataKey="利息" fill="#34C759" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="table-container">
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>还款计划表（前12个月）</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>期数</th>
                    <th>月供总额</th>
                    <th>本金</th>
                    <th>利息</th>
                    <th>剩余本金</th>
                  </tr>
                </thead>
                <tbody>
                  {repaymentSchedule.map((item) => (
                    <tr key={item.month}>
                      <td>第{item.month}期</td>
                      <td>{formatCurrency(item.totalPayment)}</td>
                      <td>{formatCurrency(item.principal)}</td>
                      <td>{formatCurrency(item.interest)}</td>
                      <td>{formatCurrency(item.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
            <button className="btn btn-secondary" onClick={handleExportToImage}>
              <Download size={20} />
              导出为图片
            </button>
          </div>
        </>
      )}
    </div>
  );
  
  // 渲染利率对比标签页
  const renderComparisonTab = () => (
    <div className="glass-card fade-in">
      <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <BarChart3 size={20} />
        利率对比
      </h3>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>银行/机构</th>
              <th>利率</th>
              <th>期限</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {rateComparisons.map((comparison, index) => (
              <tr key={index}>
                <td>{comparison.bank}</td>
                <td>
                  <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                    {formatPercent(comparison.rate)}
                  </span>
                </td>
                <td>{comparison.term}</td>
                <td>{comparison.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="chart-container">
        <h4 style={{ marginBottom: 'var(--spacing-md)' }}>利率对比图表</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rateComparisons}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="bank" stroke="var(--text-secondary)" />
            <YAxis 
              stroke="var(--text-secondary)" 
              tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
            />
            <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} />
            <Bar dataKey="rate" fill="#007AFF" name="利率" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  
  // 渲染贷款能力评估标签页
  const renderAssessmentTab = () => (
    <div className="glass-card fade-in">
      <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <Target size={20} />
        贷款能力评估
      </h3>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">月收入 (元)</label>
          <input
            type="number"
            className="form-control"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder="请输入月收入"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">月支出 (元)</label>
          <input
            type="number"
            className="form-control"
            value={monthlyExpenses}
            onChange={(e) => setMonthlyExpenses(e.target.value)}
            placeholder="请输入月支出"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">已有贷款月供 (元)</label>
          <input
            type="number"
            className="form-control"
            value={existingLoans}
            onChange={(e) => setExistingLoans(e.target.value)}
            placeholder="请输入已有贷款月供"
          />
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
        <button className="btn btn-primary" onClick={handleAssessmentCalculate}>
          <Target size={20} />
          评估贷款能力
        </button>
      </div>
      
      {assessmentResult && (
        <>
          <div className="divider"></div>
          
          <h4 style={{ marginBottom: 'var(--spacing-lg)' }}>评估结果</h4>
          
          <div className="result-grid">
            <div className="result-card">
              <div className="result-value">{formatCurrency(assessmentResult.maxLoanAmount)}</div>
              <div className="result-label">最大可贷额度</div>
            </div>
            
            <div className="result-card">
              <div className="result-value">{formatCurrency(assessmentResult.affordableMonthlyPayment)}</div>
              <div className="result-label">可承受月供</div>
            </div>
            
            <div className="result-card">
              <div className="result-value">{assessmentResult.suggestedLoanTerm}年</div>
              <div className="result-label">建议贷款期限</div>
            </div>
            
            <div className="result-card">
              <div className="result-value">
                <span className={`badge badge-${assessmentResult.riskLevel === 'high' ? 'danger' : assessmentResult.riskLevel === 'medium' ? 'warning' : 'success'}`}>
                  {assessmentResult.riskLevel === 'high' ? '高风险' : assessmentResult.riskLevel === 'medium' ? '中等风险' : '低风险'}
                </span>
              </div>
              <div className="result-label">风险等级</div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ marginTop: 'var(--spacing-lg)' }}>
            <h5>评估说明：</h5>
            <ul style={{ marginTop: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
              <li>基于您的收入支出情况，建议月供不超过月收入的40%</li>
              <li>风险评估基于负债收入比计算</li>
              <li>实际贷款额度可能受信用记录、工作稳定性等因素影响</li>
              <li>建议咨询专业金融机构获取准确评估</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
  
  // 渲染提前还款标签页
  const renderEarlyRepaymentTab = () => (
    <div className="glass-card fade-in">
      <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <RefreshCw size={20} />
        提前还款计算
      </h3>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">提前还款金额 (元)</label>
          <input
            type="number"
            className="form-control"
            value={earlyRepaymentAmount}
            onChange={(e) => setEarlyRepaymentAmount(e.target.value)}
            placeholder="请输入提前还款金额"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">还款期数 (月)</label>
          <input
            type="number"
            className="form-control"
            value={repaymentMonth}
            onChange={(e) => setRepaymentMonth(e.target.value)}
            placeholder="请输入在第几个月提前还款"
          />
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
        <button className="btn btn-primary" onClick={handleEarlyRepaymentCalculate}>
          <RefreshCw size={20} />
          计算提前还款
        </button>
      </div>
      
      {earlyRepaymentResult && (
        <>
          <div className="divider"></div>
          
          <h4 style={{ marginBottom: 'var(--spacing-lg)' }}>提前还款结果</h4>
          
          <div className="result-grid">
            <div className="result-card">
              <div className="result-value">{formatCurrency(earlyRepaymentResult.interestSaved)}</div>
              <div className="result-label">节省利息</div>
            </div>
            
            <div className="result-card">
              <div className="result-value">{formatCurrency(earlyRepaymentResult.newTotalPayment)}</div>
              <div className="result-label">新总还款额</div>
            </div>
            
            <div className="result-card">
              <div className="result-value">
                {earlyRepaymentResult.newSchedule.length}期
              </div>
              <div className="result-label">剩余期数</div>
            </div>
          </div>
          
          <div className="glass-panel" style={{ marginTop: 'var(--spacing-lg)' }}>
            <h5>提前还款建议：</h5>
            <ul style={{ marginTop: 'var(--spacing-md)', paddingLeft: 'var(--spacing-lg)' }}>
              <li>提前还款可以显著减少总利息支出</li>
              <li>建议在贷款前期进行提前还款，节省效果更明显</li>
              <li>部分银行可能收取提前还款手续费</li>
              <li>提前还款后，可以选择缩短贷款期限或减少月供</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
  
  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>🏠 房贷计算器</h1>
          <p>专业的房贷计算工具，支持商贷、公积金贷款、组合贷款计算</p>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
            贷款计算
          </button>
          
          <button 
            className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            <BarChart3 size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
            利率对比
          </button>
          
          <button 
            className={`tab ${activeTab === 'assessment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assessment')}
          >
            <Target size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
            能力评估
          </button>
          
          <button 
            className={`tab ${activeTab === 'early' ? 'active' : ''}`}
            onClick={() => setActiveTab('early')}
          >
            <RefreshCw size={16} style={{ marginRight: 'var(--spacing-sm)' }} />
            提前还款
          </button>
        </div>
        
        {activeTab === 'calculator' && renderCalculatorTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
        {activeTab === 'assessment' && renderAssessmentTab()}
        {activeTab === 'early' && renderEarlyRepaymentTab()}
        
        <div className="glass-panel" style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            💡 提示：计算结果仅供参考，实际贷款条件以银行审批为准
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;