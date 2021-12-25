exports.log = (...msgs) => {
  for (let i = 0; i < msgs.length; i++) {
    console.log('[MYLOG] %s', msgs[i])
  }
}
exports.JSONParse = str => {
  let res = str
  try {
    res = JSON.parse(str)
  } catch (e) {
    exports.log(e)
  }
  return res
}
exports.JSONStringify = obj => {
  let res = obj
  try {
    res = JSON.stringify(obj)
  } catch (e) {
    exports.log(e)
  }
  return res
}
