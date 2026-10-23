'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle, CheckCircle2, XCircle, Info, X, Loader2,
} from 'lucide-react'

export type ModalType = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

const CONFIG: Record<
  ModalType,
  { icon: React.ElementType; iconColor: string; bgGradient: string; buttonClass: string }
> = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-600 dark:text-red-400',
    bgGradient: 'from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20',
    buttonClass: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    buttonClass: 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
    bgGradient: 'from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20',
    buttonClass: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
    buttonClass: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  },
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  type = 'info',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, loading, onClose])

  if (!open) return null

  const config = CONFIG[type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div
        className="
          relative w-full max-w-sm
          glass-strong rounded-3xl
          shadow-2xl
          animate-[scaleIn_0.25s_cubic-bezier(0.34,1.56,0.64,1)]
          overflow-hidden
        "
      >
        {/* Gradient top accent */}
        <div className={'absolute inset-x-0 top-0 h-1 bg-gradient-to-r ' + config.buttonClass} />

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-40 z-10"
          aria-label="ปิด"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pt-7">
          {/* Icon */}
          <div
            className={
              'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ' +
              config.bgGradient +
              ' mb-4'
            }
          >
            <Icon className={'h-7 w-7 ' + config.iconColor} />
          </div>

          {/* Title + description */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06]"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={
                'flex-1 h-11 rounded-xl text-white shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 ' +
                config.buttonClass
              }
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  กำลังทำ...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}