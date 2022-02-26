import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRoom, joinRoom } from '../../api'
import './index.scss'

type Room = {
  ID: number
  Name: string
  Num: number
  Priv: boolean
  Credit: boolean
}

const List = () => {
  const nav = useNavigate()
  const [data, setData] = useState<Room[]>([])

  useEffect(() => {
    (async () => {
      const res = await getRoom()
      if (res) {
        setData(JSON.parse(res))
      }
    })()
  }, [])

  const onJoinRoom = async (id: number) => {
    while (true) {
      const pwd = window.prompt("请输入房间密码：")
      if (pwd === null) {
        return
      }
      if (await joinRoom(`${id}`, pwd)) {
        nav(`/room/${id}`)
        return
      }
      
    }
  }

  return (
    <div className="list">
      <ul>
        { data.map(item => (
          <li key={item.ID}>
            { item.Priv && !item.Credit ? (
              <Link
                to={`/room/${item.ID}`}
                onClick={(e) => {
                  e.preventDefault()
                  onJoinRoom(item.ID)
                }}
              >{item.Name} 🔒</Link>
            ) : (
              <Link to={`/room/${item.ID}`}>{ item.Name }</Link>
            ) }
          </li>
        )) }
      </ul>
    </div>
  )
}

export default List