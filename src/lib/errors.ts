export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toErrorResponse(err: unknown) {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, details: err.details ?? null } },
    };
  }
  console.error('[unhandled]', err);
  return {
    status: 500,
    body: { error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.', details: null } },
  };
}
