import { describe, expect, it } from "vitest";
import { canReceiveSignupGifts, SIGNUP_GIFTS } from "./signup-gifts";

describe("brindes após cadastro confirmado", () => {
  it("oferece os dois e-books pedidos", () => {
    expect(SIGNUP_GIFTS.map(gift => gift.filename)).toEqual(["metodo-gcpm.pdf", "organizacao-financeira.pdf"]);
  });
  it("libera o brinde para um cadastro confirmado", () => {
    expect(canReceiveSignupGifts({ email_confirmed_at: "2026-10-09T00:00:00Z" })).toBe(true);
  });
  it("não libera o brinde antes da confirmação", () => {
    expect(canReceiveSignupGifts({ email_confirmed_at: null })).toBe(false);
    expect(canReceiveSignupGifts(null)).toBe(false);
  });
});