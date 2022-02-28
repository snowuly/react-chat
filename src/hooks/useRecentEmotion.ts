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
      const result = [...cur]

      const index = result.indexOf(tag)
      if (index >= 0) {
        result.splice(index, 1)
      } else if (result.length >= MAX) {
        result.pop()
      }

      result.unshift(tag)

      return result
    })
  }, [])

  return [arr, setLastItem]
}

export default useRecentEmotion