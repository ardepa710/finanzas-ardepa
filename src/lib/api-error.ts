export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export function withErrorHandling<T>(
  handler: (req: Request, context: any) => Promise<T>
) {
  return async (req: Request, context: any) => {
    try {
      const data = await handler(req, context)
      return Response.json(
        { ok: true, data },
        { status: 200 }
      )
    } catch (error) {
      console.error('API Error:', error)
      if (error instanceof APIError) {
        return Response.json(
          { ok: false, error: { code: error.code, message: error.message } },
          { status: error.statusCode }
        )
      }
      return Response.json(
        { ok: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Error interno' } },
        { status: 500 }
      )
    }
  }
}
