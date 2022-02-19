import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs'
import './App.scss';

import { getUser, login, sendMsg } from './api'
import Info from './components/Info'

interface Msg {
  ID: string
  From: String
  To: String
  Txt: String
  Time: number
  Pri: boolean
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
  const [users, setOnlineUsers] = useState<string[]>([])
  const selectList = useMemo(() => (
    users.filter(item => item !== user)
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

  const needScroll = () => {
    const output = outputRef.current!
    return output.scrollTop + output.offsetHeight >= output.scrollHeight
  }

  let started = false
  const scrollToBottom = (auto = false) => {
    if (started) {
      return
    } 
    started = true
    window.setTimeout(() => {
      bottomRef.current!.scrollIntoView({ behavior: auto ? 'auto' : 'smooth' })
      started = false
    }, 200)
  }

  useEffect(() => {
    if (!user) {
      return
    }

    const evtSrc = new EventSource('/go/sse')

    evtSrc.addEventListener('users', evt => {
      setOnlineUsers(window.JSON.parse((evt as MessageEvent).data))
    })
    
    evtSrc.addEventListener('msg', evt => {
      const scroll = needScroll()

      const m: Msg = JSON.parse((evt as MessageEvent).data)
      setMsgs(value => value.concat(m))

      if (scroll) {
        scrollToBottom()
      } else {
        setNews(true)
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
      await sendMsg(user, target, msg, priv)
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


  return (
    <div className="wrapper">
      <header>
        { user && <span>Hi~{user}</span> }
        <button onClick={() => doLogin()}>{user ? '切换' : '登录'}</button>
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
          <b ref={bottomRef} />
        </section>
        <aside>
          <header>在线用户（{ users.length }）</header>
          <ul>
            { users.map(name => (
              <li key={name} className={name === user ? 'active' : undefined}>{name}</li>
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
          />
        </div>
      </footer>
      <Info value={err} onOK={onReconnect} onCancel={() => setErr('')} />
    </div>
  );
}

export default App;
