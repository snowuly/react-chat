import { ReactNode } from "react";

const emotion_prefix = 'https://chentao.me/static/emotion/';

// [流鼻血][捂脸哭][开心][色][衰][送花花]
export const tag2index: { [x: string]: number | undefined } = {
  狗头: 97,
  流鼻血: 85,
  开心: 113,
  微笑: 1,
  色: 3,
  发呆: 4,
  衰: 39,
  加油: 28,
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
        type: MsgItemType.TEXT,
        value : msg.substring(cur, m.index),
      })
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
