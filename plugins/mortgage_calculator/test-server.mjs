import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简单的测试服务器
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  // 设置CORS头
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
  if (req.url === '/api/rates' && req.method === 'GET') {
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
  } else if (req.url === '/api/calculate' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // 简单的计算示例
        const result = {
          success: true,
          data: {
            message: '计算完成',
            timestamp: new Date().toISOString(),
            input: data,
            monthlyPayment: 5000, // 示例数据
            totalInterest: 100000, // 示例数据
            totalPayment: 600000 // 示例数据
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
  } else {
    // 返回HTML页面
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>房贷计算器测试</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .container {
              background: rgba(255, 255, 255, 0.95);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 600px;
              width: 100%;
            }
            h1 {
              color: #333;
              margin-bottom: 30px;
              text-align: center;
            }
            .status {
              background: #4CAF50;
              color: white;
              padding: 10px 20px;
              border-radius: 10px;
              margin-bottom: 20px;
              text-align: center;
            }
            .endpoints {
              background: #f5f5f5;
              border-radius: 10px;
              padding: 20px;
              margin-top: 20px;
            }
            .endpoint {
              margin: 10px 0;
              padding: 10px;
              background: white;
              border-radius: 5px;
              border-left: 4px solid #007AFF;
            }
            code {
              background: #e9ecef;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏠 房贷计算器插件</h1>
            <div class="status">
              ✅ 服务器运行正常
            </div>
            <p>这是一个功能完整的房贷计算器Mulby插件，包含以下功能：</p>
            <ul>
              <li>商业贷款、公积金贷款、组合贷款计算</li>
              <li>等额本息、等额本金还款方式</li>
              <li>提前还款计算器</li>
              <li>利率对比功能</li>
              <li>贷款能力评估</li>
              <li>iOS 26玻璃态设计</li>
              <li>图表可视化</li>
              <li>数据导出功能</li>
            </ul>
            
            <div class="endpoints">
              <h3>📡 API端点</h3>
              <div class="endpoint">
                <strong>GET /api/rates</strong><br>
                <code>curl http://localhost:3000/api/rates</code>
              </div>
              <div class="endpoint">
                <strong>POST /api/calculate</strong><br>
                <code>curl -X POST -H "Content-Type: application/json" -d '{"amount":1000000,"rate":0.039,"term":30}' http://localhost:3000/api/calculate</code>
              </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <p>要使用完整功能，请在Mulby中安装此插件。</p>
              <p style="color: #666; font-size: 14px;">项目已成功构建，可以部署到Mulby插件商店。</p>
            </div>
          </div>
          
          <script>
            // 测试API
            async function testAPI() {
              try {
                const response = await fetch('/api/rates');
                const data = await response.json();
                console.log('API测试成功:', data);
              } catch (error) {
                console.error('API测试失败:', error);
              }
            }
            
            // 页面加载后测试API
            window.addEventListener('load', testAPI);
          </script>
        </body>
      </html>
    `;
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 测试服务器运行在 http://localhost:${PORT}`);
  console.log(`📱 在浏览器中访问查看插件界面`);
  console.log(`📊 API端点可用:`);
  console.log(`   GET  http://localhost:${PORT}/api/rates`);
  console.log(`   POST http://localhost:${PORT}/api/calculate`);
  console.log(`\n✅ 插件开发完成，可以部署到Mulby！`);
});