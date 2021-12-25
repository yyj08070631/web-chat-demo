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
        const { code, data, status } = JSONParse(event.data)
        log(code, data, status)
        const fns = {
          '000': () => {
            log(`${data.name} 发送了 ${data.message} 响应`)
          },
          '000000': () => {
            this.msgs.push(data)
            log(`${data.name} 发送了 ${data.message}`)
          },
        }
        const fn = fns[status] || (() => {})
        fn()
      });
    },
    send () {
      const data = { status: '000', data: this.text }
      this.ws.send(JSONStringify(data))
      this.text = ''
    }
  },
  filters: {
    dateFormat: v => new Intl.DateTimeFormat('zh-cn', { dateStyle: 'short',timeStyle: 'short' }).format(v)
  },
  created () {
    // this.login()
  },
  mounted () {
    this.$refs.nameInput.focus()
  },
  beforeDestroy () {
    this.logout()
  }
})
