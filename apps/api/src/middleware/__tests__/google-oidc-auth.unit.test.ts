import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { NextFunction, Request, Response } from "express";

const mockVerifyIdToken = jest.fn() as jest.Mock<
  (args: { idToken: string; audience: string }) => Promise<{
    getPayload: () => Record<string, unknown> | undefined;
  }>
>;

jest.unstable_mockModule("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe("googleOidcAuth", () => {
  let googleOidcAuth: typeof import("../google-oidc-auth.js").googleOidcAuth;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    ({ googleOidcAuth } = await import("../google-oidc-auth.js"));
  });

  afterAll(() => {
    Object.assign(process.env, originalEnv);
  });

  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    process.env.NODE_ENV = "production";
    process.env.CLOUD_SCHEDULER_OIDC_AUDIENCE = "https://api.example.com";
    delete process.env.CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT;
  });

  afterEach(() => {
    Object.keys(process.env).forEach((k) => {
      if (!(k in originalEnv)) {
        delete process.env[k];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  function mkRes(): {
    res: Response;
    statusSpy: jest.Mock;
    jsonSpy: jest.Mock;
  } {
    const jsonSpy = jest.fn();
    const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    const res = {
      status: statusSpy,
      json: jsonSpy,
    } as unknown as Response;
    return {
      res,
      statusSpy: statusSpy as jest.Mock,
      jsonSpy: jsonSpy as jest.Mock,
    };
  }

  function mkReq(headers: Record<string, string> = {}): Request {
    return {
      header(name: string) {
        return headers[name.toLowerCase()];
      },
    } as unknown as Request;
  }

  it("401s when Authorization header is missing", async () => {
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq(), res, next);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401s when Authorization header doesn't start with 'Bearer '", async () => {
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq({ authorization: "Basic abc" }), res, next);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401s when verifyIdToken throws (bad signature / wrong audience)", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("bad signature"));
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq({ authorization: "Bearer xxx" }), res, next);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401s when payload issuer is not Google", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: "https://example.com",
        email: "scheduler@my-proj.iam.gserviceaccount.com",
        email_verified: true,
      }),
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq({ authorization: "Bearer xxx" }), res, next);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401s when CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT is set and the payload email doesn't match", async () => {
    process.env.CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT =
      "scheduler@my-proj.iam.gserviceaccount.com";
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: "https://accounts.google.com",
        email: "someone-else@iam.gserviceaccount.com",
        email_verified: true,
      }),
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq({ authorization: "Bearer xxx" }), res, next);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401s when CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT is set and email_verified is false", async () => {
    process.env.CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT =
      "scheduler@my-proj.iam.gserviceaccount.com";
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: "https://accounts.google.com",
        email: "scheduler@my-proj.iam.gserviceaccount.com",
        email_verified: false,
      }),
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq({ authorization: "Bearer xxx" }), res, next);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when the token is valid and all checks pass", async () => {
    process.env.CLOUD_SCHEDULER_OIDC_SERVICE_ACCOUNT =
      "scheduler@my-proj.iam.gserviceaccount.com";
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: "https://accounts.google.com",
        email: "scheduler@my-proj.iam.gserviceaccount.com",
        email_verified: true,
      }),
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq({ authorization: "Bearer xxx" }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusSpy).not.toHaveBeenCalled();
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "xxx",
      audience: "https://api.example.com",
    });
  });

  it("503s in production when CLOUD_SCHEDULER_OIDC_AUDIENCE is unset (fail closed)", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CLOUD_SCHEDULER_OIDC_AUDIENCE;
    const next = jest.fn() as NextFunction;
    const { res, statusSpy, jsonSpy } = mkRes();
    await googleOidcAuth(mkReq(), res, next);
    expect(statusSpy).toHaveBeenCalledWith(503);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      reason: "invalid_configuration",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a case-insensitive bearer scheme (RFC 7235)", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        iss: "https://accounts.google.com",
        email_verified: true,
      }),
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq({ authorization: "bearer xxx" }), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusSpy).not.toHaveBeenCalled();
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "xxx",
      audience: "https://api.example.com",
    });
  });

  it("503s even outside production when CLOUD_SCHEDULER_OIDC_AUDIENCE is unset (env-independent fail closed)", async () => {
    process.env.NODE_ENV = "staging";
    delete process.env.CLOUD_SCHEDULER_OIDC_AUDIENCE;
    const next = jest.fn() as NextFunction;
    const { res, statusSpy, jsonSpy } = mkRes();
    await googleOidcAuth(mkReq(), res, next);
    expect(statusSpy).toHaveBeenCalledWith(503);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      reason: "invalid_configuration",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("enforces verification when audience is set even if NODE_ENV is not production", async () => {
    process.env.NODE_ENV = "staging";
    process.env.CLOUD_SCHEDULER_OIDC_AUDIENCE = "https://api.example.com";
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await googleOidcAuth(mkReq(), res, next);
    // No Bearer header → rejected, proving the gate is live without NODE_ENV.
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
