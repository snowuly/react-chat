import { Outlet } from 'react-router-dom'
import Bar from './components/Bar'
import { createContext, useEffect, useState } from 'react'
import { getUser, login } from './api'
import Loading from './components/Loading'

type User = {
  name: string
  admin: boolean
}

export const UserCtx = createContext<User|undefined>(undefined)


const str2user = (str: string): User => {
  const i = str.lastIndexOf('|')
  if (i <= 0) {
    throw new Error('user response format error: ' + str)
  }

  return {
    name: str.substring(0, i),
    admin: str.substring(i+1) === 'true',
  }
}

const Layout = () => {
  const [user, setUser] = useState<User|undefined>(undefined)

  const doLogin = async () => {
    while (true) {
      let secret = window.prompt("请输入悄悄话登录，有疑问找大厨")
      if (secret === null) {
        return
      }
      secret = secret.trim()
      if (secret === '') {
        alert('不能为空')
        continue
      }
  
      const res = await login(secret) // string: name|isAdmin
      if (res) {
        setUser(str2user(res))
        return
      }
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setUser(str2user(await getUser()))
      } catch (e) {
        doLogin()
      }
    })()
  }, [])

  return (
    <UserCtx.Provider value={user}>
      <Bar onLogin={doLogin} />
      { user ? <Outlet /> : <Loading /> }
    </UserCtx.Provider>
  )
}

export default Layout
