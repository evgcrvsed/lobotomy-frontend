import { useEffect, useRef } from 'react'

export default function Modal({ open, titleId, title, onClose, children }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!open) return

    document.body.style.overflow = 'hidden'

    function handleKeydown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="modal">
        <div className="modal__header">
          <span className="modal__title" id={titleId}>
            {title}
          </span>
          <button className="modal__close" onClick={onClose} aria-label="Закрыть">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L15 15M15 1L1 15" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
