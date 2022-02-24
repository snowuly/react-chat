import { useCallback, useEffect, useState } from 'react'


const KEY = '__recent_emotions'
const MAX = 24

const useRecentEmotion = (): [string[], (x: string) => void] => {
  const [arr, setArr] = useState<string[]>(() => {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      try {
        const data = JSON.parse(raw)
        if (Array.isArray(data)) {
          return data
        }
      } catch (e) {}
    }

    return []
  })

  useEffect(() => {
    window.localStorage.setItem(KEY, JSON.stringify(arr))
  }, [arr])

  const setLastItem = useCallback((tag: string) => {
    setArr((cur) => {
      const result = [ tag, ...cur ]
      return result.length > MAX ? result.slice(0, -1) : result
    })
  }, [])

  return [arr, setLastItem]
}

export default useRecentEmotion