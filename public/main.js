const log = (...msgs) => {
  for (let i = 0; i < msgs.length; i++) {
    console.log('[MYLOG] %o', msgs[i])
  }
}
const JSONParse = str => {
  let res = str
  try { res = JSON.parse(str) } catch (e) { log(e) }
  return res
}
const JSONStringify = obj => {
  let res = obj
  try { res = JSON.stringify(obj) } catch (e) { log(e) }
  return res
}

// send 应答监听 map
let ackMap = new Map()
// send 应答监听的 id 累加值标记
let ackIdAccu = -1
// pollingInterval
const pollingInterval = 25000

const app = new Vue({
  el: '#app',
  data: {
    // 主要数据
    msgs: [],
    // 临时状态
    userName: '',
    text: '',
    loading: false,
    // 常量
    userId: null
  },
  methods: {
    login () {
      axios.post('/login', {
        name: this.userName
      }).then(({ data: res }) => {
        this.userId = res.data.id
        log(res)
        this.initWs()
      })
    },
    logout () {
      axios.post('/logout').then(({ data: res }) => {
        log(res)
      })
    },
    initWs () {
      // Create WebSocket connection.
      this.ws = new WebSocket('ws://localhost:3000/foo');

      // Connection opened
      this.ws.addEventListener('open', event => {
        log('wss connected.')
      });
      // Listen for messages
      this.ws.addEventListener('message', event => {
        const { data, status } = JSONParse(event.data)
        log(data, status)
        const fns = {
          '000': () => {
            log(`${data.name} 发送了 ${data.message} 响应`)
            // 处理发送回调
            const ack = ackMap.get(data.ackId) || {}
            log(data)
            ack.cb && ack.cb(ack.data, { data, status })
          },
          '000000': () => {
            log(`${data.name} 发送了 ${data.message}`)
            this.msgs.push(data)
          },
        }
        const fn = fns[status] || (() => {})
        fn()
      });
    },
    // 初始化长轮询连接
    initPolling () {
      axios.get('/polling', {
        params: {}
      }).then(({ data: { code, data, status } }) => {
        // 返回了消息，走正常信息处理，重新轮询
        // pollingInterval 结束 server 断开连接，重新轮询
        // ws 已连接，断开连接，后续使用 ws 通信
        if (code === 0) {
        } else if (code === 1) {
        } else if (code === 2) {}
      })
    },
    send (cb /* (req, res) => {} */) {
      const ackId = ++ackIdAccu
      const data = { status: '000', data: this.text }

      this.ws.send(JSONStringify({ ackId, ...data }))
      // 注册发送回调，需要发送接收一一对应，因此使用一个递增 id 记录
      ackMap.set(ackId, { cb, data })
      this.text = ''
    },
    sendAndLog () {
      this.send((req, res) => {
        log('发送响应', req, res)
      })
    }
  },
  filters: {
    dateFormat: v => new Intl.DateTimeFormat('zh-cn', { dateStyle: 'short',timeStyle: 'short' }).format(v)
  },
  created () {
  },
  mounted () {
    this.$refs.nameInput.focus()
  },
  beforeDestroy () {
    this.logout()
  }
})
