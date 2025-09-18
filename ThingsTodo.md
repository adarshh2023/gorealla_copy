### List of enhancements and bugs to do
| 2025.08.13 | Notes of a user can only be edited by him, provided he has not created a newer note. | Done    |
| 2025.08.13 | Notes, tasks, should load as soon as node is clicked not on clicking the Tab.        | Done.   |
| 2025.08.13 | Checkbox in tasks is not working.                                                    | Done.   |
| 2025.08.13 | Users are not getting loaded in dropdown for task.                                   | Done.   |
| 2025.08.19 | UserServiceImpl. *See below*                                                         | Pending.|
| 2025.08.19 | In vue Stakeholder tab, when node changes the count remains of older node            | Pending.|
| 2025.08.19 | Similar to NodeUpdateLog will need for Tasks, Gallery, Assignments, Notes            | Done.   |
| 2025.08.24 | Remove UserDeviceTokens and StakeholderDeviceTokens from db etc.                     | Pending.|
|--|--|--|

*2025.08.19 TODO*
TODO: merge searchUsers and searchByNameOrEmailPageable in UserRepository.java
TODO: right now has with UserId, signature clash in UserServiceImpl
```
@Override
public boolean verifyOTP(String mobile, String otp) {
    logger.info("Verifying OTP for mobile: {}", mobile);
    
    User user = userRepository.findByMobileAndActiveFlag(mobile, true)
            .orElseThrow(() -> new ResourceNotFoundException("User", mobile));
    
    if (user.getOtp() == null || user.getOtpExpiry() == null) {
        throw new ValidationException("No OTP found. Please request a new OTP.");
    }
    
    if (user.isOTPExpired()) {
        throw new ValidationException("OTP has expired. Please request a new OTP.");
    }
    
    if (!user.getOtp().equals(otp)) {
        throw new ValidationException("Invalid OTP");
    }
    
    // Clear OTP after successful verification
    user.clearOTP();
    userRepository.save(user);
    
    return true;
}
```