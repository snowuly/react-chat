import { FC, useEffect } from 'react'
import { createPortal } from 'react-dom'

const wrapper = document.createElement('div')
const Modal: FC = ({ children }) => {
  useEffect(() => {
    document.body.appendChild(wrapper)

    return () => {
      document.body.removeChild(wrapper)
    }
  }, [])

  return createPortal(children, wrapper)
}

export default Modal
