import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动态导入构建后的后端代码
let main;
try {
  const module = await import('./dist/main.js');
  main = module.default;
} catch (error) {
  console.error('Failed to load main module:', error);
  process.exit(1);
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 处理静态文件
  if (req.url.startsWith('/ui/')) {
    const filePath = path.join(__dirname, req.url);
    const extname = path.extname(filePath);
    
    let contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
    }
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error: ' + error.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  } else {
    // 调用插件主函数
    main(req, res);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 开发服务器运行在 http://localhost:${PORT}`);
  console.log(`📱 在Mulby中访问插件`);
  console.log(`📊 测试API端点: http://localhost:${PORT}/api/rates`);
});