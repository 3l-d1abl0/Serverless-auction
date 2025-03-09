// Custom error utility to replace http-errors package
// This is ESM-compatible and avoids dynamic requires

class HttpError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequest extends HttpError {
  constructor(message = 'Bad Request') {
    super(400, message);
  }
}

export class Unauthorized extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class Forbidden extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFound extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}

export class Conflict extends HttpError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error') {
    super(500, message);
  }
}

// Factory class to mimic http-errors package API
class CreateError {
  static BadRequest(message?: string): BadRequest {
    return new BadRequest(message);
  }
  
  static Unauthorized(message?: string): Unauthorized {
    return new Unauthorized(message);
  }
  
  static Forbidden(message?: string): Forbidden {
    return new Forbidden(message);
  }
  
  static NotFound(message?: string): NotFound {
    return new NotFound(message);
  }
  
  static Conflict(message?: string): Conflict {
    return new Conflict(message);
  }
  
  static InternalServerError(message?: string): InternalServerError {
    return new InternalServerError(message);
  }
}

export default CreateError; 