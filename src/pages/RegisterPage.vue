<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Left side with illustration -->
      <div class="illustration-section">
        <div class="illustration-content">
          <div class="logo-area">
            <h2 class="logo-text">Gorealla Developer</h2>
          </div>

          <!-- Real estate illustration -->
          <div class="building-illustration">
            <img
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
              alt="Modern Construction"
              class="building-image"
              loading="lazy"
            />
            <div class="overlay-content">
              <div class="register-icon">
                <q-icon name="apartment" size="60px" color="white" />
              </div>
            </div>
          </div>

          <div class="illustration-footer">
            <p class="tagline">Join Our Platform</p>
            <p class="sub-tagline">Start managing your real estate projects efficiently</p>
          </div>
        </div>
      </div>

      <!-- Right side with form -->
      <div class="form-section">
        <div class="form-container">
          <div class="form-header">
            <h3>Welcome!</h3>
            <h2>Create Account</h2>
          </div>

          <div class="form-subtitle">
            <p>Fill in your details to get started</p>
          </div>

          <q-form @submit="handleRegister" class="register-form" greedy>
            <!-- Full Name -->
            <div class="form-group">
              <q-input
                v-model="registerForm.fullName"
                label="Full Name"
                type="text"
                outlined
                :rules="nameRules"
                :loading="isLoading"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>
            </div>

            <!-- Short Name -->
            <div class="form-group">
              <q-input
                v-model="registerForm.shortName"
                label="Short Name"
                type="text"
                outlined
                :rules="shortNameRules"
                :loading="isLoading"
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>
            </div>

            <!-- Email -->
            <div class="form-group">
              <q-input
                v-model="registerForm.email"
                label="Email Address"
                type="email"
                outlined
                :rules="emailRules"
                :loading="isLoading"
                lazy-rules
                @blur="checkEmailAvailability"
                :error="!emailAvailable"
                :error-message="!emailAvailable ? 'Email already registered' : ''"
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>
            </div>

            <!-- Mobile Number -->
            <div class="form-group">
              <q-input
                v-model="registerForm.mobile"
                label="Mobile Number"
                type="tel"
                outlined
                :rules="mobileRules"
                mask="##########"
                :loading="isLoading"
                lazy-rules
                @blur="checkMobileAvailability"
                :error="!mobileAvailable"
                :error-message="!mobileAvailable ? 'Mobile number already registered' : ''"
              >
                <template v-slot:prepend>
                  <q-icon name="phone" />
                </template>
              </q-input>
            </div>

            <!-- User Role -->
            <div class="form-group">
              <q-select
                v-model="registerForm.userRole"
                label="Account Type"
                :options="roleOptions"
                outlined
                emit-value
                map-options
                :rules="[val => !!val || 'Please select an account type']"
              >
                <template v-slot:prepend>
                  <q-icon name="badge" />
                </template>
              </q-select>
            </div>

            <!-- Password -->
            <div class="form-group">
              <q-input
                v-model="registerForm.password"
                label="Password"
                hint="Min length 6, must contain numbers, one capital letter and special chars"
                :type="showPassword ? 'text' : 'password'"
                outlined
                :rules="passwordRules"
                :loading="isLoading"
                lazy-rules
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

            <!-- Confirm Password -->
            <div class="form-group">
              <q-input
                v-model="registerForm.confirmPassword"
                label="Confirm Password"
                hint="Min length 6, must contain numbers, one capital letter and special chars"
                :type="showConfirmPassword ? 'text' : 'password'"
                outlined
                :rules="confirmPasswordRules"
                :loading="isLoading"
                lazy-rules
              >
                <template v-slot:prepend>
                  <q-icon name="lock_outline" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showConfirmPassword = !showConfirmPassword"
                  />
                </template>
              </q-input>
            </div>

            <!-- Terms and Conditions -->
            <div class="form-options">
              <q-checkbox
                v-model="registerForm.acceptTerms"
                color="primary"
                dense
              >
                <template v-slot:default>
                  <span class="text-grey-7">
                    I agree to the
                    <a href="#" @click.prevent="showTerms" class="text-primary">Terms and Conditions</a>
                    and
                    <a href="#" @click.prevent="showPrivacy" class="text-primary">Privacy Policy</a>
                  </span>
                </template>
              </q-checkbox>
            </div>

            <!-- Register Button -->
            <q-btn
              type="submit"
              label="Create Account"
              color="primary"
              class="register-btn"
              :loading="isLoading"
              :disable="isLoading || !registerForm.acceptTerms || !emailAvailable || !mobileAvailable"
              no-caps
              icon="person_add"
            />

            <!-- Login Link -->
            <div class="login-link">
              <span class="text-grey-7">Already have an account?</span>
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                label="Login"
                @click="handleLogin"
                class="q-ml-sm"
              />
            </div>
          </q-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { showSuccess, showError, showInfo } from 'src/utils/notification'
import { required, email, mobile, minLength } from 'src/utils/validation'
import userService from 'src/services/api/user.service'
import authService from 'src/services/api/auth.service'

export default {
  name: 'RegisterPage',

  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    // Form data
    const registerForm = ref({
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      userRole: 'User',
      shortName: '',
      acceptTerms: false
    })

    // UI state
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const isLoading = computed(() => authStore.isLoading)
    const emailAvailable = ref(true)
    const mobileAvailable = ref(true)

    // Role options (excluding Admin - should be created by system admin only)
    const roleOptions = [
      { label: 'Project Manager', value: 'ProjectManager', description: 'Manage projects and teams' },
      { label: 'Engineer', value: 'Engineer', description: 'Technical project execution' },
      { label: 'Contractor', value: 'Contractor', description: 'Construction and execution' },
      { label: 'User', value: 'User', description: 'General platform user' },
      { label: 'Viewer', value: 'Viewer', description: 'View-only access' }
    ]

    // Validation rules
    const nameRules = [
      required('Full name is required'),
      minLength(2, 'Name must be at least 2 characters'),
      val => /^[a-zA-Z\s]+$/.test(val) || 'Name can only contain letters and spaces'
    ]

    const shortNameRules = [
      required('Short name is required'),
      minLength(2, 'Short Name must be at least 2 characters'),
      val => /^[a-zA-Z\s]+$/.test(val) || 'Short Name can only contain letters and spaces'
    ]

    const emailRules = [
      required('Email is required'),
      email('Please enter a valid email address')
    ]

    const mobileRules = [
      required('Mobile number is required'),
      mobile('Please enter a valid 10-digit mobile number')
    ]

    const passwordRules = [
      required('Password is required'),
      minLength(6, 'Password must be at least 6 characters'),
      val => /(?=.*[a-z])/.test(val) || 'Password must contain at least one lowercase letter',
      val => /(?=.*[A-Z])/.test(val) || 'Password must contain at least one uppercase letter',
      val => /(?=.*\d)/.test(val) || 'Password must contain at least one number'
    ]

    const confirmPasswordRules = [
      required('Please confirm your password'),
      val => val === registerForm.value.password || 'Passwords do not match'
    ]

    // Check email availability
    const checkEmailAvailability = async () => {
      if (!registerForm.value.email || !email()(registerForm.value.email) === true) {
        return
      }

      try {
        const result = await userService.checkEmailAvailability(registerForm.value.email)
        emailAvailable.value = result.data?.available !== false
      } catch (error) {
        console.error('Email check error:', error)
      }
    }

    // Check mobile availability
    const checkMobileAvailability = async () => {
      if (!registerForm.value.mobile || registerForm.value.mobile.length !== 10) {
        return
      }

      try {
        const result = await userService.checkMobileAvailability(registerForm.value.mobile)
        mobileAvailable.value = result.data?.available !== false
      } catch (error) {
        console.error('Mobile check error:', error)
      }
    }

    // Handle registration
    const handleRegister = async () => {
      // Final validation check
      if (!emailAvailable.value) {
        showError('Email address is already registered')
        return
      }

      if (!mobileAvailable.value) {
        showError('Mobile number is already registered')
        return
      }

      if (!registerForm.value.acceptTerms) {
        showError('Please accept the terms and conditions')
        return
      }

      try {
        // Store device info
        await authService.storeDeviceInfo()

        // Prepare user data
        const userData = {
          fullName: registerForm.value.fullName,
          email: registerForm.value.email,
          mobile: registerForm.value.mobile,
          password: registerForm.value.password,
          userRole: registerForm.value.userRole,
          shortName: registerForm.value.shortName
        }

        const result = await authStore.register(userData)

        if (result.success) {
          showSuccess('Account created successfully! Please check your email and mobile for verification.')

          // Redirect to login with pre-filled mobile
          setTimeout(() => {
            router.push({
              name: 'login',
              query: {
                mobile: registerForm.value.mobile,
                registered: 'true'
              }
            })
          }, 2000)
        } else {
          showError(result.message || 'Registration failed. Please try again.')
        }
      } catch (error) {
        console.error('Registration error:', error)
        showError('An error occurred during registration. Please try again.')
      }
    }

    // Show terms and conditions
    const showTerms = () => {
      showInfo('Terms and Conditions page would open here')
      // router.push({ name: 'terms' })
    }

    // Show privacy policy
    const showPrivacy = () => {
      showInfo('Privacy Policy page would open here')
      // router.push({ name: 'privacy' })
    }

    // Handle login navigation
    const handleLogin = () => {
      router.push({ name: 'login' })
    }

    // Watch for password changes to revalidate confirm password
    watch(() => registerForm.value.password, () => {
      if (registerForm.value.confirmPassword) {
        // Trigger revalidation of confirm password field
        // eslint-disable-next-line no-self-assign
        registerForm.value.confirmPassword = registerForm.value.confirmPassword
      }
    })

    return {
      registerForm,
      showPassword,
      showConfirmPassword,
      isLoading,
      emailAvailable,
      mobileAvailable,
      roleOptions,
      nameRules,
      shortNameRules,
      emailRules,
      mobileRules,
      passwordRules,
      confirmPasswordRules,
      checkEmailAvailability,
      checkMobileAvailability,
      handleRegister,
      showTerms,
      showPrivacy,
      handleLogin
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.register-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 800px;
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

.register-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 30px;
  backdrop-filter: blur(10px);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
  padding: 40px 60px;
  background-color: white;
  overflow-y: auto;
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
  margin: 20px 0 30px;
}

.form-subtitle p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.register-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-options {
  margin: 20px 0;
}

.form-options a {
  text-decoration: none;
}

.form-options a:hover {
  text-decoration: underline;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
  border-radius: 8px;
  margin-top: 10px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
    max-width: 100%;
    min-height: 100vh;
    border-radius: 0;
  }

  .illustration-section {
    padding: 40px 20px;
    min-height: 200px;
  }

  .form-section {
    padding: 30px 20px;
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

  .register-icon {
    padding: 20px;
  }

  .register-icon .q-icon {
    font-size: 40px !important;
  }
}

/* Quasar Input Overrides */
.register-form :deep(.q-field__control) {
  height: 48px;
}

.register-form :deep(.q-field__label) {
  font-size: 14px;
}

.register-form :deep(.q-field__native) {
  font-size: 16px;
}

/* Scrollbar styling for form section */
.form-section::-webkit-scrollbar {
  width: 8px;
}

.form-section::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.form-section::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.form-section::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
