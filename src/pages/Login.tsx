// import { useNavigate } from "react-router-dom";
// import { useSignals } from "@preact/signals-react/runtime";
// import { Loader2, Phone, ArrowLeft } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   InputOTP,
//   InputOTPGroup,
//   InputOTPSlot,
// } from "@/components/ui/input-otp";

// import Logo from "@/components/common/Logo";
// import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
// import { authService } from "@/services/auth";
// import { setAuth, setUser } from "@/signals/auth";
// import {
//   loginStep,
//   phoneNumber,
//   otp,
//   loginLoading,
//   loginError,
//   setLoginError,
//   goToOtpStep,
//   goToPhoneStep,
// } from "@/signals/login";

// const Login = () => {
//   useSignals();
//   const navigate = useNavigate();

//   const handleSendOtp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoginError(null);

//     if (phoneNumber.value.length !== 10) {
//       setLoginError("Please enter a valid 10-digit phone number");
//       return;
//     }

//     loginLoading.value = true;
//     try {
//       const response = await authService.sendOtp({
//         phoneNumber: phoneNumber.value,
//       });
//       if (response.status === 200) {
//         goToOtpStep();
//       } else {
//         setLoginError(response.message || "Failed to send OTP");
//       }
//     } catch (err) {
//       setLoginError(err instanceof Error ? err.message : "Failed to send OTP");
//     } finally {
//       loginLoading.value = false;
//     }
//   };

//   const handleVerifyOtp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoginError(null);

//     if (otp.value.length !== 6) {
//       setLoginError("Please enter a valid 6-digit OTP");
//       return;
//     }

//     loginLoading.value = true;
//     try {
//       const response = await authService.verifyOtp({
//         phoneNumber: phoneNumber.value,
//         otp: otp.value,
//       });
//       if (response.success && response.data) {
//         const token = response.data.accessToken;
//         setAuth(token);

//         // Try to fetch user details, but don't block login if it fails
//         try {
//           const user = await authService.getMe(token);
//           setUser(user);
//         } catch (e) {
//           console.warn("Failed to fetch user details:", e);
//           // Continue to dashboard anyway - user info will show as fallback
//         }

//         navigate("/select-dashboard");
//       } else {
//         setLoginError(response.message || "Invalid OTP");
//       }
//     } catch (err) {
//       setLoginError(
//         err instanceof Error ? err.message : "Failed to verify OTP"
//       );
//     } finally {
//       loginLoading.value = false;
//     }
//   };

//   const handleBack = () => {
//     goToPhoneStep();
//   };

//   return (
//     <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
//       <div className="absolute opacity-50">
//         <AuthBackgroundShape />
//       </div>

//       <Card className="z-10 w-full bg-accent px-6 py-8 border shadow-lg sm:max-w-md">
//         <CardHeader className="space-y-4">
//           <Logo />
//           <div>
//             <CardTitle className="text-2xl">
//               {loginStep.value === "phone"
//                 ? "Sign in to your account"
//                 : "Verify OTP"}
//             </CardTitle>
//             <CardDescription className="text-base">
//               {loginStep.value === "phone"
//                 ? "Enter your phone number to receive an OTP"
//                 : `We've sent a 6-digit code to +91 ${phoneNumber.value}`}
//             </CardDescription>
//           </div>
//         </CardHeader>

//         <CardContent>
//           {loginStep.value === "phone" ? (
//             <form onSubmit={handleSendOtp} className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="phoneNumber">Phone Number</Label>
//                 <div className="relative">
//                   <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">
//                     +91
//                   </span>
//                   <Input
//                     id="phoneNumber"
//                     type="tel"
//                     placeholder="Enter your phone number"
//                     value={phoneNumber.value}
//                     onChange={(e) => {
//                       const value = e.target.value
//                         .replace(/\D/g, "")
//                         .slice(0, 10);
//                       phoneNumber.value = value;
//                     }}
//                     className="pl-12"
//                     maxLength={10}
//                   />
//                   <Phone className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
//                 </div>
//               </div>

//               {loginError.value && (
//                 <p className="text-destructive text-sm">{loginError.value}</p>
//               )}

//               <Button
//                 type="submit"
//                 className="w-full"
//                 disabled={loginLoading.value}
//               >
//                 {loginLoading.value ? (
//                   <>
//                     <Loader2 className="mr-2 size-4 animate-spin" />
//                     Sending OTP...
//                   </>
//                 ) : (
//                   "Send OTP"
//                 )}
//               </Button>
//             </form>
//           ) : (
//             <form onSubmit={handleVerifyOtp} className="space-y-4">
//               <div className="space-y-2">
//                 <Label>Enter OTP</Label>
//                 <div className="flex justify-center">
//                   <InputOTP
//                     maxLength={6}
//                     value={otp.value}
//                     onChange={(value) => {
//                       otp.value = value;
//                     }}
//                   >
//                     <InputOTPGroup>
//                       <InputOTPSlot index={0} />
//                       <InputOTPSlot index={1} />
//                       <InputOTPSlot index={2} />
//                       <InputOTPSlot index={3} />
//                       <InputOTPSlot index={4} />
//                       <InputOTPSlot index={5} />
//                     </InputOTPGroup>
//                   </InputOTP>
//                 </div>
//               </div>

//               {loginError.value && (
//                 <p className="text-destructive text-sm text-center">
//                   {loginError.value}
//                 </p>
//               )}

//               <Button
//                 type="submit"
//                 className="w-full"
//                 disabled={loginLoading.value}
//               >
//                 {loginLoading.value ? (
//                   <>
//                     <Loader2 className="mr-2 size-4 animate-spin" />
//                     Verifying...
//                   </>
//                 ) : (
//                   "Verify OTP"
//                 )}
//               </Button>

//               <Button
//                 type="button"
//                 variant="ghost"
//                 className="w-full"
//                 onClick={handleBack}
//               >
//                 <ArrowLeft className="mr-2 size-4" />
//                 Back to phone number
//               </Button>

//               <p className="text-muted-foreground text-center text-sm">
//                 Didn't receive the code?{" "}
//                 <button
//                   type="button"
//                   onClick={handleSendOtp}
//                   className="text-primary hover:underline"
//                   disabled={loginLoading.value}
//                 >
//                   Resend OTP
//                 </button>
//               </p>
//             </form>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Login;


import { useNavigate } from "react-router-dom";
import { useSignals } from "@preact/signals-react/runtime";
import { Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import Logo from "@/components/common/Logo";
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

import loginImage from "../../public/login_image.png"

const Login = () => {
  useSignals();
  const navigate = useNavigate();

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

        navigate("/select-dashboard");
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

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#EEFDFD] items-center justify-center">
        <div className="max-w-full h-[95%] text-center">
          <img className="w-full h-full object-cover" src={loginImage} alt="" />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#EEFDFD]">
        <div className="w-full flex rounded-xl justify-center items-center flex-col gap-5 bg-white h-[95%] space-y-8">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <Logo />
          </div>

          {/* Header */}
          <div className="text-center ">
            <div className="hidden lg:flex items-center justify-center gap-2 mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Internal Metrics
            </h1>
          </div>

          {/* Form Card */}
          <div className="w-full flex justify-center items-center">
            <div className="space-y-6 flex flex-col justify-center items-center w-[30dvw]">
              {loginStep.value === "otp" && (
                <div className=" w-full">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {loginStep.value === "phone" ? "Welcome!" : "OTP sent"}
                </h2>
                <p className="text-sm text-gray-500">
                  {loginStep.value === "phone"
                    ? "Enter your details below"
                    : `We have sent the OTP to +91${phoneNumber.value}`}
                </p>
              </div>

              {loginStep.value === "phone" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phoneNumber"
                      className="text-sm font-medium text-gray-700"
                    >
                      Mobile No. *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-600">
                        +91
                      </span>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="Enter your mobile no."
                        value={phoneNumber.value}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          phoneNumber.value = value;
                        }}
                        onKeyDown={(e) => handleKeyDown(e, handleSendOtp)}
                        maxLength={10}
                        className="
    pl-12 h-12 min-w-[30vw]
    border-gray-300
     text-gray-800
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    bg-white 
    focus:border-cyan-500 focus:ring-cyan-500
  "
                      />
                    </div>
                    {loginError.value && (
                      <p className="text-xs text-red-500 mt-1">
                        {loginError.value}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSendOtp}
                    disabled={
                      loginLoading.value || phoneNumber.value.length !== 10
                    }
                    className={`w-full h-12 rounded-md text-white transition-colors
    ${phoneNumber.value.length === 10
                        ? "bg-[#107D89] hover:bg-[#0e6b75]"
                        : "bg-gray-400 cursor-not-allowed"
                      }
  `}
                  >
                    {loginLoading.value ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      OTP *
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp.value}
                        onChange={(value) => {
                          otp.value = value;
                        }}
                      >
                        <InputOTPGroup className="gap-2 text-gray-800">
                          <InputOTPSlot
                            index={0}
                            className="w-12 h-12 text-lg border-gray-300"
                          />
                          <InputOTPSlot
                            index={1}
                            className="w-12 h-12 text-lg border-gray-300"
                          />
                          <InputOTPSlot
                            index={2}
                            className="w-12 h-12 text-lg border-gray-300"
                          />
                          <InputOTPSlot
                            index={3}
                            className="w-12 h-12 text-lg border-gray-300"
                          />
                          <InputOTPSlot
                            index={4}
                            className="w-12 h-12 text-lg border-gray-300"
                          />
                          <InputOTPSlot
                            index={5}
                            className="w-12 h-12 text-lg border-gray-300"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {loginError.value && (
                      <p className="text-xs text-red-500 text-center mt-2">
                        {loginError.value}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full h-12 bg-[#107D89] hover:bg-[#107D89]/70 text-white rounded-md"
                    disabled={loginLoading.value || otp.value.length !== 6}
                  >
                    {loginLoading.value ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>

                  <div className="flex justify-center items-center text-sm">
                    <p className="text-gray-600">
                      Didn't receive the code?{" "}
                      <button
                        onClick={handleSendOtp}
                        className="text-cyan-600 hover:text-cyan-700 font-medium disabled:text-gray-400 hover:underline"
                        disabled={loginLoading.value}
                      >
                        Resend OTP
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
