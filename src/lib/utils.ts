import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Logging utilities with correlation IDs
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getCorrelationId(request: Request): string {
  const correlationId = request.headers.get('x-correlation-id') || 
                       request.headers.get('X-Request-ID') || 
                       generateCorrelationId()
  return correlationId
}

export function logWithCorrelation(
  correlationId: string, 
  level: 'info' | 'warn' | 'error' | 'debug', 
  message: string, 
  data?: any
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    correlationId,
    level,
    message,
    ...(data && { data })
  }
  
  console.log(`[${timestamp}] [${correlationId}] [${level.toUpperCase()}] ${message}`, data ? data : '')
}

// Request logging utility
export function logRequest(
  correlationId: string,
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: any
) {
  logWithCorrelation(correlationId, 'info', `Request: ${method} ${url}`, {
    headers: headers ? Object.fromEntries(
      Object.entries(headers).filter(([key]) => 
        !key.toLowerCase().includes('authorization') && 
        !key.toLowerCase().includes('cookie')
      )
    ) : undefined,
    body: body ? (typeof body === 'string' ? body.substring(0, 200) + '...' : body) : undefined
  })
}

// Response logging utility
export function logResponse(
  correlationId: string,
  status: number,
  message?: string,
  data?: any
) {
  logWithCorrelation(correlationId, 'info', `Response: ${status}`, {
    message,
    data: data ? (typeof data === 'string' ? data.substring(0, 200) + '...' : data) : undefined
  })
}

// Error logging utility
export function logError(
  correlationId: string,
  error: Error | string,
  context?: any
) {
  logWithCorrelation(correlationId, 'error', `Error: ${typeof error === 'string' ? error : error.message}`, {
    stack: error instanceof Error ? error.stack : undefined,
    context
  })
}

// Debug logging utility
export function logDebug(
  correlationId: string,
  message: string,
  data?: any
) {
  logWithCorrelation(correlationId, 'debug', message, data)
}
