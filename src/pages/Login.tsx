import { useNavigate } from "react-router-dom";
import { useSignals } from "@preact/signals-react/runtime";
import { Loader2, Phone, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import Logo from "@/components/common/Logo";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import { authService } from "@/services/auth";
import { setAuth, setUser } from "@/signals/auth";
import {
  loginStep,
  phoneNumber,
  otp,
  loginLoading,
  loginError,
  setLoginError,
  goToOtpStep,
  goToPhoneStep,
} from "@/signals/login";

const Login = () => {
  useSignals();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (phoneNumber.value.length !== 10) {
      setLoginError("Please enter a valid 10-digit phone number");
      return;
    }

    loginLoading.value = true;
    try {
      const response = await authService.sendOtp({
        phoneNumber: phoneNumber.value,
      });
      if (response.status === 200) {
        goToOtpStep();
      } else {
        setLoginError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      loginLoading.value = false;
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (otp.value.length !== 6) {
      setLoginError("Please enter a valid 6-digit OTP");
      return;
    }

    loginLoading.value = true;
    try {
      const response = await authService.verifyOtp({
        phoneNumber: phoneNumber.value,
        otp: otp.value,
      });
      if (response.success && response.data) {
        const token = response.data.accessToken;
        setAuth(token);

        // Try to fetch user details, but don't block login if it fails
        try {
          const user = await authService.getMe(token);
          setUser(user);
        } catch (e) {
          console.warn("Failed to fetch user details:", e);
          // Continue to dashboard anyway - user info will show as fallback
        }

        navigate("/dashboard");
      } else {
        setLoginError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Failed to verify OTP"
      );
    } finally {
      loginLoading.value = false;
    }
  };

  const handleBack = () => {
    goToPhoneStep();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute opacity-50">
        <AuthBackgroundShape />
      </div>

      <Card className="z-10 w-full border-none shadow-lg sm:max-w-md">
        <CardHeader className="space-y-4">
          <Logo />
          <div>
            <CardTitle className="text-2xl">
              {loginStep.value === "phone"
                ? "Sign in to your account"
                : "Verify OTP"}
            </CardTitle>
            <CardDescription className="text-base">
              {loginStep.value === "phone"
                ? "Enter your phone number to receive an OTP"
                : `We've sent a 6-digit code to +91 ${phoneNumber.value}`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {loginStep.value === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                    +91
                  </span>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber.value}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      phoneNumber.value = value;
                    }}
                    className="pl-12"
                    maxLength={10}
                  />
                  <Phone className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
                </div>
              </div>

              {loginError.value && (
                <p className="text-destructive text-sm">{loginError.value}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginLoading.value}
              >
                {loginLoading.value ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp.value}
                    onChange={(value) => {
                      otp.value = value;
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {loginError.value && (
                <p className="text-destructive text-sm text-center">
                  {loginError.value}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginLoading.value}
              >
                {loginLoading.value ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to phone number
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-primary hover:underline"
                  disabled={loginLoading.value}
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
