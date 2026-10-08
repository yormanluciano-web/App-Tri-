import { describe, expect, it } from "vitest";
import { demoConfig } from "@/features/session/demo";
import { CONTACT_PERMISSIONS } from "@/domain/models/constants";

describe("demo", () => {
  it("es privada, de nivel Leve y sin permisos de contacto", () => {
    const c = demoConfig();
    expect(c.mode).toBe("private");
    expect(c.demo).toBe(true);
    expect(c.initialLevel).toBe("leve");
    for (const p of c.participants) {
      expect(p.adultDeclared).toBe(true);
      for (const perm of CONTACT_PERMISSIONS) expect(p.limits.permissions[perm]).toBe("red");
    }
  });
});
