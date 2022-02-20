import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs'
import './App.scss';

import { getUser, login, sendMsg, isAdmin, clearLog } from './api'
import Info from './components/Info'

interface Msg {
  ID: string
  From: string
  To: string
  Txt: string
  Time: number
  Pri: boolean
}

interface User {
  ID: string
  IP: string
  Admin: boolean
}

const format = 'H点m分'
const fullFormat = 'YYYY-MM-DD HH:mm:ss'

function App() {
  
  const [inputFocus, setInputFocus] = useState(false)
  const inputClassName = useMemo(() => inputFocus ? 'input focus' : 'input', [inputFocus])

  const [priv, setPriv] = useState(false)

  const [msgs, setMsgs] = useState<Msg[]>([]) 

  const [news, setNews] = useState(false)

  const [target, setTarget] = useState('')

  const [user, setUser] = useState<undefined | string>(undefined)
  const [users, setOnlineUsers] = useState<User[]>([])
  const selectList = useMemo(() => (
    users.filter(item => item.ID !== user).map(item => item.ID)
  ), [users, user])

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const doLogin = async () => {
    
    while (true) {
      let secret = window.prompt("请输入悄悄话登录，有疑问找大厨")
      if (secret === null) {
        return
      }
      secret = secret.trim()
      if (secret === '') {
        alert("不能为空")
        continue
      }
  
      const name = await login(secret)
  
      if (name) {
        setUser(name)
      }
      return
    }
  }

  const init = async () => {
      try {
        setUser(await getUser())
      } catch (e) {
        doLogin()
      }
  }

  useEffect(() => {
    init();
  }, [])

  const outputRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrolling = useRef(false)
  const needRef = useRef(true)

  const needScroll = () => {
    const output = outputRef.current!
    return scrolling.current || output.scrollTop + output.offsetHeight >= output.scrollHeight - 36
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

  useEffect(() => {
    if (!user) {
      return
    }

    const evtSrc = new EventSource('/go/sse')

    evtSrc.addEventListener('users', evt => {
      setOnlineUsers(window.JSON.parse((evt as MessageEvent).data))
    })
    
    evtSrc.addEventListener('msg', evt => {
      needRef.current = needScroll()

      const m: Msg = JSON.parse((evt as MessageEvent).data)
      setMsgs(value => value.concat(m))

      if (m.To === user) {
        new Notification(m.From, { body: m.Txt })
      }
      
    })

    evtSrc.addEventListener('log', evt => {
      const m: Msg[] = JSON.parse((evt as MessageEvent).data)
      setMsgs(m)

      scrollToBottom(true)
    })

    evtSrc.addEventListener('close', () => {
      evtSrc.close()
      setErr('已在其它窗口登录')
    })

    evtSrc.onerror = () => {
      evtSrc.close()
      setErr('已掉线')
    }

    return () => {
      evtSrc.close()
    }
  }, [user])



  const [err, setErr] = useState('')
  useEffect(() => {
    if (err) {
      setUser(undefined)
      setOnlineUsers([])
    }
  }, [err])
  const onReconnect = useCallback(() => {
    setErr('')
    init()
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
      await sendMsg(target, msg, priv && !!target)
      inputRef.current!.value = ''
    } catch (e) {
      alert((e as { msg: string }).msg)
    } finally {
      sendingRef.current = false
      inputRef.current!.readOnly = false
    }

  }, [user, target, priv])

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
    if (e.key === 'Enter' && !!user) {
      handleSend()
    }
  }, [user, target, priv])

  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    if (!user) {
      setAdmin(false)
      return
    }

    (async function () {
      const res = await isAdmin()
      if (res) {
        setAdmin(res === 'true')
      }
    })()
  }, [user])

  const onClearLog = async () => {
    if (await clearLog()) {
      alert('OK')
    }
  }

  useEffect(() => {
    if (users.findIndex(item => item.ID === target) < 0) {
      setTarget('')
    }
  }, [users, target])

  return (
    <div className="wrapper">
      <header>
        { user && <><em>{user}</em>，你好！</> }
        <button onClick={() => doLogin()}>{user ? '切换' : '登录'}</button>
        { admin && (
          <button onClick={onClearLog} style={{ marginLeft: 6 }}>清除聊天记录</button>
        ) }
      </header>
      <main>
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
                <span className={item.From === user ? 'active' : undefined}>{ item.From }</span>
                { item.Pri && <span>悄悄地</span> }
                { item.To !== "" && <><span>对</span><span className={item.To === user ? 'active' : undefined}>{ item.To }</span></> }
                <span>说：</span>
              </span>
              <span>{ item.Txt }</span>
            </li>
          )) }
          <div ref={bottomRef} className="bottom"></div>
        </section>
        <aside>
          <header>在线用户（{ users.length }）</header>
          <ul>
            { users.map(u => (
              <li
                key={u.ID}
                className={u.Admin
                  ? 'admin'
                  : (u.ID === user ? 'active' : undefined)
                }
              >
                {`${u.ID}（${u.IP}）`}
              </li>
            )) }
          </ul>
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
              <button onClick={handleSend} disabled={!user}>发送</button>
            </div>
            </div>
        </div>
        <div className={inputClassName}>
          <textarea
            onFocus={() => setInputFocus(true)}
            onBlur={() => setInputFocus(false)}
            ref={inputRef}
            onKeyDown={onKeyDown}
          />
        </div>
      </footer>
      <Info value={err} onOK={onReconnect} onCancel={() => setErr('')} />
    </div>
  );
}

export default App;
