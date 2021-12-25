# web-chat-demo

## protocol
```ts
// 响应状态
enum code {
  0: '成功',
  1: '未知错误',
}
// 客户端消息
enum clientStatus {
  '000': '发消息',
}
// 服务端消息
enum serverStatus {
  '000': '消息响应',
  '000000': '消息广播',
}
```
