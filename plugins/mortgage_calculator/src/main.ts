import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

// 插件主入口
export default function main(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // 路由处理
  if (pathname === '/api/calculate' && req.method === 'POST') {
    handleCalculate(req, res);
  } else if (pathname === '/api/rates' && req.method === 'GET') {
    handleGetRates(req, res);
  } else {
    // 默认返回 UI
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>房贷计算器</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/ui/index.js"></script>
        </body>
      </html>
    `);
  }
}

// 处理计算请求
function handleCalculate(req: IncomingMessage, res: ServerResponse) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      
      // 这里可以添加更复杂的计算逻辑
      const result = {
        success: true,
        data: {
          message: '计算完成',
          timestamp: new Date().toISOString(),
          input: data
        }
      };
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: '无效的请求数据'
      }));
    }
  });
}

// 获取利率数据
function handleGetRates(req: IncomingMessage, res: ServerResponse) {
  const rates = [
    { bank: '工商银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '建设银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '农业银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '中国银行', rate: 0.039, term: '5年以上', notes: '首套房' },
    { bank: '招商银行', rate: 0.0385, term: '5年以上', notes: '优质客户' },
    { bank: '公积金贷款', rate: 0.0325, term: '5年以上', notes: '首套房' },
  ];
  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: true,
    data: rates
  }));
}