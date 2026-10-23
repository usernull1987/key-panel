'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { ConfirmModal, ModalType } from '@/components/confirm-modal'

interface ConfirmOptions {
  title: string
  description?: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null)
  const [loading, setLoading] = useState(false)

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ ...options, open: true })
  }, [])

  const handleClose = () => {
    if (loading) return
    setState(null)
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!state) return
    setLoading(true)
    try {
      await state.onConfirm()
      setState(null)
    } catch (err) {
      console.error('Confirm action error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        open={!!state?.open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={state?.title || ''}
        description={state?.description}
        type={state?.type}
        confirmText={state?.confirmText}
        cancelText={state?.cancelText}
        loading={loading}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}