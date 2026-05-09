export type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
