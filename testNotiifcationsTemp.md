-- Testing and Migration Guidelines

-- =============================================
-- 1. DATABASE VERIFICATION QUERIES
-- =============================================

-- Check current notification data structure
SELECT 
    NotificationChannel,
    SourceId,
    RecipientId,
    NotificationTitle,
    COUNT(*) as count,
    COUNT(CASE WHEN IsRead = 1 THEN 1 END) as read_count,
    COUNT(CASE WHEN IsRead = 0 THEN 1 END) as unread_count
FROM NotificationQueue 
WHERE ActiveFlag = 1
GROUP BY NotificationChannel, SourceId, RecipientId, NotificationTitle
HAVING COUNT(*) > 1  -- Show only duplicates
ORDER BY count DESC;

-- Verify related notifications (same sourceId, recipientId, title)
SELECT 
    SourceId,
    RecipientId, 
    NotificationTitle,
    GROUP_CONCAT(CONCAT(NotificationChannel, '(', CASE WHEN IsRead=1 THEN 'R' ELSE 'U' END, ')')) as channels_status,
    COUNT(*) as notification_count
FROM NotificationQueue 
WHERE ActiveFlag = 1 
    AND SourceId = '2de0d8ce-83d9-11f0-baa0-19a6f6dc6e8f'  -- Replace with actual sourceId
GROUP BY SourceId, RecipientId, NotificationTitle;

-- =============================================
-- 2. TEST BACKEND ENDPOINTS
-- =============================================

-- Test cases for API endpoints (use with Postman/curl):

/*
A. User Endpoints with Channel Filtering:

1. Get InApp notifications only (default web behavior):
   GET /api/v1/notifications/queue/my-notifications?channels=InApp

2. Get multiple channels:
   GET /api/v1/notifications/queue/my-notifications?channels=InApp,Push

3. Get unread count for InApp only:
   GET /api/v1/notifications/queue/my-notifications/unread-count?channels=InApp

4. Mark notification as read (affects all related channels):
   PUT /api/v1/notifications/queue/{notificationId}/mark-read

5. Mark notification as read for specific channels only:
   PUT /api/v1/notifications/queue/{notificationId}/mark-read?channels=InApp,Push

6. Mark all InApp notifications as read:
   PUT /api/v1/notifications/queue/mark-all-read?channels=InApp

B. Admin Endpoints:

1. Get all notifications with channel filtering:
   GET /api/v1/notifications/queue?channels=InApp,Push

2. Search with channel filtering:
   GET /api/v1/notifications/queue/search?searchTerm=test&channels=InApp

3. Get user notifications with channel filtering:
   GET /api/v1/notifications/queue/user/{userId}?channels=InApp,Push
*/

-- =============================================
-- 3. VALIDATE BULK READ OPERATIONS
-- =============================================

-- Before marking as read - check related notifications
SELECT 
    RecCode,
    NotificationChannel,
    IsRead,
    ReadTime,
    NotificationTitle
FROM NotificationQueue 
WHERE SourceId = 'your-source-id'
    AND RecipientId = 'your-recipient-id' 
    AND NotificationTitle = 'your-notification-title'
    AND ActiveFlag = 1;

-- After calling markAsRead API - verify all related notifications are marked as read
-- (Run the same query above and confirm IsRead = 1 and ReadTime is populated for all)

-- =============================================
-- 4. FRONTEND TESTING SCENARIOS
-- =============================================

/*
Frontend Test Cases:

1. Web Interface Display:
   - Load notification dropdown
   - Verify only InApp notifications are shown
   - Confirm no duplicate notifications appear

2. Mark as Read Functionality:
   - Click "Mark as read" on an InApp notification
   - Verify both InApp and Push versions are marked as read in database
   - Confirm notification disappears from unread list

3. Mark All as Read:
   - Click "Mark all as read"
   - Verify only InApp notifications are marked as read in the web interface
   - Verify unread count becomes 0 for InApp notifications

4. Auto-refresh:
   - Leave the page open for 30 seconds
   - Verify auto-refresh only loads InApp notifications

5. Real-time Updates:
   - Create new notifications with both InApp and Push channels
   - Verify web interface shows only the InApp version
   - Verify Firebase handles Push notifications separately
*/

-- =============================================
-- 5. MIGRATION VALIDATION
-- =============================================

-- Check for any orphaned notifications
SELECT 
    RecCode,
    SourceId,
    RecipientId,
    NotificationChannel,
    NotificationTitle,
    IsRead
FROM NotificationQueue
WHERE ActiveFlag = 1
    AND SourceId IS NULL 
    OR RecipientId IS NULL 
    OR NotificationTitle IS NULL;

-- Verify channel enum values are valid
SELECT DISTINCT NotificationChannel, COUNT(*) 
FROM NotificationQueue 
WHERE ActiveFlag = 1
GROUP BY NotificationChannel;

-- Check for any malformed data
SELECT 
    RecCode,
    NotificationChannel,
    SourceType,
    RecipientType,
    NotificationTitle
FROM NotificationQueue
WHERE ActiveFlag = 1
    AND (
        NotificationChannel NOT IN ('InApp', 'Push', 'Email', 'SMS')
        OR SourceType IS NULL
        OR RecipientType IS NULL
        OR NotificationTitle = ''
        OR LENGTH(NotificationTitle) > 200
    );

-- =============================================
-- 6. PERFORMANCE TESTING QUERIES
-- =============================================

-- Test channel filtering performance
EXPLAIN SELECT nq.* 
FROM NotificationQueue nq 
WHERE nq.NotificationChannel IN ('InApp', 'Push') 
    AND nq.RecipientId = 'test-user-id' 
    AND nq.ActiveFlag = 1 
ORDER BY nq.InsertDate DESC;

-- Verify indexes are being used for channel queries
SHOW INDEX FROM NotificationQueue;

-- Test bulk update performance (simulate mark all as read)
SELECT COUNT(*) FROM NotificationQueue 
WHERE RecipientId = 'test-user-id' 
    AND NotificationChannel IN ('InApp') 
    AND IsRead = 0 
    AND ActiveFlag = 1;

-- =============================================
-- 7. ROLLBACK PLAN
-- =============================================

/*
If issues are found during testing:

1. Backend Rollback:
   - Comment out channel parameter in controller methods
   - Use existing service methods without channel filtering
   - Ensure backward compatibility is maintained

2. Frontend Rollback:
   - Remove channels parameter from API calls
   - Revert to original notification service methods
   - Update store to use original API calls

3. Database Rollback:
   - No schema changes were made, so no database rollback needed
   - Data integrity remains intact

4. Gradual Migration:
   - Deploy backend changes first
   - Test admin endpoints with channel filtering
   - Deploy frontend changes to staging first
   - Monitor for any duplicate notification issues
*/

-- =============================================
-- 8. MONITORING QUERIES (Post-Deployment)
-- =============================================

-- Monitor notification creation patterns
SELECT 
    DATE(InsertDate) as date,
    NotificationChannel,
    SourceType,
    COUNT(*) as notifications_created,
    COUNT(CASE WHEN IsRead = 1 THEN 1 END) as read_count
FROM NotificationQueue 
WHERE ActiveFlag = 1 
    AND InsertDate >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(InsertDate), NotificationChannel, SourceType
ORDER BY date DESC, NotificationChannel;

-- Monitor bulk read operations
SELECT 
    DATE(ReadTime) as read_date,
    COUNT(*) as notifications_marked_read,
    COUNT(DISTINCT SourceId) as unique_sources,
    COUNT(DISTINCT RecipientId) as unique_recipients
FROM NotificationQueue 
WHERE ReadTime >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    AND ActiveFlag = 1
GROUP BY DATE(ReadTime)
ORDER BY read_date DESC;

-- Check for any unprocessed notifications
SELECT 
    NotificationChannel,
    Status,
    COUNT(*) as count,
    AVG(TIMESTAMPDIFF(MINUTE, InsertDate, NOW())) as avg_age_minutes
FROM NotificationQueue 
WHERE Status = 'Pending'
    AND ActiveFlag = 1
GROUP BY NotificationChannel, Status;

-- =============================================
-- 9. SUCCESS CRITERIA VERIFICATION
-- =============================================

-- Verify web interface shows only InApp notifications
-- Run this query and confirm web API calls return only InApp results
SELECT COUNT(*) as inapp_notifications
FROM NotificationQueue 
WHERE NotificationChannel = 'InApp' 
    AND RecipientId = 'test-user-id'
    AND ActiveFlag = 1;

-- Verify bulk read operations work correctly
-- Create test notifications, mark one as read, verify related ones are also marked
-- Test data for validation (create related notifications)
INSERT INTO NotificationQueue (
    RecCode, SourceType, SourceId, RecipientType, RecipientId, 
    NotificationChannel, NotificationTitle, NotificationContent,
    InsertUser, InsertDate, ActiveFlag
) VALUES 
(UUID(), 'NodeUpdate', 'test-source-123', 'User', 'test-user-id', 'InApp', 'Test Notification', 'Test content for InApp', 'SYSTEM', NOW(), 1),
(UUID(), 'NodeUpdate', 'test-source-123', 'User', 'test-user-id', 'Push', 'Test Notification', 'Test content for Push', 'SYSTEM', NOW(), 1);

-- After running mark as read API call, verify both are marked as read:
SELECT 
    NotificationChannel,
    IsRead,
    ReadTime,
    NotificationTitle
FROM NotificationQueue 
WHERE SourceId = 'test-source-123' 
    AND RecipientId = 'test-user-id' 
    AND NotificationTitle = 'Test Notification'
    AND ActiveFlag = 1;

-- Clean up test data
DELETE FROM NotificationQueue WHERE SourceId = 'test-source-123' AND InsertUser = 'SYSTEM';

-- =============================================
-- 10. DEPLOYMENT CHECKLIST
-- =============================================

/*
PRE-DEPLOYMENT:
□ Run all validation queries above
□ Backup current notification data
□ Test all API endpoints in staging environment
□ Verify frontend shows only InApp notifications
□ Test bulk read operations work correctly
□ Confirm no performance degradation

DEPLOYMENT ORDER:
1. Deploy backend changes first (repository, service, controller)
2. Test admin endpoints manually
3. Deploy frontend changes (service, store updates)
4. Test web interface functionality
5. Monitor notification creation and read patterns

POST-DEPLOYMENT MONITORING:
□ Check error logs for any channel-related errors
□ Monitor notification creation patterns
□ Verify web interface shows no duplicate notifications
□ Test mark-as-read functionality across channels
□ Monitor database query performance
□ Check Firebase push notifications still work

ROLLBACK CRITERIA:
- If duplicate notifications appear in web interface
- If mark-as-read functionality fails
- If notification counts are incorrect
- If any API endpoints return errors
- If database performance degrades significantly
*/

-- =============================================
-- 11. EXAMPLE TEST SCENARIOS
-- =============================================

-- Scenario 1: New notification creation
-- When a new node note is created, verify it creates both InApp and Push notifications
SELECT 
    RecCode,
    NotificationChannel,
    NotificationTitle,
    InsertDate
FROM NotificationQueue 
WHERE SourceType = 'NodeUpdate' 
    AND SourceId = '2de0d8ce-83d9-11f0-baa0-19a6f6dc6e8f'
    AND ActiveFlag = 1
ORDER BY InsertDate DESC
LIMIT 10;

-- Scenario 2: Web interface filtering
-- Verify API returns only InApp notifications
-- Call: GET /api/v1/notifications/queue/my-notifications?channels=InApp
-- Expected: Only notifications with NotificationChannel = 'InApp'

-- Scenario 3: Bulk read operation
-- Mark one InApp notification as read, verify related Push notification is also marked
-- Before: Both InApp and Push notifications have IsRead = 0
-- Call: PUT /api/v1/notifications/queue/{inapp-notification-id}/mark-read
-- After: Both InApp and Push notifications have IsRead = 1

-- Scenario 4: Unread count accuracy
-- Verify unread count matches actual unread InApp notifications
SELECT COUNT(*) as actual_unread_inapp
FROM NotificationQueue 
WHERE RecipientId = 'your-user-id'
    AND NotificationChannel = 'InApp'
    AND IsRead = 0
    AND ActiveFlag = 1;
-- Compare with: GET /api/v1/notifications/queue/my-notifications/unread-count?channels=InApp

-- =============================================
-- 12. TROUBLESHOOTING GUIDE
-- =============================================

/*
ISSUE: Duplicate notifications in web interface
CAUSE: Frontend not filtering to InApp channel
FIX: Verify store.js uses channels='InApp' in all API calls
CHECK: Console logs for API requests without channels parameter

ISSUE: Mark as read not working for related notifications  
CAUSE: Bulk update query not finding related notifications
DEBUG: Check SourceId, RecipientId, NotificationTitle match exactly
FIX: Verify service method markRelatedNotificationsAsRead works

ISSUE: Unread count incorrect
CAUSE: Channel filtering not applied to count query
FIX: Verify getCurrentUserUnreadCount uses channel filtering
CHECK: Compare database count with API response

ISSUE: Performance degradation
CAUSE: Missing indexes on channel filtering
FIX: Verify indexes exist on (NotificationChannel, RecipientId, ActiveFlag)
OPTIMIZE: Consider composite indexes for common queries

ISSUE: API errors with channel parameter
CAUSE: Invalid channel values in request
FIX: Validate channel values against enum
DEBUG: Check controller parameter validation

ISSUE: Firebase push notifications not working
CAUSE: Channel filtering affecting push notification flow
FIX: Verify Push channel notifications still created in database
CHECK: Firebase service handles Push notifications independently
*/

-- Query to check system health after deployment
SELECT 
    'Notification Channels' as metric,
    NotificationChannel,
    COUNT(*) as count,
    COUNT(CASE WHEN IsRead = 0 THEN 1 END) as unread,
    AVG(TIMESTAMPDIFF(HOUR, InsertDate, NOW())) as avg_age_hours
FROM NotificationQueue 
WHERE ActiveFlag = 1 
    AND InsertDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY NotificationChannel

UNION ALL

SELECT 
    'Read Operations Today' as metric,
    'All Channels' as NotificationChannel,
    COUNT(*) as count,
    0 as unread,
    AVG(TIMESTAMPDIFF(MINUTE, InsertDate, ReadTime)) as avg_read_delay_minutes
FROM NotificationQueue 
WHERE ActiveFlag = 1 
    AND ReadTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)

ORDER BY metric, NotificationChannel;