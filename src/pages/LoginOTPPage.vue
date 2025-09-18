<template>
  <div class="login-otp-page">
    <div class="login-otp-container">
      <!-- Left side with illustration -->
      <div class="illustration-section">
        <div class="illustration-content">
          <div class="logo-area">
            <h2 class="logo-text">Gorealla Developer</h2>
          </div>

          <!-- Real estate illustration -->
          <div class="building-illustration">
            <img
              src="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80"
              alt="Real Estate Development"
              class="building-image"
              loading="lazy"
            />
            <div class="overlay-content">
              <div class="otp-icon">
                <q-icon name="sms" size="60px" color="white" />
              </div>
            </div>
          </div>

          <div class="illustration-footer">
            <p class="tagline">Secure OTP Login</p>
            <p class="sub-tagline">Quick and secure access to your real estate projects</p>
          </div>
        </div>
      </div>

      <!-- Right side with form -->
      <div class="form-section">
        <div class="form-container">
          <!-- Back to login button -->
          <div class="back-button">
            <q-btn
              flat
              dense
              no-caps
              icon="arrow_back"
              label="Back to Password Login"
              color="primary"
              @click="handleBackToLogin"
            />
          </div>

          <div class="form-header">
            <h3>Welcome Back!</h3>
            <h2>Login with OTP</h2>
          </div>

          <div class="form-subtitle">
            <p v-if="step === 'identifier'">
              Enter your {{ getUserTypeLabel() }} to receive OTP
            </p>
            <p v-else>
              Enter the 6-digit OTP sent to your {{ getOTPDeliveryMethod() }}
            </p>
          </div>

          <!-- User Type Selection -->
          <div v-if="step === 'identifier'" class="user-type-section">
            <q-option-group
              v-model="selectedUserType"
              :options="userTypeOptions"
              color="primary"
              inline
              class="user-type-toggle"
              @update:model-value="handleUserTypeChange"
            />
          </div>

          <!-- Step 1: Identifier (Mobile/Email) -->
          <q-form v-if="step === 'identifier'" @submit="handleSendOTP" class="otp-form" greedy>
            <div class="form-group">
              <q-input
                v-model="otpForm.identifier"
                :label="getInputLabel()"
                :type="getInputType()"
                outlined
                :rules="getValidationRules()"
                :mask="getInputMask()"
                :loading="isLoading"
                lazy-rules
                @keyup.enter="handleSendOTP"
                :hint="getInputHint()"
              >
                <template v-slot:prepend>
                  <q-icon :name="getInputIcon()" />
                </template>
              </q-input>
            </div>

            <q-btn
              type="submit"
              label="Send OTP"
              color="primary"
              class="submit-btn"
              :loading="isLoading"
              :disable="isLoading"
              no-caps
              icon="send"
            />

            <!-- Alternative login option -->
            <div class="alternative-login">
              <span class="text-grey-7">Prefer password?</span>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Login with Password"
                @click="handlePasswordLogin"
                class="q-ml-sm"
              />
            </div>
          </q-form>

          <!-- Step 2: OTP Verification -->
          <q-form v-else @submit="handleVerifyOTP" class="otp-form" greedy>
            <!-- User Type Display -->
            <div class="user-type-display">
              <q-chip
                :icon="selectedUserType === USER_TYPES.USER ? 'person' : 'business'"
                :label="selectedUserType === USER_TYPES.USER ? 'Internal User' : 'Stakeholder'"
                color="primary"
                text-color="white"
                class="q-mb-md"
              />
            </div>

            <!-- Identifier (readonly) -->
            <div class="form-group">
              <q-input
                v-model="otpForm.identifier"
                :label="getInputLabel()"
                :type="getInputType()"
                outlined
                readonly
                bg-color="grey-2"
              >
                <template v-slot:prepend>
                  <q-icon :name="getInputIcon()" />
                </template>
                <template v-slot:append>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    label="Change"
                    @click="handleChangeIdentifier"
                  />
                </template>
              </q-input>
            </div>

            <!-- OTP Input -->
            <div class="form-group">
              <q-input
                v-model="otpForm.otp"
                label="Enter OTP"
                type="text"
                outlined
                :rules="otpRules"
                mask="######"
                :loading="isLoading"
                lazy-rules
                @keyup.enter="handleVerifyOTP"
                :hint="`Enter the 6-digit code sent to your ${getOTPDeliveryMethod()}`"
              >
                <template v-slot:prepend>
                  <q-icon name="pin" />
                </template>
              </q-input>
            </div>

            <!-- Remember Me -->
            <div class="form-options">
              <q-checkbox
                v-model="otpForm.rememberMe"
                label="Remember me"
                color="primary"
                dense
              />
            </div>

            <q-btn
              type="submit"
              label="Verify & Login"
              color="primary"
              class="submit-btn"
              :loading="isLoading"
              :disable="isLoading"
              no-caps
              icon="verified_user"
            />

            <!-- Resend OTP -->
            <div class="resend-section">
              <span class="text-grey-7">Didn't receive OTP?</span>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Resend OTP"
                @click="handleResendOTP"
                :disable="resendTimer > 0 || isLoading"
                class="q-ml-sm"
              />
              <span v-if="resendTimer > 0" class="text-grey-6 q-ml-sm">
                ({{ resendTimer }}s)
              </span>
            </div>

            <!-- Alternative login option -->
            <div class="alternative-login q-mt-md">
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Try another method"
                @click="handlePasswordLogin"
              />
            </div>
          </q-form>

          <!-- Info section -->
          <div class="info-section">
            <q-icon name="info" color="info" size="20px" />
            <span class="text-grey-7 q-ml-sm">
              OTP will be sent to your registered {{ getOTPDeliveryMethod().toLowerCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { showSuccess, showError, showInfo } from 'src/utils/notification'
import { required, mobile, emailOrMobile, detectInputType, getInputIcon as getValidationInputIcon, getInputHint as getValidationInputHint } from 'src/utils/validation'
import { USER_TYPES } from 'src/constants/api.constants'
import authService from 'src/services/api/auth.service'

export default {
  name: 'LoginOTPPage',

  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    // User type selection
    const selectedUserType = ref(USER_TYPES.USER)
    const userTypeOptions = [
      { label: 'Internal User', value: USER_TYPES.USER },
      { label: 'Stakeholder', value: USER_TYPES.STAKEHOLDER }
    ]

    // Form steps
    const step = ref('identifier') // 'identifier' or 'otp'

    // Form data
    const otpForm = ref({
      identifier: '',
      otp: '',
      rememberMe: false
    })

    // UI state
    const isLoading = computed(() => authStore.isLoading)
    const resendTimer = ref(0)
    let timerInterval = null

    // Validation rules
    const getUserValidationRules = () => {
      if (selectedUserType.value === USER_TYPES.USER) {
        return [
          required('Mobile number is required'),
          mobile('Please enter a valid 10-digit mobile number')
        ]
      } else {
        return [
          required('Email or mobile number is required'),
          emailOrMobile('Please enter a valid email address or mobile number')
        ]
      }
    }

    const otpRules = [
      required('OTP is required'),
      val => (val && val.length === 6) || 'OTP must be 6 digits'
    ]

    // Check if user is redirected from another page
    const redirectPath = computed(() => {
      return route.query.redirect || '/menu/dashboard'
    })

    // Initialize
    onMounted(async () => {
      // If already authenticated, redirect
      if (authStore.isAuthenticated) {
        router.push(redirectPath.value)
        return
      }

      // Load user type from query or preference
      if (route.query.userType) {
        selectedUserType.value = route.query.userType
      } else {
        selectedUserType.value = authStore.getLastUsedUserType()
      }

      // Pre-fill identifier if passed from login page
      if (route.query.mobile && selectedUserType.value === USER_TYPES.USER) {
        otpForm.value.identifier = route.query.mobile
      }
      if (route.query.emailOrPhone && selectedUserType.value === USER_TYPES.STAKEHOLDER) {
        otpForm.value.identifier = route.query.emailOrPhone
      }

      // Store device info for tracking
      await authService.storeDeviceInfo()
    })

    // Cleanup timer
    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    })

    // Handle user type change
    const handleUserTypeChange = (newUserType) => {
      selectedUserType.value = newUserType
      otpForm.value.identifier = '' // Clear identifier when switching types
      authStore.setUserType(newUserType)
    }

    // Get user type label
    const getUserTypeLabel = () => {
      return selectedUserType.value === USER_TYPES.USER
        ? 'registered mobile number'
        : 'registered email address or mobile number'
    }

    // Get OTP delivery method
    const getOTPDeliveryMethod = () => {
      if (selectedUserType.value === USER_TYPES.USER) {
        return 'SMS'
      } else {
        const inputType = detectInputType(otpForm.value.identifier)
        return inputType === 'email' ? 'Email' : 'SMS'
      }
    }

    // Get input properties based on user type
    const getInputLabel = () => {
      return authService.getInputLabel(selectedUserType.value)
    }

    const getInputType = () => {
      if (selectedUserType.value === USER_TYPES.USER) {
        return 'tel'
      } else {
        // Auto-detect based on input
        const inputType = detectInputType(otpForm.value.identifier)
        return inputType === 'email' ? 'email' : 'tel'
      }
    }

    const getInputMask = () => {
      if (selectedUserType.value === USER_TYPES.USER) {
        return '##########'
      } else {
        // No mask for stakeholders (email or mobile)
        return ''
      }
    }

    const getValidationRules = () => {
      return getUserValidationRules()
    }

    const getInputIcon = () => {
      if (selectedUserType.value === USER_TYPES.USER) {
        return 'phone'
      } else {
        return getValidationInputIcon(otpForm.value.identifier)
      }
    }

    const getInputHint = () => {
      if (selectedUserType.value === USER_TYPES.USER) {
        return 'Enter your registered mobile number'
      } else {
        return getValidationInputHint(otpForm.value.identifier)
      }
    }

    // Start resend timer
    const startResendTimer = () => {
      resendTimer.value = 60 // 60 seconds
      timerInterval = setInterval(() => {
        resendTimer.value--
        if (resendTimer.value <= 0) {
          clearInterval(timerInterval)
          timerInterval = null
        }
      }, 1000)
    }

    // Handle send OTP
    const handleSendOTP = async () => {
      try {
        const result = await authStore.unifiedGenerateOTP({
          userType: selectedUserType.value,
          identifier: otpForm.value.identifier
        })

        if (result.success) {
          const deliveryMethod = getOTPDeliveryMethod()
          showSuccess(`OTP sent successfully to your ${deliveryMethod.toLowerCase()}`)
          step.value = 'otp'
          startResendTimer()
        } else {
          // Check if identifier is registered
          if (result.message?.includes('not found') || result.message?.includes('not registered')) {
            const userTypeLabel = selectedUserType.value === USER_TYPES.USER ? 'Mobile number' : 'Email/mobile'
            showError(`${userTypeLabel} not registered. Please check or create a new account.`)
          } else {
            showError(result.message || 'Failed to send OTP. Please try again.')
          }
        }
      } catch (error) {
        console.error('Send OTP error:', error)
        showError('An error occurred. Please try again.')
      }
    }

    // Handle verify OTP and login
    const handleVerifyOTP = async () => {
      try {
        const result = await authStore.unifiedOTPLogin({
          userType: selectedUserType.value,
          identifier: otpForm.value.identifier,
          otp: otpForm.value.otp,
          rememberMe: otpForm.value.rememberMe
        })

        if (result.success) {
          showSuccess('Login successful! Redirecting...')

          // Small delay for better UX
          setTimeout(() => {
            router.push(redirectPath.value)
          }, 500)
        } else {
          showError(result.message || 'Invalid OTP. Please check and try again.')
        }
      } catch (error) {
        console.error('OTP login error:', error)
        showError('An error occurred during login. Please try again.')
      }
    }

    // Handle resend OTP
    const handleResendOTP = async () => {
      if (resendTimer.value > 0) return

      try {
        const result = await authStore.unifiedGenerateOTP({
          userType: selectedUserType.value,
          identifier: otpForm.value.identifier
        })

        if (result.success) {
          showInfo('OTP resent successfully')
          startResendTimer()
        } else {
          showError('Failed to resend OTP. Please try again.')
        }
      } catch (error) {
        console.error('Resend OTP error:', error)
        showError('An error occurred. Please try again.')
      }
    }

    // Handle change identifier
    const handleChangeIdentifier = () => {
      step.value = 'identifier'
      otpForm.value.otp = ''
      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
      resendTimer.value = 0
    }

    // Handle back to login
    const handleBackToLogin = () => {
      router.push({ name: 'login' })
    }

    // Handle password login
    const handlePasswordLogin = () => {
      const queryParams = {
        userType: selectedUserType.value
      }

      if (selectedUserType.value === USER_TYPES.USER) {
        queryParams.mobile = otpForm.value.identifier
      } else {
        queryParams.emailOrPhone = otpForm.value.identifier
      }

      router.push({
        name: 'login',
        query: queryParams
      })
    }

    return {
      USER_TYPES,
      selectedUserType,
      userTypeOptions,
      step,
      otpForm,
      isLoading,
      resendTimer,
      otpRules,
      redirectPath,
      handleUserTypeChange,
      getUserTypeLabel,
      getOTPDeliveryMethod,
      getInputLabel,
      getInputType,
      getInputMask,
      getValidationRules,
      getInputIcon,
      getInputHint,
      handleSendOTP,
      handleVerifyOTP,
      handleResendOTP,
      handleChangeIdentifier,
      handleBackToLogin,
      handlePasswordLogin
    }
  }
}
</script>

<style scoped>
.login-otp-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.login-otp-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 700px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

/* Illustration Section */
.illustration-section {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.illustration-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-area {
  margin-bottom: 40px;
}

.logo-text {
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.building-illustration {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 40px 0;
}

.building-image {
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 15px;
  opacity: 0.9;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.overlay-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.otp-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 30px;
  backdrop-filter: blur(10px);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.illustration-footer {
  color: white;
  text-align: center;
  margin-top: 40px;
}

.tagline {
  font-size: 18px;
  margin-bottom: 10px;
  opacity: 0.95;
}

.sub-tagline {
  font-size: 14px;
  opacity: 0.8;
}

/* Form Section */
.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background-color: white;
}

.form-container {
  width: 100%;
  max-width: 400px;
}

.back-button {
  margin-bottom: 30px;
}

.form-header h3 {
  margin: 0;
  font-size: 24px;
  color: #666;
  font-weight: 400;
}

.form-header h2 {
  margin: 5px 0 0 0;
  font-size: 32px;
  color: #333;
  font-weight: 600;
}

.form-subtitle {
  margin: 30px 0 20px;
}

.form-subtitle p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.otp-form {
  margin-top: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-options {
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  border-radius: 8px;
}

.resend-section {
  text-align: center;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alternative-login {
  text-align: center;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-otp-container {
    flex-direction: column;
    max-width: 100%;
    min-height: 100vh;
    border-radius: 0;
  }

  .illustration-section {
    padding: 40px 20px;
    min-height: 250px;
  }

  .form-section {
    padding: 40px 20px;
  }

  .building-image {
    max-width: 250px;
  }

  .logo-text {
    font-size: 24px;
  }

  .form-header h2 {
    font-size: 28px;
  }

  .otp-icon {
    padding: 20px;
  }

  .otp-icon .q-icon {
    font-size: 40px !important;
  }

  .info-section {
    flex-direction: column;
    text-align: center;
  }
}

/* Quasar Input Overrides */
.otp-form :deep(.q-field__control) {
  height: 48px;
}

.otp-form :deep(.q-field__label) {
  font-size: 14px;
}

.otp-form :deep(.q-field__native) {
  font-size: 16px;
}
</style>
