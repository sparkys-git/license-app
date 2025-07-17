import { X } from 'lucide-react'
import { useEffect } from 'react'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type: 'ok' | 'yes-no' | 'yes-no-cancel'
  onYes: () => void
  onNo?: () => void
  onCancel?: () => void
  yesText?: string
  noText?: string
  cancelText?: string
  yesStyle?: string
  noStyle?: string
  cancelStyle?: string
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type,
  onYes,
  onNo,
  onCancel,
  yesText = 'Yes',
  noText = 'No',
  cancelText = 'Cancel',
  yesStyle = 'bg-red-600 hover:bg-red-700 text-white',
  noStyle = 'bg-gray-600 hover:bg-gray-700 text-white',
  cancelStyle = 'border border-gray-300 text-gray-700 hover:bg-gray-50'
}: AlertModalProps) {
  if (!isOpen) return null

  const handleYes = () => {
    onYes()
    onClose()
  }

  const handleNo = () => {
    if (onNo) onNo()
    onClose()
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    onClose()
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        
        // Priority: Cancel > No > Close modal
        if (type === 'yes-no-cancel') {
          handleCancel()
        } else if (type === 'yes-no') {
          handleNo()
        } else {
          // For 'ok' type, just close the modal
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, type, onCancel, onNo, onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 whitespace-pre-line">{message}</p>
        </div>

        <div className="flex gap-3 justify-end">
          {type === 'yes-no-cancel' && (
            <button
              onClick={handleCancel}
              className={`px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 ${cancelStyle}`}
            >
              {cancelText}
            </button>
          )}
          
          {type !== 'ok' && (
            <button
              onClick={handleNo}
              className={`px-4 py-2 rounded-md focus:ring-2 focus:ring-gray-500 ${noStyle}`}
            >
              {noText}
            </button>
          )}
          
          <button
            onClick={handleYes}
            className={`px-4 py-2 rounded-md focus:ring-2 focus:ring-red-500 ${yesStyle}`}
          >
            {yesText}
          </button>
        </div>
      </div>
    </div>
  )
} 