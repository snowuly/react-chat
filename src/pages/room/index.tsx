import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs'
import './index.scss';

import { sendMsg, joinRoom, getRoomInfo, clearLog } from '../../api'
import Info from '../../components/Info'
import { msg2items, MsgItemType, MsgItem, tag2index, tag2url, tag2dom } from '../../utils'
import Popover from '../../components/popover'
import happy from './happy.svg'
import useRecentEmotion from '../../hooks/useRecentEmotion'
import Loading from '../../components/Loading'
import { UserCtx } from '../../layout';
import { Link, useParams } from 'react-router-dom';

type RoomInfo = {
  ID: number
	Name:   string
	Num:    number
	Priv:   boolean
	Credit: boolean
}

interface Msg {
  ID: string
  From: string
  To: string
  Txt: string
  Time: number
  Priv: boolean
  items: MsgItem[]
}

interface User {
  ID: string
  IP: string
  Admin: boolean
}

const format = 'H点m分'
const fullFormat = 'YYYY-MM-DD HH:mm:ss'

function Room() {
  const params = useParams<{ id: string }>()
  const roomId = useMemo(() => params.id || '', [params])
  const [inputFocus, setInputFocus] = useState(false)
  const inputClassName = useMemo(() => inputFocus ? 'input focus' : 'input', [inputFocus])

  const [ready, setReady] = useState(false)
  const msgToken = useRef('')
  const [priv, setPriv] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([]) 
  const [news, setNews] = useState(false)
  const [target, setTarget] = useState('')

  const user = useContext(UserCtx)

  const [users, setOnlineUsers] = useState<User[]>([])
  const selectList = useMemo(() => (
    users.filter(item => item.ID !== user!.name).map(item => item.ID)
  ), [users, user])

  const inputRef = useRef<HTMLTextAreaElement>(null)

  // --------- emotion float layer --------------
  const [ tags, setLastTag ] = useRecentEmotion()

  const insertEmotion = useCallback((tag: string) => {
      const el = inputRef.current!
      el.focus()
      el.setRangeText(`[${tag}]`, el.selectionStart, el.selectionEnd, 'end')
      setLastTag(tag)
  }, [])

  const bindTag2dom = useMemo(() => tag2dom.bind(null, insertEmotion), [])

  const layer = useMemo(() => (
    <>
      { tags.length > 0 && (<>
        <header>常用表情</header>
        <main>
          { tags.map(bindTag2dom) }
        </main>
      </>) }
      <header>默认表情</header>
      <main>
        { Object.keys(tag2index).map(bindTag2dom) }
      </main>
    </>
  ), [tags])

  const outputRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrolling = useRef(false)
  const needRef = useRef(true)

  const needScroll = () => {
    const output = outputRef.current!
    return scrolling.current || output.scrollTop + output.offsetHeight >= output.scrollHeight - 66
  }

  const scrollToBottom = (auto = false) => {
    bottomRef.current?.scrollIntoView({ behavior: auto ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    if (!needRef.current) {
      setNews(true)
      return
    }

    scrolling.current = true

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    const timer = setTimeout(() => {
      scrolling.current = false
    }, 1000)

    return () =>  clearTimeout(timer)

  }, [msgs])

  const [userLoading, setUserLoading] = useState(false)
  const [unique, setUnique] = useState(Symbol('x'))

  const doJoinRoom = async () => {
    while (true) {
      const pwd = window.prompt("请输入房间密码：")
      if (pwd === null) {
        return
      }
      if (await joinRoom(roomId, pwd)) {
        setUnique(Symbol('x'))
        return
      }
    }
  }

  useEffect(() => {
    setUserLoading(true)
    const evtSrc = new EventSource(`/go/sse?room=${roomId}`)

    evtSrc.addEventListener('token', evt => {
      setReady(true)
      msgToken.current = (evt as MessageEvent).data
    })

    evtSrc.addEventListener('users', evt => {
      setOnlineUsers(window.JSON.parse((evt as MessageEvent).data))
      setUserLoading(false)
    })
    
    evtSrc.addEventListener('msg', evt => {
      needRef.current = needScroll()

      const m: Msg = JSON.parse((evt as MessageEvent).data)
      m.items = msg2items(m.Txt)
      setMsgs(value => value.concat(m))

      if (m.To === user!.name) {
        new Notification(m.From, { body: m.Txt })
      }
      
    })

    evtSrc.addEventListener('log', evt => {
      const m: Msg[] = JSON.parse((evt as MessageEvent).data)
      setMsgs(m.map(item => ({
        ...item,
        items: msg2items(item.Txt),
      })))

      scrollToBottom(true)
    })

    evtSrc.addEventListener('err', e => {
      setUserLoading(false)
      evtSrc.close()
      let msg: string
      switch ((e as MessageEvent).data) {
        case 'pwd':
          doJoinRoom()
          return
        case 'kicked':
          msg = '已在其它窗口登录'
          break
        default:
          msg = '发生错误'
      }
      setErr(msg)
      setReady(false)
    })

    evtSrc.onerror = () => {
      evtSrc.close()
      setErr('已掉线')
      setOnlineUsers([])
      setReady(false)
    }

    return () => {
      evtSrc.close()
    }
  }, [user, unique])



  const [err, setErr] = useState('')
  const onReconnect = useCallback(() => {
    setUnique(Symbol('x'))
    setErr('')
  }, [])

  const sendingRef = useRef(false)
  const handleSend = useCallback(async () => {
    const msg = inputRef.current!.value.trim()

    if (!user || sendingRef.current || !msg) {
      return
    }

    sendingRef.current = true
    inputRef.current!.readOnly = true


    try {
      await sendMsg(roomId, msgToken.current, target, msg, priv && !!target)
      inputRef.current!.value = ''
    } catch (e) {
      alert((e as { msg: string }).msg)
    } finally {
      sendingRef.current = false
      inputRef.current!.readOnly = false
    }

  }, [target, priv])

  const onScroll = useMemo(() => {
    let timer: number
    return () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (needScroll()) {
          setNews(false)
        }
      }, 200)
    }
  }, [])

  const hanldeNews = useCallback(() => {
    setNews(false)
    scrollToBottom()
  }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }, [target, priv])

  useEffect(() => {
    if (users.findIndex(item => item.ID === target) < 0) {
      setTarget('')
    }
  }, [users, target])

  const [roomInfo, setRoomInfo] = useState<RoomInfo | undefined>(undefined)
  useEffect(() => {
    const oldTitle = document.title;

    (async () => {
      const info: RoomInfo = await getRoomInfo(roomId)
      document.title = `${oldTitle} - ${info.Name}`
      setRoomInfo(info)
    })()

    return () => { document.title = oldTitle }
  }, [])

  const onClearLog = async () => {
    if (window.confirm("确定要清除吗？")) {
      if (await clearLog(roomId) !== undefined) {
        alert("操作成功")
      }
    }
  }

  return (
    <div className="room">
      <main>
        <div className="info">
          { roomInfo && <span className="title">&lt;房间：{ roomInfo.Name } { roomInfo.Priv && '🔒' }&gt;</span> }
          <Link to="/" className="back">返回</Link>
        </div>
        { user?.admin && <a className="clear" onClick={onClearLog}>清除</a> }
        <span
          className="news"
          hidden={!news}
          onClick={hanldeNews}
        >新消息</span>
        <section ref={outputRef} onScroll={onScroll}>
          { msgs.map(item => (
            <li key={item.ID}>
              <span className="prefix">
                <span
                  title={dayjs(item.Time*1000).format(fullFormat)}
                >{dayjs(item.Time*1000).format(format)}</span>
                <span className={item.From === user!.name ? 'active' : undefined}>{ item.From }</span>
                { item.Priv && <span>悄悄地</span> }
                { item.To !== "" && <><span>对</span><span className={item.To === user!.name ? 'active' : undefined}>{ item.To }</span></> }
                <span>说：</span>
              </span>
              <span>{ item.items.map(item => (
                item.type === MsgItemType.TEXT
                  ? item.value
                  : <img className="emotion" src={item.value} />
              )) }</span>
            </li>
          )) }
          <div ref={bottomRef} className="bottom"></div>
        </section>
        <aside>
          <header>在线用户（{ users.length }）</header>
          { userLoading ? <div className="user-loading"><Loading /></div>
            : (<ul>
                { users.map(u => (
                  <li
                    key={u.ID}
                    className={u.Admin
                      ? 'admin'
                      : (u.ID === user!.name ? 'active' : undefined)
                    }
                  >
                    {`${u.ID}（${u.IP}）`}
                  </li>
                )) }
              </ul>)
          }
          
        </aside>
      </main>
      <footer>
        <div className="send">
          <div className="send-to">
            <select
              id="user-select"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">所有人</option>
              { selectList.map(item => (
                <option key={item} value={item}>{ item }</option>
              )) }
            </select>
            <Popover
              content={layer}
              className="happy-cnt"
            >
              <img className="happy" src={happy} />
            </Popover>
          </div>
          <div className="send-info">
            <div className="send-private">
              <input
                type="checkbox"
                id="private"
                disabled={!target}
                onChange={(e) => setPriv(e.target.checked)}
              />
              <label htmlFor="private">私聊</label>
            </div>
            <div className="send-btn">
              <button onClick={handleSend} disabled={!user || !ready}>发送</button>
            </div>
            </div>
        </div>
        <div className={inputClassName}>
          <textarea
            disabled={!ready}
            onFocus={() => setInputFocus(true)}
            onBlur={() => setInputFocus(false)}
            ref={inputRef}
            onKeyDown={onKeyDown}
            spellCheck={false}
          />
        </div>
      </footer>
      <Info value={err} onOK={onReconnect} onCancel={() => setErr('')} />
    </div>
  );
}

export default Room
