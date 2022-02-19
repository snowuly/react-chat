import { FC, useEffect } from 'react'

import Modal from '../Modal'

import './index.scss'

interface Prop {
  value?: string
  onOK: () => void
  onCancel: () => void
}

const Info: FC<Prop> = ({ value, onOK, onCancel }) => {
  useEffect(() => {

  }, [value])

  return (
    value ? (
      <Modal>
        <div className="info-cnt">
          <main>
            <header>{value}</header>
            <footer>
              <span onClick={onOK}>重连</span>
              <span onClick={onCancel}>关闭</span>
            </footer>
          </main>
        </div>
        </Modal>
    ) : null
  )
}

export default Info
