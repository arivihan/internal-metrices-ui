import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Phone, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

import Logo from '@/components/common/Logo'
import AuthBackgroundShape from '@/assets/svg/auth-background-shape'
import { authService } from '@/services/auth'
import { setAuth } from '@/signals/auth'

type Step = 'phone' | 'otp'

const Login = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.sendOtp({ phoneNumber })
      if (response.status === 200) {
        setStep('otp')
      } else {
        setError(response.message || 'Failed to send OTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.verifyOtp({ phoneNumber, otp })
      if (response.success && response.data) {
        setAuth(response.data.accessToken, response.admin)
        navigate('/dashboard')
      } else {
        setError(response.message || 'Invalid OTP')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('phone')
    setOtp('')
    setError(null)
  }

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute opacity-50'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-10 w-full border-none shadow-lg sm:max-w-md'>
        <CardHeader className='space-y-4'>
          <Logo />
          <div>
            <CardTitle className='text-2xl'>
              {step === 'phone' ? 'Sign in to your account' : 'Verify OTP'}
            </CardTitle>
            <CardDescription className='text-base'>
              {step === 'phone'
                ? 'Enter your phone number to receive an OTP'
                : `We've sent a 6-digit code to +91 ${phoneNumber}`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='phoneNumber'>Phone Number</Label>
                <div className='relative'>
                  <span className='text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm'>
                    +91
                  </span>
                  <Input
                    id='phoneNumber'
                    type='tel'
                    placeholder='Enter your phone number'
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setPhoneNumber(value)
                    }}
                    className='pl-12'
                    maxLength={10}
                  />
                  <Phone className='text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2' />
                </div>
              </div>

              {error && (
                <p className='text-destructive text-sm'>{error}</p>
              )}

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className='space-y-4'>
              <div className='space-y-2'>
                <Label>Enter OTP</Label>
                <div className='flex justify-center'>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
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

              {error && (
                <p className='text-destructive text-sm text-center'>{error}</p>
              )}

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button
                type='button'
                variant='ghost'
                className='w-full'
                onClick={handleBack}
              >
                <ArrowLeft className='mr-2 size-4' />
                Back to phone number
              </Button>

              <p className='text-muted-foreground text-center text-sm'>
                Didn't receive the code?{' '}
                <button
                  type='button'
                  onClick={handleSendOtp}
                  className='text-primary hover:underline'
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
