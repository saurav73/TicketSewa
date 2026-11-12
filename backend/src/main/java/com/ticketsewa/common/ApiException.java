package com.ticketsewa.common;

/** Thrown for expected 4xx failures; mapped to a JSON error body. */
public class ApiException extends RuntimeException {
  private final int status;

  public ApiException(int status, String message) {
    super(message);
    this.status = status;
  }

  /** HTTP status code this error maps to in the response. */
  public int getStatus() {
    return status;
  }

  /** 400: the request was malformed or failed validation. */
  public static ApiException badRequest(String msg) { return new ApiException(400, msg); }
  /** 401: no valid login (missing or expired token). */
  public static ApiException unauthorized(String msg) { return new ApiException(401, msg); }
  /** 403: logged in, but not allowed to do this. */
  public static ApiException forbidden(String msg) { return new ApiException(403, msg); }
  /** 404: the requested resource does not exist. */
  public static ApiException notFound(String msg) { return new ApiException(404, msg); }
  /** 409: the request conflicts with current state (e.g. a duplicate). */
  public static ApiException conflict(String msg) { return new ApiException(409, msg); }
}
