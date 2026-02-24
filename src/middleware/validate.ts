import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validate(
  schema: z.ZodType,
  source: "body" | "params" | "query" = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues || [];
      res.status(400).json({
        error: "Validation failed",
        details: issues.map((issue: any) => ({
          path: issue.path?.join(".") ?? "",
          message: issue.message ?? "Invalid value",
        })),
      });
      return;
    }
    (req as any)[source] = result.data;
    next();
  };
}
