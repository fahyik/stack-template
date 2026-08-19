import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { NextFunction, Request, Response } from "express";

import type { GoogleOidcOutcome } from "../google-oidc-auth.js";

const mockVerifyGoogleOidc = jest.fn() as jest.Mock<
  (req: Request) => Promise<GoogleOidcOutcome>
>;
const mockAuth = jest.fn() as jest.Mock<
  (req: Request, res: Response, next: (err?: unknown) => void) => void
>;

jest.unstable_mockModule("../google-oidc-auth.js", () => ({
  verifyGoogleOidc: mockVerifyGoogleOidc,
}));
jest.unstable_mockModule("../auth.js", () => ({
  auth: mockAuth,
}));

describe("systemAuth", () => {
  let systemAuth: typeof import("../system-auth.js").systemAuth;

  beforeAll(async () => {
    // check-admin.js is intentionally NOT mocked — we exercise the real admin
    // gate against req.auth set by the (mocked) JWT middleware.
    ({ systemAuth } = await import("../system-auth.js"));
  });

  beforeEach(() => {
    mockVerifyGoogleOidc.mockReset();
    mockAuth.mockReset();
  });

  function mkRes(): {
    res: Response;
    statusSpy: jest.Mock;
    jsonSpy: jest.Mock;
  } {
    const jsonSpy = jest.fn();
    const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    const res = { status: statusSpy, json: jsonSpy } as unknown as Response;
    return {
      res,
      statusSpy: statusSpy as jest.Mock,
      jsonSpy: jsonSpy as jest.Mock,
    };
  }

  function mkReq(): Request {
    return { header: () => undefined } as unknown as Request;
  }

  it("allows the request when Google OIDC authorizes (scheduler path)", async () => {
    mockVerifyGoogleOidc.mockResolvedValue({ outcome: "authorized" });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await systemAuth(mkReq(), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusSpy).not.toHaveBeenCalled();
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("503s on OIDC misconfiguration without falling back to admin auth", async () => {
    mockVerifyGoogleOidc.mockResolvedValue({ outcome: "misconfigured" });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy, jsonSpy } = mkRes();
    await systemAuth(mkReq(), res, next);
    expect(statusSpy).toHaveBeenCalledWith(503);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      reason: "invalid_configuration",
    });
    expect(next).not.toHaveBeenCalled();
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("falls back to admin JWT and allows a verified admin", async () => {
    mockVerifyGoogleOidc.mockResolvedValue({ outcome: "unauthorized" });
    mockAuth.mockImplementation((req, _res, jwtNext) => {
      (req as Request & { auth: unknown }).auth = {
        sub: "admin-user",
        app_metadata: { is_admin: true },
      };
      jwtNext();
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy } = mkRes();
    await systemAuth(mkReq(), res, next);
    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it("falls back to admin JWT and 403s a non-admin user", async () => {
    mockVerifyGoogleOidc.mockResolvedValue({ outcome: "unauthorized" });
    mockAuth.mockImplementation((req, _res, jwtNext) => {
      (req as Request & { auth: unknown }).auth = {
        sub: "regular-user",
        app_metadata: { is_admin: false },
      };
      jwtNext();
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy, jsonSpy } = mkRes();
    await systemAuth(mkReq(), res, next);
    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      reason: "not_authorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("falls back to admin JWT and 401s when the JWT is invalid", async () => {
    mockVerifyGoogleOidc.mockResolvedValue({ outcome: "unauthorized" });
    mockAuth.mockImplementation((_req, _res, jwtNext) => {
      jwtNext(new Error("jwt expired"));
    });
    const next = jest.fn() as NextFunction;
    const { res, statusSpy, jsonSpy } = mkRes();
    await systemAuth(mkReq(), res, next);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: false,
      reason: "unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
