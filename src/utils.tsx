const emotion_prefix = 'https://chentao.me/static/emotion/';

// [流鼻血][捂脸哭][开心][色][衰][送花花]
export const tag2index: { [x: string]: number | undefined } = {
  狗头: 97, 流鼻血: 85, 开心: 113, 微笑: 1, 色: 3, 发呆: 4,
  衰: 39, 加油: 28, 可爱: 99, 憨笑: 2, 老板: 5, 流泪: 6,
  害羞: 7, 闭嘴: 8, 睡: 9, 大哭: 10, 尴尬: 11, 调皮: 13,
  大笑: 14, 惊讶: 15, 流汗: 16, 广播: 17, 自信: 18, 你强: 19,
  怒吼: 20, 惊愕: 21, 疑问: 22, 偷笑: 26, 无聊: 27, 快哭了: 29,
  吐: 30, 晕: 31, 摸摸: 32, 飞吻: 34, 傻笑:36, 鄙视: 37,
  嘘: 38, 思考: 40, 亲亲: 41, 无奈: 42, 口罩: 43, 对不起: 44,
  再见: 45, 投降: 46, 哼: 47, 欠扁: 48, 拜托: 49, 可怜: 50,
  舒服: 51, 爱意: 52, 财迷: 54, 迷惑: 55, 委屈: 56, 灵感: 57,
  天使: 58, 鬼脸: 59, 凄凉: 60, 郁闷: 61, 坏笑: 63, 算账: 64,
  PK: 53, 忍者:66, 炸弹: 67, 笑哭: 81, 嘿嘿: 82, 捂脸哭: 83,
  抠鼻: 84, 呲牙: 90, 吃瓜: 91, 彩虹: 92, 耶: 98, 发怒: 12,
  捂眼睛: 100, 推眼镜: 101, 暗中观察: 102, 脑爆: 103, 冷笑: 112, 热: 208,
  惊喜: 114, 回头: 115, 白眼: 116, 一团乱麻: 117, 黑眼圈: 149, 恭喜: 156,
  费解: 160, 收到: 167, 快来: 186, 敲打: 86, 捧脸: 176, GET: 194,
  客服: 207, 专注: 93, 忙疯了:166, 等一等: 187, 抱大腿: 191, 跪了: 87,
  鞠躬: 162, 感谢: 80, 拒绝: 204001, 赞: 78, 鼓掌: 24, 666: 159,
  抱拳: 79, 握手: 25, OK: 23, 胜利: 33, 一点点: 141, 捏住: 179,
  比心: 140, 送花花: 106, 加油干: 178,
}
export const tag2url = (tag: string): (string | undefined) => {
  const type = 'png'
  const index = tag2index[tag]
  if (!index) {
    return undefined
  }

  return `${emotion_prefix}${index2str(index)}.${type}`
}

const index2str = (n: number) => {
  let prefix = ''
  let m = n
  while (m < 100) {
    prefix += '0'
    m *= 10
  }
  return `${prefix}${n}`
}

export enum MsgItemType {
  TEXT = 0,
  IMG = 1
}

export interface MsgItem {
  type: MsgItemType
  value: string
}
const msg2arr = (msg: string): MsgItem[] => {
  let cur = 0
  let arr: MsgItem[] = []

  const reg = /\[(\S{1,4})\]/g

  let m: RegExpExecArray | null
  while (m = reg.exec(msg)) {
    const i = m.index

    if (cur < i) {
      arr.push({ type: MsgItemType.TEXT, value: msg.substring(cur, i) })
    }

    const url = tag2url(m[1])
    if (url) {
      arr.push({
        type: MsgItemType.IMG,
        value: url,
      })
    } else {
      arr.push({
        type: MsgItemType.TEXT,
        value: m[0],
      })
    }

    cur = i + m[0].length
  }

  if (cur < msg.length) {
    arr.push({
      type: MsgItemType.TEXT,
      value: msg.substring(cur)
    })
  }

  return arr
}

const converge = (arr: MsgItem[]): MsgItem[] => {
  const len = arr.length
  if (len <= 1) {
    return arr
  }

  const r: MsgItem[] = [arr[0]]
  for (let i = 1; i < len; i++) {
    const cur = arr[i]
    const last = r[r.length - 1]
    if (last.type !== MsgItemType.TEXT || cur.type !== MsgItemType.TEXT) {
      r.push(cur)
      continue
    }
    r[r.length - 1] = {
      type: MsgItemType.TEXT,
      value: last.value + cur.value,
    }
  }

  return r
}

export const msg2items = (msg: string) => converge(msg2arr(msg))
// export const msg2items = (msg: string) => {
//   const arr = msg2arr(msg)
//   return converge(arr)
// }

export const tag2dom = (clickHandler: (tag: string) => void, tag: string) => (
  <img
    key={tag}
    src={tag2url(tag)}
    title={tag}
    onClick={() => clickHandler(tag)}
  />
)
