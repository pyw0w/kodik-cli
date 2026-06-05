class KodikError extends Error {
  cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
  }
}

export class TokenError extends KodikError {}
export class ServiceError extends KodikError {}
export class PostArgumentsError extends KodikError {}
export class NoResults extends KodikError {}
export class DecryptionFailure extends KodikError {}
export class UnexpectedBehavior extends KodikError {}
