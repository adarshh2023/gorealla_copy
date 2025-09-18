** 2025.08.02 **
Forgot password vue, where is the error message coming from?
delete fkeys for ProjectNodes in InsertUser and UpdateUser

** 2025.08.04 **
In ProjectNodeDTO.java commented @NotBlank for NodeName

** 2025.08.19 **
Commented @PreAuthorize("hasRole('Admin')") from UserController.java for method public ResponseEntity<ApiResponse<Page<UserDTO>>> getAllUsers
In Stakholders.java (model) added method
```
public String getCompanyAndContactPersonName() {
    return companyName.concat(" [").concat(contactPersonName).concat("]");
}
```

Changed NoteServiceImpl method populateUserNames to handle Users as well as Stakeholders
```
// Batch fetch user names for notes
private void populateUserNames(List<NodeNotes> notes) {
    // Get all unique user IDs
    Set<String> userIds = notes.stream()
            .map(NodeNotes::getInsertUser)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
    
    // Fetch all users in one query
    List<User> users = userRepository.findAllById(userIds);
    List<Stakeholders> stakeholders = stakeholderRepository.findAllById(userIds);
    Map<String, String> userIdToNameMap = users.stream()
            .collect(Collectors.toMap(User::getRecCode, User::getShortName));
    
    Map<String, String> stakeholderIdToNameMap = stakeholders.stream()
            .collect(Collectors.toMap(Stakeholders::getRecCode, Stakeholders::getCompanyAndContactPersonName));
    
    // Populate user names
    notes.forEach(note -> {
        String userName = userIdToNameMap.get(note.getInsertUser());
        if (userName != null) {
            note.setInsertUserName(userName);
        }
    });
    // Populate user names
    notes.forEach(note -> {
        if (note.getInsertUserName() == null) {
            String userName = stakeholderIdToNameMap.get(note.getInsertUser());
            if (userName != null) {
                note.setInsertUserName(userName);
            }
        }
    });
}
```

added the method resetPassword to UserServiceImpl
```
@Override
public void resetPassword(PasswordResetRequest request) {
    String formattedMobile = MobileNumberValidator.formatIndianMobile(request.getMobile());
    if (formattedMobile == null) {
        throw new ValidationException("Invalid mobile number format");
    }
    
    User user = userRepository.findByMobileAndActiveFlag(formattedMobile, true)
            .orElseThrow(() -> new ResourceNotFoundException("User", formattedMobile));
    
    // Verify OTP
    verifyOTP(user.getRecCode(), request.getOtp());
    
    // Update password
    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    user.clearOTP();
    user.setUpdateDate(LocalDateTime.now());
    userRepository.save(user);
}
```
commented 3 lines in method verifyOTP of UserServiceImpl
// Clear OTP after successful verification
// user.clearOTP();
// userRepository.save(user);

** 2025.08.25 **
updated notificationSettings.service.js updateMySettings function
// const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.MY_SETTINGS_TYPE(settingsId), settingsData)
// HITS 2025.08.25
const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.BY_ID(settingsId), settingsData)

// HITS 20250825
// AuditorAwareImpl.java
// Return the custom user principal
// and return recCode to be inserted in the InsertUser, UpdateUser fields
// System.out.println("PRINCIPAL: " + userPrincipal.getId());
// System.out.println("DETAILS: " + authentication.getDetails());
// return Optional.of(authentication.getName());            
CustomUserPrincipal userPrincipal = (CustomUserPrincipal) authentication.getPrincipal();
return Optional.of(userPrincipal.getId());

** 2025.08.27 **
// FirebaseNotificationServiceImpl.java
// Method sendPushNotificationToStakeholder
// Get active device tokens for stakeholder
// 20250827 changed the NotificationEnums.SubscriberType.Stakeholder to User
// Important change - As all data is going in deviceTokens as User only
List<DeviceTokens> deviceTokens = deviceTokensRepository
.findByOwnerTypeAndOwnerIdAndIsActiveAndActiveFlag(NotificationEnums.SubscriberType.User, stakeholderId, true, true);

// Added the "/api/v1/stakeholder/check-email", "/api/v1/stakeholder/check-phone"
// to the SecurityConfig.java and JwtAuthenticationFilter.java public endpoints (No authenticaton)

// In CustomerInfoController, DeviceTokensController, NotificationQueueController, NotificationSettingsController, NotificationTemplatesController, DeviceTokensServiceImpl
// Method getCurrentUserId
// Changed getName to getId
CustomUserPrincipal userPrincipal = (CustomUserPrincipal) authentication.getPrincipal();
return userPrincipal.getId();
// HITS 20250827
// return authentication.getName();

// NotificationQueueServiceImpl
// Changed everywhere to comment parameter of RecipientType (not required and RecCode is Unique)
// e.g.
Page<NotificationQueue> notifications = notificationQueueRepository
.findByRecipientIdAndActiveFlag(
    // HITS 20250827 changed in repository and now in service removed recipientType parameter
    // NotificationEnums.SubscriberType.User, 
    currentUserId, 
    true, 
    pageable
);
// OR JPA where it was Originally findByRecipientTypeRecipientIdAndIsReadAndActiveFlag(String recipientType, String recipientId, Boolean isRead, Boolean activeFlag);
List<NotificationQueue> findByRecipientIdAndIsReadAndActiveFlag(String recipientId, Boolean isRead, Boolean activeFlag);