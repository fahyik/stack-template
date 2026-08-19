import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  auth?: {
    aud: "authenticated";
    azp: string;
    exp: number;
    iat: number;
    iss: string;
    scope: string;
    sub: string;
    email: string;
    phone: string;
    app_metadata: {
      is_admin: boolean;
    };
  };
}
