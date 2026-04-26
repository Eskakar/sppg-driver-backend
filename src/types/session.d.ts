import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      nama: string;
      role: string;
    };
  }
}