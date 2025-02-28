import React, { useEffect } from 'react'

const Modal = ({ isOpen, onClose, children, title }) => {
  // Blocca lo scroll del body quando il modale è aperto
  useEffect(() => {
    if (isOpen) {
      // Salva la posizione di scorrimento corrente
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      // Ripristina lo scroll
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
      }
    }
    
    return () => {
      // Cleanup in caso di unmount
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // Gestione del tocco per i modali
  const handleModalTouchMove = (e) => {
    // Consente lo scroll all'interno del modale
    e.stopPropagation()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 touch-none"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={handleModalTouchMove}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Chiudi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal 