import {
  DEFAULT_OTP_EXPIRY_SECONDS,
  DEFAULT_OTP_RESEND_COOLDOWN_SECONDS,
  canResend,
  createOtpTimerState,
  formatOtpTime,
  isOtpExpired,
  tickOtpTimerState,
} from "../otp-timer";

describe("otp-timer", () => {
  describe("createOtpTimerState", () => {
    it("defaults to a 300s expiry and 60s resend cooldown", () => {
      const state = createOtpTimerState();

      expect(state).toEqual({
        expirySeconds: DEFAULT_OTP_EXPIRY_SECONDS,
        cooldownSeconds: DEFAULT_OTP_RESEND_COOLDOWN_SECONDS,
      });
    });

    it("allows overriding the expiry and cooldown durations", () => {
      const state = createOtpTimerState({ expirySeconds: 120, cooldownSeconds: 30 });

      expect(state).toEqual({ expirySeconds: 120, cooldownSeconds: 30 });
    });
  });

  describe("tickOtpTimerState", () => {
    it("decrements both counters by one second", () => {
      const state = tickOtpTimerState({ expirySeconds: 300, cooldownSeconds: 60 });

      expect(state).toEqual({ expirySeconds: 299, cooldownSeconds: 59 });
    });

    it("never goes below zero", () => {
      const state = tickOtpTimerState({ expirySeconds: 0, cooldownSeconds: 0 });

      expect(state).toEqual({ expirySeconds: 0, cooldownSeconds: 0 });
    });

    it("clamps each counter independently", () => {
      const state = tickOtpTimerState({ expirySeconds: 1, cooldownSeconds: 0 });

      expect(state).toEqual({ expirySeconds: 0, cooldownSeconds: 0 });
    });
  });

  describe("isOtpExpired", () => {
    it("is false while expirySeconds is above zero", () => {
      expect(isOtpExpired({ expirySeconds: 1, cooldownSeconds: 0 })).toBe(false);
    });

    it("is true once expirySeconds reaches zero", () => {
      expect(isOtpExpired({ expirySeconds: 0, cooldownSeconds: 0 })).toBe(true);
    });
  });

  describe("canResend", () => {
    it("is false while cooldownSeconds is above zero", () => {
      expect(canResend({ expirySeconds: 300, cooldownSeconds: 1 })).toBe(false);
    });

    it("is true once cooldownSeconds reaches zero", () => {
      expect(canResend({ expirySeconds: 300, cooldownSeconds: 0 })).toBe(true);
    });
  });

  describe("formatOtpTime", () => {
    it("formats seconds as m:ss", () => {
      expect(formatOtpTime(300)).toBe("5:00");
      expect(formatOtpTime(65)).toBe("1:05");
      expect(formatOtpTime(9)).toBe("0:09");
      expect(formatOtpTime(0)).toBe("0:00");
    });
  });
});
