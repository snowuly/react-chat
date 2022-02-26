import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const Modal: FC = ({ children }) => {
  const wrapper = useMemo(() => document.createElement('div'), [])
  useEffect(() => {
    document.body.appendChild(wrapper)

    return () => {
      document.body.removeChild(wrapper)
    }
  }, [])

  return createPortal(children, wrapper)
}

export default Modal
