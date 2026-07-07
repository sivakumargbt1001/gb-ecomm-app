export const DEFAULT_OTP_EXPIRY_SECONDS = 300;
export const DEFAULT_OTP_RESEND_COOLDOWN_SECONDS = 60;

export interface OtpTimerState {
  expirySeconds: number;
  cooldownSeconds: number;
}

export interface OtpTimerOptions {
  expirySeconds?: number;
  cooldownSeconds?: number;
}

export function createOtpTimerState(options: OtpTimerOptions = {}): OtpTimerState {
  return {
    expirySeconds: options.expirySeconds ?? DEFAULT_OTP_EXPIRY_SECONDS,
    cooldownSeconds: options.cooldownSeconds ?? DEFAULT_OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export function tickOtpTimerState(state: OtpTimerState): OtpTimerState {
  return {
    expirySeconds: Math.max(0, state.expirySeconds - 1),
    cooldownSeconds: Math.max(0, state.cooldownSeconds - 1),
  };
}

export function isOtpExpired(state: OtpTimerState): boolean {
  return state.expirySeconds === 0;
}

export function canResend(state: OtpTimerState): boolean {
  return state.cooldownSeconds === 0;
}

export function formatOtpTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
