<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left side with illustration -->
      <div class="illustration-section">
        <div class="illustration-content">
          <div class="logo-area">
            <h2 class="logo-text">Gorealla Developer</h2>
          </div>

          <!-- Real estate illustration -->
          <div class="building-illustration">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
              alt="Modern Building"
              class="building-image"
              loading="lazy"
            />
            <div class="overlay-content">
              <div class="moon"></div>
              <div class="stars">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div class="illustration-footer">
            <p class="tagline">Build Your Dreams, Track Your Progress</p>
            <p class="sub-tagline">Comprehensive project management for real estate developers</p>
          </div>
        </div>
      </div>

      <!-- Right side with login form -->
      <div class="form-section">
        <div class="form-container">
          <div class="form-header">
            <h3>Welcome!</h3>
            <h2>Lets Do Something Awesome</h2>
          </div>

          <div class="form-subtitle">
            <p>Login to your account</p>
          </div>

          <!-- User Type Selection -->
          <div class="user-type-section">
            <q-option-group
              v-model="selectedUserType"
              :options="userTypeOptions"
              color="primary"
              inline
              class="user-type-toggle"
              @update:model-value="handleUserTypeChange"
            />
          </div>

          <q-form @submit="handleLogin" class="login-form" greedy>
            <!-- Identifier Input (Mobile for Users, Email/Mobile for Stakeholders) -->
            <div class="form-group">
              <q-input
                v-model="loginForm.identifier"
                :label="getInputLabel()"
                :type="getInputType()"
                outlined
                :rules="getValidationRules()"
                :mask="getInputMask()"
                :loading="isLoading"
                lazy-rules
                @keyup.enter="handleLogin"
                :hint="getInputHint()"
              >
                <template v-slot:prepend>
                  <q-icon :name="getInputIcon()" />
                </template>
              </q-input>
            </div>

            <!-- Password Input -->
            <div class="form-group">
              <q-input
                v-model="loginForm.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                outlined
                :rules="passwordRules"
                :loading="isLoading"
                lazy-rules
                @keyup.enter="handleLogin"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>

            <!-- Remember Me and Forgot Password -->
            <div class="form-options">
              <q-checkbox
                v-model="loginForm.rememberMe"
                label="Remember me"
                color="primary"
                dense
              />
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Forgot password?"
                @click="handleForgotPassword"
              />
            </div>

            <!-- Login Button -->
            <q-btn
              type="submit"
              label="Login"
              color="primary"
              class="login-btn"
              :loading="isLoading"
              :disable="isLoading"
              no-caps
            />

            <!-- Create Account Link -->
            <div class="create-account">
              <span class="text-grey-7">Don't have an account?</span>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Create Account"
                @click="handleCreateAccount"
                class="q-ml-sm"
              />
            </div>
          </q-form>

          <!-- Login with OTP Option -->
          <div class="divider-section">
            <q-separator />
            <span class="divider-text">OR</span>
            <q-separator />
          </div>

          <q-btn
            outline
            label="Login with OTP"
            color="primary"
            class="otp-btn"
            icon="sms"
            @click="handleLoginWithOTP"
            no-caps
            :disable="isLoading"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { showSuccess, showError, showWarning } from 'src/utils/notification.js'
import { required, mobile, minLength, emailOrMobile, detectInputType, getInputIcon as getValidationInputIcon, getInputHint as getValidationInputHint } from 'src/utils/validation.js'
import { USER_TYPES } from 'src/constants/api.constants'
import authService from 'src/services/api/auth.service.js'

export default {
  name: 'LoginPage',

  setup() {
    // eslint-disable-next-line no-unused-vars
    const $q = useQuasar()
    const router = useRouter()
    const authStore = useAuthStore()

    // User type selection
    const selectedUserType = ref(USER_TYPES.USER)
    const userTypeOptions = [
      { label: 'Internal User', value: USER_TYPES.USER },
      { label: 'Stakeholder', value: USER_TYPES.STAKEHOLDER }
    ]

    // Form data
    const loginForm = ref({
      identifier: '',
      password: '',
      rememberMe: false
    })

    // UI state
    const showPassword = ref(false)
    const isLoading = computed(() => authStore.isLoading)

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

    const passwordRules = [
      required('Password is required'),
      minLength(6, 'Password must be at least 6 characters')
    ]

    // Check if user is redirected from another page
    const redirectPath = computed(() => {
      return router.currentRoute.value.query.redirect || '/menu/dashboard'
    })

    // Initialize
    onMounted(async () => {
      // If already authenticated, redirect
      if (authStore.isAuthenticated) {
        router.push(redirectPath.value)
        return
      }

      // Load last used user type
      selectedUserType.value = authStore.getLastUsedUserType()

      // Pre-fill identifier if passed from other pages
      if (router.currentRoute.value.query.mobile) {
        loginForm.value.identifier = router.currentRoute.value.query.mobile
        selectedUserType.value = USER_TYPES.USER
      }
      if (router.currentRoute.value.query.email) {
        loginForm.value.identifier = router.currentRoute.value.query.email
        selectedUserType.value = USER_TYPES.STAKEHOLDER
      }

      // Show warning if redirected due to session expiry
      if (router.currentRoute.value.query.sessionExpired) {
        showWarning('Your session has expired. Please login again.')
      }

      // Store device info for tracking
      await authService.storeDeviceInfo()
    })

    // Handle user type change
    const handleUserTypeChange = (newUserType) => {
      selectedUserType.value = newUserType
      loginForm.value.identifier = '' // Clear identifier when switching types
      authStore.setUserType(newUserType)
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
        const inputType = detectInputType(loginForm.value.identifier)
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
        return getValidationInputIcon(loginForm.value.identifier)
      }
    }

    const getInputHint = () => {
      if (selectedUserType.value === USER_TYPES.USER) {
        return 'Enter your registered mobile number'
      } else {
        return getValidationInputHint(loginForm.value.identifier)
      }
    }

    // Handle login
    const handleLogin = async () => {
      try {
        const result = await authStore.unifiedLogin({
          userType: selectedUserType.value,
          identifier: loginForm.value.identifier,
          password: loginForm.value.password,
          rememberMe: loginForm.value.rememberMe
        })

        if (result.success) {
          showSuccess('Login successful! Redirecting...')

          // Small delay for better UX
          setTimeout(() => {
            router.push(redirectPath.value)
          }, 500)
        } else {
          // Check if account is locked (for users)
          if (selectedUserType.value === USER_TYPES.USER && authStore.loginAttempts >= 3) {
            const accountStatus = await authService.checkAccountStatus(loginForm.value.identifier)
            if (accountStatus.data?.isLocked) {
              showError('Your account has been locked due to multiple failed attempts. Please contact support.')
              return
            }
          }

          showError(result.message || 'Invalid credentials. Please check and try again.')
        }
      } catch (error) {
        console.error('Login error:', error)
        showError('An error occurred during login. Please try again.')
      }
    }

    // Handle forgot password
    const handleForgotPassword = () => {
      if (!loginForm.value.identifier) {
        showWarning('Please enter your mobile number or email first')
        return
      }

      const queryParams = {
        userType: selectedUserType.value
      }

      if (selectedUserType.value === USER_TYPES.USER) {
        queryParams.mobile = loginForm.value.identifier
      } else {
        queryParams.emailOrPhone = loginForm.value.identifier
      }

      router.push({
        name: 'forgot-password',
        query: queryParams
      })
    }

    // Handle create account
    const handleCreateAccount = () => {
      router.push({ name: 'register' })
    }

    // Handle login with OTP
    const handleLoginWithOTP = () => {
      const queryParams = {
        userType: selectedUserType.value
      }

      if (loginForm.value.identifier) {
        if (selectedUserType.value === USER_TYPES.USER) {
          queryParams.mobile = loginForm.value.identifier
        } else {
          queryParams.emailOrPhone = loginForm.value.identifier
        }
      }

      router.push({
        name: 'login-otp',
        query: queryParams
      })
    }

    return {
      selectedUserType,
      userTypeOptions,
      loginForm,
      showPassword,
      isLoading,
      passwordRules,
      handleUserTypeChange,
      getInputLabel,
      getInputType,
      getInputMask,
      getValidationRules,
      getInputIcon,
      getInputHint,
      handleLogin,
      handleForgotPassword,
      handleCreateAccount,
      handleLoginWithOTP
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.login-container {
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
  pointer-events: none;
}

.moon {
  position: absolute;
  top: 50px;
  right: 50px;
  width: 60px;
  height: 60px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.5);
}

.stars span {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  animation: twinkle 3s infinite;
}

.stars span:nth-child(1) {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.stars span:nth-child(2) {
  top: 40%;
  right: 30%;
  animation-delay: 1s;
}

.stars span:nth-child(3) {
  bottom: 30%;
  left: 40%;
  animation-delay: 2s;
}

@keyframes twinkle {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
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

/* User Type Section */
.user-type-section {
  margin: 20px 0 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.user-type-toggle {
  width: 100%;
  justify-content: center;
}

.user-type-toggle :deep(.q-radio) {
  margin: 0 20px;
}

.user-type-toggle :deep(.q-radio__label) {
  font-weight: 500;
  color: #495057;
}

.user-type-toggle :deep(.q-radio--checked .q-radio__label) {
  color: var(--q-primary);
}

.login-form {
  margin-top: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  border-radius: 8px;
}

.create-account {
  text-align: center;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-section {
  display: flex;
  align-items: center;
  margin: 30px 0;
  gap: 15px;
}

.divider-text {
  color: #999;
  font-size: 14px;
  white-space: nowrap;
}

.otp-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  border-radius: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    max-width: 100%;
    min-height: 100vh;
    border-radius: 0;
  }

  .illustration-section {
    padding: 40px 20px;
    min-height: 300px;
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

  .tagline {
    font-size: 16px;
  }

  .sub-tagline {
    font-size: 12px;
  }

  .user-type-toggle :deep(.q-radio) {
    margin: 0 10px;
  }
}

/* Quasar Input Overrides */
.login-form :deep(.q-field__control) {
  height: 48px;
}

.login-form :deep(.q-field__label) {
  font-size: 14px;
}

.login-form :deep(.q-field__native) {
  font-size: 16px;
}

/* User Type Toggle Styling */
.user-type-section :deep(.q-option-group) {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.user-type-section :deep(.q-radio) {
  align-items: center;
}

.user-type-section :deep(.q-radio__inner) {
  margin-right: 8px;
}
</style>
