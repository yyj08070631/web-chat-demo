// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const createServer = require('http').createServer;
const WebSocketServer = require('ws').WebSocketServer
const session = require('express-session')
const uuid = require('uuid')
const bodyParser = require('body-parser')
const t = require('./tools.js')
const port = process.env.PORT || 3000;
const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

class Server {
  constructor () {
    // 实例
    this.wss = new WebSocketServer({ noServer: true })
    this.server = createServer(app)
    // 数据
    this.msgs = []
    this.userMap = new Map()
  }
  messageHandler (message, { id, name }) {
    const { status, data, ackId } = t.JSONParse(message)
    const fns = {
      '000': () => {
        const { ws } = this.userMap.get(id)
        const msg = { id, ackId, name, message: data, createTime: Date.now() }
        this.msgs.push(msg)
        // 响应
        ws.send(t.JSONStringify({ data: msg, status: '000' }))
        // 广播
        this.broadcast(msg)
      },
    }
    const fn = fns[status] || (() => {})
    fn()
  }
  broadcast (data) {
    this.userMap.forEach(({ ws }, userId) => {
      ws.send(t.JSONStringify({ data, status: '000000' }))
    })
  }
  initExpressServer () {
    // 起 express server
    this.server.listen(port, () => {
      t.log(`Server listening on http://localhost:${port}`);
    });
    // 部署静态资源目录
    app.use(express.static(path.join(__dirname, 'public')));
    // 会话管理
    app.use(sessionParser);
    // 配置参数解析器
    app.use(bodyParser.json())
    // 接口
    // 登入
    app.post('/login', (req, res) => {
      const id = uuid.v4();
      const name = req.body.name
    
      t.log(`正在更新用户 ${name} 的 session`);
      req.session.user = { id, name };
      res.send({ code: 0, data: { id, name }, message: '登录成功' });
    });
    // 登出
    app.post('/logout', (request, response) => {
      const { ws } = this.userMap.get(request.session.user.id);
    
      t.log('Destroying session');
      request.session.destroy(() => {
        if (ws) ws.close();
    
        response.send({ code: 0, message: 'session 已销毁' });
      });
    });
    // 轮询
    app.get('/polling', (request, response) => {
      const { ws } = this.userMap.get(request.session.user.id);
      // 25s 正常断开连接，等待客户端重连
      // 监听到
    
      t.log('Destroying session');
      request.session.destroy(() => {
        if (ws) ws.close();
    
        response.send({ code: 0, message: 'session 已销毁' });
      });
    });
  }
  initWss () {
    // ws 连接
    this.wss.on('connection', (ws, request, client) => {
      const { id, name } = request.session.user;

      this.userMap.set(id, { id, name, ws });
    
      ws.on('message', message => {
        this.messageHandler(message, { id, name })
        t.log(`接到 ${name} 的消息：${message}`);
      });
      ws.on('close', () => {
        this.userMap.delete(id);
      });
    });
    // ws 协议升级
    // ws 库有内置的 http server
    // 如果想用第三方的 http server 比如 express，就需要监听 express server 的协议升级事件，为 ws 实例完成 http 握手
    this.server.on('upgrade', (request, socket, head) => {
      t.log('session 正在解析');

      sessionParser(request, {}, () => {
        if (!request.session.user) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        t.log('session 解析完毕');

        this.wss.handleUpgrade(request, socket, head, ws => {
          this.wss.emit('connection', ws, request);
        });
      });
    });
  }
}

const instance = new Server()
instance.initWss()
instance.initExpressServer()
