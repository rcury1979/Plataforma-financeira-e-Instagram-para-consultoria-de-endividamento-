import { describe, expect, it } from "vitest";
import { isAdministrator, ownsConversation } from "../../supabase/functions/admin-assistant/policy";
describe("Assistente exclusiva do administrador", () => {
  it("nega usuários sem papel administrativo verificado", () => {
    expect(isAdministrator("user-1", false)).toBe(false);
    expect(isAdministrator(undefined, true)).toBe(false);
    expect(isAdministrator("admin-1", true)).toBe(true);
  });
  it("mantém o histórico privado na conta do administrador", () => {
    expect(ownsConversation("admin-1", "admin-2")).toBe(false);
    expect(ownsConversation("admin-1", "admin-1")).toBe(true);
  });
});