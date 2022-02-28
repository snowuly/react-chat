import { FC, useContext } from "react"

import './index.scss'
import { UserCtx } from "../../layout"

interface Props {
  onLogin: () => void
}

const Bar: FC<Props> = ({ onLogin }) => {
  const user = useContext(UserCtx)

  return (
    <div className="letschat-cnt bar">
      <img alt="DogHead" className="emotion" src="https://chentao.me/static/emotion/097.png" />
      { user && <><em>{user.name}</em>，你好！</> }
      <button onClick={onLogin}>{user ? '切换' : '登录'}</button>
    </div>
  )
}

export default Bar
