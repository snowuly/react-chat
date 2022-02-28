import { ReactNode, useEffect, FC, cloneElement, ReactElement, useState, useRef } from "react";
import Modal from '../Modal'
import './index.scss'

interface Props {
  content: ReactNode
  className?: string
}

const Popover: FC<Props> = ({ content, children, className }) => {
  const [visible, setVisible] = useState(false)
  const trigger = useRef<HTMLElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0, w: 0 })

  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (visible) {
      setVisible(false)
      return
    }

    const rect = trigger.current!.getBoundingClientRect()
    pos.current = { x: rect.x, y: rect.y, w: rect.width }

    setTimeout(() => {
      setVisible(v => true)
    }, 0)
  }

  useEffect(() => {
    const el = wrapper.current!
    if (!visible) {
      el.style.left = '-1000px'
      el.style.top = '-2000px'
    }

    if (visible) {
      const rect = wrapper.current!.getBoundingClientRect()
      el.style.left = pos.current.x - Math.floor((el.offsetWidth - pos.current.w) / 2) + 'px'
      el.style.top = pos.current.y - rect.height - 5 + window.scrollY + 'px'

    }
    const fn = () => {
      setVisible(false)
    }
    document.addEventListener('click', fn, false)

    return () => document.removeEventListener('click', fn, false)

  }, [visible])

  return (<>
    { cloneElement(children as ReactElement, { onClick: onClick, ref: trigger}) }
    { <Modal>
      <div
        ref={wrapper}
        className={`popover-wrapper${className ? ` ${className}` : ''}`}
      >
        {content}
      </div>
    </Modal> }
  </>)

}

export default Popover