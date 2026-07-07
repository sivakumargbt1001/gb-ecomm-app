import {
  ForgotPasswordSchema,
  LoginEmailSchema,
  RequestOtpSchema,
  SignupEmailSchema,
  VerifyOtpSchema,
} from "@geekbase-labs/shared-types";

describe("SignupEmailSchema", () => {
  it("accepts a valid email and an 8+ character password", () => {
    expect(
      SignupEmailSchema.safeParse({ email: "shopper@example.com", password: "longenough1" })
        .success,
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(
      SignupEmailSchema.safeParse({ email: "not-an-email", password: "longenough1" }).success,
    ).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      SignupEmailSchema.safeParse({ email: "shopper@example.com", password: "short1" }).success,
    ).toBe(false);
  });
});

describe("LoginEmailSchema", () => {
  it("accepts a valid email/password pair", () => {
    expect(
      LoginEmailSchema.safeParse({ email: "shopper@example.com", password: "longenough1" })
        .success,
    ).toBe(true);
  });

  it("rejects a missing password", () => {
    expect(LoginEmailSchema.safeParse({ email: "shopper@example.com" }).success).toBe(false);
  });
});

describe("ForgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "shopper@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("RequestOtpSchema", () => {
  it("accepts a phone number with an sms or whatsapp channel", () => {
    expect(
      RequestOtpSchema.safeParse({ phone: "+15551234567", channel: "sms" }).success,
    ).toBe(true);
    expect(
      RequestOtpSchema.safeParse({ phone: "+15551234567", channel: "whatsapp" }).success,
    ).toBe(true);
  });

  it("rejects an empty phone number", () => {
    expect(RequestOtpSchema.safeParse({ phone: "", channel: "sms" }).success).toBe(false);
  });

  it("rejects an unsupported channel", () => {
    expect(
      RequestOtpSchema.safeParse({ phone: "+15551234567", channel: "carrier-pigeon" }).success,
    ).toBe(false);
  });
});

describe("VerifyOtpSchema", () => {
  it("accepts a phone number and code", () => {
    expect(
      VerifyOtpSchema.safeParse({ phone: "+15551234567", code: "123456" }).success,
    ).toBe(true);
  });

  it("rejects an empty code", () => {
    expect(VerifyOtpSchema.safeParse({ phone: "+15551234567", code: "" }).success).toBe(false);
  });
});
