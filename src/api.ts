export const getUser = () => request(
  '/go/user?t=' + Date.now().toString(36),
)

export const sendMsg = (to: string, txt: string, priv: Boolean) => reqAlert(
  '/go/send',
  'POST',
  { to, txt, priv: priv ? "1" : "" }
)

export const login = (secret: string) => reqAlert(
  '/go/login',
  'POST',
  `secret=${encodeURIComponent(secret)}`,
)

export const isAdmin = () => reqAlert(
  '/go/admin',
)

export const clearLog = () => reqAlert(
  '/go/clear',
  'POST',
)

const request = async (path: string, method: 'GET' | 'POST' = 'GET', body?: string | { [x: string]: string }): Promise<string | undefined> => {
  const res = await fetch(
    path,
    {
      method,
      headers: method === 'POST' ? {
        "Content-Type": "application/x-www-form-urlencoded",
      } : undefined,
      body: body && method === 'POST'
      ? (typeof body === 'string' ? body : encode(body))
      : undefined,
    },
  )

  const txt = await res.text()
  if (res.status === 200) {
    return txt
  }
  throw { code: res.status, msg: txt }
  
}

const reqAlert = async (path: string, method: 'GET' | 'POST' = 'GET', body?: string | { [x: string]: string }): Promise<string | undefined> => {
  try {
    return await request(path, method, body)
  } catch (e: unknown) {
    Promise.resolve().then(() => {
      alert((e as { code: number }).code + ': ' + (e as { msg: string }).msg)
    })
    return undefined
  }
}

const encode = (obj: { [x: string]: string | undefined }): string => (
  Object.keys(obj).map(key => {
    const value = obj[key]
    return value === undefined ? undefined : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  }).filter(item => item !== undefined).join('&')
)
