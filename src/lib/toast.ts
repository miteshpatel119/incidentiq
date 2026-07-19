export interface ToastData {
  readonly id: string
  readonly message: string
  readonly type: 'incident' | 'info' | 'warning' | 'error'
}

let addToastFn: ((toast: ToastData) => void) | null = null

export function showToast(message: string, type: ToastData['type'] = 'info'): void {
  addToastFn?.({ id: `${Date.now()}-${Math.random()}`, message, type })
}

export function setAddToastHandler(handler: ((toast: ToastData) => void) | null): void {
  addToastFn = handler
}
