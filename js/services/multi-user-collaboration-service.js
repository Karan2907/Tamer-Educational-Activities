/**
 * Multi-User Collaboration Service
 * 
 * This service handles multi-user collaboration features allowing users to work together
 * on educational activities with view-only and edit roles.
 */

class MultiUserCollaborationService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.activeSessions = new Map(); // Active collaboration sessions
        this.userConnections = new Map(); // User connections in sessions
        this.sessionSubscriptions = new Map(); // Real-time subscriptions
        this.userPermissions = new Map(); // User permissions in sessions
        this.presenceTracking = new Map(); // Track user presence
        this.messageQueues = new Map(); // Message queues for offline users
        this.editConflicts = new Map(); // Track edit conflicts
    }
    
    /**
     * Initialize the collaboration service
     */
    initialize() {
        console.log('Multi-user collaboration service initialized');
        
        // Set up real-time presence tracking
        this.setupPresenceTracking();
        
        // Set up message handling
        this.setupMessageHandling();
    }
    
    /**
     * Create a new collaboration session
     */
    async createSession(sessionId, hostUserId, activityData, options = {}) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to create a session');
        }
        
        try {
            const {
                name = 'Collaboration Session',
                description = '',
                maxParticipants = 10,
                allowGuests = false,
                requireApproval = false
            } = options;
            
            // Validate that the current user is the host
            const currentUser = this.firebaseService.getCurrentUser();
            if (currentUser.uid !== hostUserId) {
                throw new Error('Only the host can create a session');
            }
            
            // Create session document
            const sessionData = {
                id: sessionId,
                name,
                description,
                hostUserId,
                activityData,
                maxParticipants,
                allowGuests,
                requireApproval,
                participants: {
                    [hostUserId]: {
                        userId: hostUserId,
                        role: 'editor', // Host has editor role
                        joinedAt: new Date(),
                        status: 'online',
                        permissions: ['view', 'edit', 'manage']
                    }
                },
                createdAt: new Date(),
                isActive: true,
                settings: {
                    syncFrequency: 2000, // Sync every 2 seconds
                    conflictResolution: 'last_write_wins', // Or 'merge'
                    versionControl: true
                }
            };
            
            // Save session to Firestore
            const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(sessionId);
            await sessionRef.set(sessionData);
            
            // Initialize the session locally
            this.activeSessions.set(sessionId, sessionData);
            
            console.log(`Collaboration session created: ${sessionId}`);
            
            return {
                success: true,
                sessionId,
                sessionData,
                message: 'Session created successfully'
            };
        } catch (error) {
            console.error('Error creating collaboration session:', error);
            throw error;
        }
    }
    
    /**
     * Join a collaboration session
     */
    async joinSession(sessionId, userId, role = 'viewer') {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to join a session');
        }
        
        try {
            // Validate role
            if (!['viewer', 'editor', 'commenter'].includes(role)) {
                throw new Error('Invalid role. Use "viewer", "editor", or "commenter"');
            }
            
            // Get session data
            const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(sessionId);
            const sessionDoc = await sessionRef.get();
            
            if (!sessionDoc.exists) {
                throw new Error('Session not found');
            }
            
            const sessionData = sessionDoc.data();
            
            // Check if session is active
            if (!sessionData.isActive) {
                throw new Error('Session is not active');
            }
            
            // Check if session is full
            const participantCount = Object.keys(sessionData.participants || {}).length;
            if (participantCount >= sessionData.maxParticipants) {
                throw new Error('Session is at maximum capacity');
            }
            
            // Check if user is already in session
            if (sessionData.participants && sessionData.participants[userId]) {
                throw new Error('User is already in this session');
            }
            
            // Add user to session
            const userParticipantData = {
                userId,
                role,
                joinedAt: new Date(),
                status: 'online',
                permissions: this.getPermissionsForRole(role)
            };
            
            // Update session with new participant
            await sessionRef.update({
                [`participants.${userId}`]: userParticipantData
            });
            
            // Update local session cache
            if (!this.activeSessions.has(sessionId)) {
                this.activeSessions.set(sessionId, sessionData);
            }
            
            const updatedSession = {
                ...sessionData,
                participants: {
                    ...sessionData.participants,
                    [userId]: userParticipantData
                }
            };
            
            this.activeSessions.set(sessionId, updatedSession);
            
            // Set up user connection
            this.userConnections.set(`${sessionId}_${userId}`, {
                sessionId,
                userId,
                role,
                connectedAt: new Date()
            });
            
            // Notify other participants
            await this.broadcastMessage(sessionId, {
                type: 'user_joined',
                userId,
                username: await this.getUsername(userId),
                role,
                timestamp: new Date()
            }, [userId]); // Don't send to the joining user themselves
            
            console.log(`User ${userId} joined session ${sessionId} as ${role}`);
            
            return {
                success: true,
                sessionId,
                role,
                permissions: userParticipantData.permissions,
                message: `Joined session as ${role}`
            };
        } catch (error) {
            console.error('Error joining collaboration session:', error);
            throw error;
        }
    }
    
    /**
     * Leave a collaboration session
     */
    async leaveSession(sessionId, userId) {
        try {
            // Remove user from session participants
            const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(sessionId);
            
            // Remove the specific user from participants
            await sessionRef.update({
                [`participants.${userId}`]: this.firebaseService.firestore.FieldValue.delete()
            });
            
            // Remove local connection
            this.userConnections.delete(`${sessionId}_${userId}`);
            
            // Remove from permissions cache
            this.userPermissions.delete(`${sessionId}_${userId}`);
            
            // Notify other participants
            await this.broadcastMessage(sessionId, {
                type: 'user_left',
                userId,
                timestamp: new Date()
            }, [userId]); // Don't send to the leaving user
            
            console.log(`User ${userId} left session ${sessionId}`);
            
            return {
                success: true,
                message: 'Successfully left session'
            };
        } catch (error) {
            console.error('Error leaving collaboration session:', error);
            throw error;
        }
    }
    
    /**
     * Get permissions for a specific role
     */
    getPermissionsForRole(role) {
        const rolePermissions = {
            viewer: ['view'],
            commenter: ['view', 'comment'],
            editor: ['view', 'edit', 'comment', 'manage']
        };
        
        return rolePermissions[role] || ['view'];
    }
    
    /**
     * Send a message to all participants in a session
     */
    async broadcastMessage(sessionId, message, excludeUsers = []) {
        try {
            // Add message to session chat
            const chatRef = this.firebaseService.firestore.collection('collaboration_sessions')
                .doc(sessionId)
                .collection('chat')
                .doc();
            
            const messageData = {
                ...message,
                id: chatRef.id,
                timestamp: new Date()
            };
            
            await chatRef.set(messageData);
            
            // Also broadcast via real-time mechanisms if needed
            // In a real implementation, this would use WebSockets or similar
            
            console.log(`Message broadcast to session ${sessionId}:`, message.type);
            
            return {
                success: true,
                messageId: chatRef.id,
                message: messageData
            };
        } catch (error) {
            console.error('Error broadcasting message:', error);
            throw error;
        }
    }
    
    /**
     * Send a direct message to specific users in a session
     */
    async sendMessage(sessionId, senderUserId, recipientUserIds, messageContent) {
        try {
            // Validate that sender is in the session
            const session = await this.getSession(sessionId);
            if (!session.participants[senderUserId]) {
                throw new Error('Sender is not a participant in this session');
            }
            
            // Create message document
            const messageRef = this.firebaseService.firestore.collection('collaboration_sessions')
                .doc(sessionId)
                .collection('messages')
                .doc();
            
            const messageData = {
                id: messageRef.id,
                senderUserId,
                recipientUserIds,
                content: messageContent,
                timestamp: new Date(),
                readBy: [senderUserId] // Sender marks as read
            };
            
            await messageRef.set(messageData);
            
            // Notify recipients
            for (const recipientId of recipientUserIds) {
                if (!excludeUsers.includes(recipientId)) {
                    // In a real implementation, this would push to the recipient's notification system
                    console.log(`Message sent to user ${recipientId}`);
                }
            }
            
            return {
                success: true,
                messageId: messageRef.id,
                message: messageData
            };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
    
    /**
     * Update activity data during collaboration
     */
    async updateActivityData(sessionId, userId, updateData, options = {}) {
        try {
            // Check user permissions
            const hasPermission = await this.checkPermission(sessionId, userId, 'edit');
            if (!hasPermission) {
                throw new Error('User does not have permission to edit activity data');
            }
            
            const { 
                mergeStrategy = 'replace', // 'replace', 'merge', 'deep_merge'
                versionCheck = true
            } = options;
            
            // Get current session data
            const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(sessionId);
            const sessionDoc = await sessionRef.get();
            
            if (!sessionDoc.exists) {
                throw new Error('Session not found');
            }
            
            const sessionData = sessionDoc.data();
            
            // Check version if required
            if (versionCheck && updateData.version !== undefined) {
                const currentVersion = sessionData.activityData.version || 0;
                if (updateData.version < currentVersion) {
                    // Handle conflict
                    await this.handleEditConflict(sessionId, userId, updateData, sessionData.activityData);
                    return {
                        success: false,
                        conflict: true,
                        message: 'Version conflict detected, changes may need merging',
                        currentData: sessionData.activityData
                    };
                }
            }
            
            // Prepare update
            let updatedActivityData;
            
            switch (mergeStrategy) {
                case 'merge':
                    updatedActivityData = { ...sessionData.activityData, ...updateData };
                    break;
                case 'deep_merge':
                    updatedActivityData = this.deepMerge(sessionData.activityData, updateData);
                    break;
                case 'replace':
                default:
                    updatedActivityData = { ...sessionData.activityData, ...updateData };
                    break;
            }
            
            // Add version tracking
            updatedActivityData.version = (updatedActivityData.version || 0) + 1;
            updatedActivityData.lastModifiedBy = userId;
            updatedActivityData.lastModifiedAt = new Date();
            
            // Update session
            await sessionRef.update({
                activityData: updatedActivityData,
                updatedAt: new Date()
            });
            
            // Update local cache
            if (this.activeSessions.has(sessionId)) {
                const localSession = this.activeSessions.get(sessionId);
                this.activeSessions.set(sessionId, {
                    ...localSession,
                    activityData: updatedActivityData,
                    updatedAt: new Date()
                });
            }
            
            // Broadcast update to all participants
            await this.broadcastMessage(sessionId, {
                type: 'activity_updated',
                userId,
                updateData,
                version: updatedActivityData.version,
                timestamp: new Date()
            });
            
            console.log(`Activity data updated in session ${sessionId} by user ${userId}`);
            
            return {
                success: true,
                version: updatedActivityData.version,
                message: 'Activity data updated successfully'
            };
        } catch (error) {
            console.error('Error updating activity data:', error);
            throw error;
        }
    }
    
    /**
     * Handle edit conflicts
     */
    async handleEditConflict(sessionId, userId, updateData, currentData) {
        // Log conflict for resolution
        const conflictId = `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        const conflictData = {
            id: conflictId,
            sessionId,
            userId,
            updateData,
            currentData,
            detectedAt: new Date(),
            resolved: false
        };
        
        // Store conflict
        const conflictRef = this.firebaseService.firestore.collection('collaboration_conflicts').doc(conflictId);
        await conflictRef.set(conflictData);
        
        // Add to conflict tracking
        if (!this.editConflicts.has(sessionId)) {
            this.editConflicts.set(sessionId, []);
        }
        this.editConflicts.get(sessionId).push(conflictData);
        
        // Notify session participants about conflict
        await this.broadcastMessage(sessionId, {
            type: 'edit_conflict_detected',
            conflictId,
            userId,
            timestamp: new Date()
        });
        
        console.warn(`Edit conflict detected in session ${sessionId} for user ${userId}`);
    }
    
    /**
     * Resolve an edit conflict
     */
    async resolveConflict(conflictId, resolutionData) {
        try {
            const conflictRef = this.firebaseService.firestore.collection('collaboration_conflicts').doc(conflictId);
            const conflictDoc = await conflictRef.get();
            
            if (!conflictDoc.exists) {
                throw new Error('Conflict not found');
            }
            
            const conflict = conflictDoc.data();
            
            // Update conflict with resolution
            await conflictRef.update({
                resolved: true,
                resolutionData,
                resolvedAt: new Date(),
                resolvedBy: resolutionData.resolvedBy
            });
            
            // Remove from local tracking
            if (this.editConflicts.has(conflict.sessionId)) {
                const conflicts = this.editConflicts.get(conflict.sessionId);
                const index = conflicts.findIndex(c => c.id === conflictId);
                if (index !== -1) {
                    conflicts.splice(index, 1);
                }
            }
            
            // Apply resolution to session if needed
            if (resolutionData.applyToSession) {
                await this.updateActivityData(
                    conflict.sessionId, 
                    resolutionData.resolvedBy, 
                    resolutionData.resolvedUpdate, 
                    { mergeStrategy: 'merge' }
                );
            }
            
            console.log(`Conflict ${conflictId} resolved`);
            
            return {
                success: true,
                message: 'Conflict resolved successfully'
            };
        } catch (error) {
            console.error('Error resolving conflict:', error);
            throw error;
        }
    }
    
    /**
     * Get session details
     */
    async getSession(sessionId) {
        try {
            // Check cache first
            if (this.activeSessions.has(sessionId)) {
                return this.activeSessions.get(sessionId);
            }
            
            // Get from Firestore
            const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(sessionId);
            const sessionDoc = await sessionRef.get();
            
            if (!sessionDoc.exists) {
                throw new Error('Session not found');
            }
            
            const sessionData = sessionDoc.data();
            
            // Cache the session
            this.activeSessions.set(sessionId, sessionData);
            
            return sessionData;
        } catch (error) {
            console.error('Error getting session:', error);
            throw error;
        }
    }
    
    /**
     * Get all sessions a user participates in
     */
    async getUserSessions(userId) {
        try {
            // Query for sessions where user is a participant
            const sessionsSnapshot = await this.firebaseService.firestore
                .collection('collaboration_sessions')
                .where('isActive', '==', true)
                .get();
            
            const userSessions = [];
            
            sessionsSnapshot.forEach(doc => {
                const sessionData = doc.data();
                if (sessionData.participants && sessionData.participants[userId]) {
                    userSessions.push({
                        id: sessionData.id,
                        name: sessionData.name,
                        description: sessionData.description,
                        role: sessionData.participants[userId].role,
                        joinedAt: sessionData.participants[userId].joinedAt,
                        participantCount: Object.keys(sessionData.participants).length,
                        createdAt: sessionData.createdAt
                    });
                }
            });
            
            return userSessions;
        } catch (error) {
            console.error('Error getting user sessions:', error);
            throw error;
        }
    }
    
    /**
     * Get session participants
     */
    async getSessionParticipants(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            const participants = session.participants || {};
            
            const participantList = [];
            for (const [userId, participantData] of Object.entries(participants)) {
                participantList.push({
                    userId,
                    username: await this.getUsername(userId),
                    role: participantData.role,
                    joinedAt: participantData.joinedAt,
                    status: participantData.status,
                    permissions: participantData.permissions
                });
            }
            
            return participantList;
        } catch (error) {
            console.error('Error getting session participants:', error);
            throw error;
        }
    }
    
    /**
     * Get username by user ID
     */
    async getUsername(userId) {
        try {
            const userRef = this.firebaseService.firestore.collection('users').doc(userId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                return userDoc.data().displayName || userDoc.data().email || userId;
            }
            
            return userId; // Fallback to ID if no display name found
        } catch (error) {
            console.error('Error getting username:', error);
            return userId;
        }
    }
    
    /**
     * Check if user has specific permission in session
     */
    async checkPermission(sessionId, userId, permission) {
        try {
            // Check local cache first
            const cacheKey = `${sessionId}_${userId}`;
            if (this.userPermissions.has(cacheKey)) {
                return this.userPermissions.get(cacheKey).includes(permission);
            }
            
            // Get session data
            const session = await this.getSession(sessionId);
            const userParticipant = session.participants[userId];
            
            if (!userParticipant) {
                return false;
            }
            
            const hasPermission = userParticipant.permissions.includes(permission);
            
            // Cache the permissions
            this.userPermissions.set(cacheKey, userParticipant.permissions);
            
            return hasPermission;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }
    
    /**
     * Change user role in session
     */
    async changeUserRole(sessionId, changingUserId, targetUserId, newRole) {
        try {
            // Check if changing user has manage permission
            const hasManagePermission = await this.checkPermission(sessionId, changingUserId, 'manage');
            if (!hasManagePermission) {
                throw new Error('User does not have permission to change roles');
            }
            
            // Validate new role
            if (!['viewer', 'commenter', 'editor'].includes(newRole)) {
                throw new Error('Invalid role');
            }
            
            // Update user role in session
            const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(sessionId);
            await sessionRef.update({
                [`participants.${targetUserId}.role`]: newRole,
                [`participants.${targetUserId}.permissions`]: this.getPermissionsForRole(newRole)
            });
            
            // Update local cache
            if (this.activeSessions.has(sessionId)) {
                const session = this.activeSessions.get(sessionId);
                if (session.participants[targetUserId]) {
                    session.participants[targetUserId].role = newRole;
                    session.participants[targetUserId].permissions = this.getPermissionsForRole(newRole);
                    this.userPermissions.set(`${sessionId}_${targetUserId}`, session.participants[targetUserId].permissions);
                }
            }
            
            // Notify participants
            await this.broadcastMessage(sessionId, {
                type: 'role_changed',
                changingUserId,
                targetUserId,
                newRole,
                timestamp: new Date()
            });
            
            console.log(`Role changed for user ${targetUserId} to ${newRole} in session ${sessionId}`);
            
            return {
                success: true,
                message: `Role changed to ${newRole}`
            };
        } catch (error) {
            console.error('Error changing user role:', error);
            throw error;
        }
    }
    
    /**
     * Kick user from session
     */
    async kickUser(sessionId, kickingUserId, targetUserId) {
        try {
            // Check if kicking user has manage permission
            const hasManagePermission = await this.checkPermission(sessionId, kickingUserId, 'manage');
            if (!hasManagePermission) {
                throw new Error('User does not have permission to kick users');
            }
            
            // Remove user from session
            await this.leaveSession(sessionId, targetUserId);
            
            // Notify participants
            await this.broadcastMessage(sessionId, {
                type: 'user_kicked',
                kickingUserId,
                targetUserId,
                timestamp: new Date()
            });
            
            console.log(`User ${targetUserId} kicked from session ${sessionId}`);
            
            return {
                success: true,
                message: 'User kicked from session'
            };
        } catch (error) {
            console.error('Error kicking user:', error);
            throw error;
        }
    }
    
    /**
     * End a collaboration session
     */
    async endSession(sessionId, userId) {
        try {
            // Verify user is the host or has manage permission
            const session = await this.getSession(sessionId);
            if (session.hostUserId !== userId) {
                const hasManagePermission = await this.checkPermission(sessionId, userId, 'manage');
                if (!hasManagePermission) {
                    throw new Error('Only host or managers can end session');
                }
            }
            
            // Update session as inactive
            const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(sessionId);
            await sessionRef.update({
                isActive: false,
                endedAt: new Date(),
                endedBy: userId
            });
            
            // Remove from local cache
            this.activeSessions.delete(sessionId);
            
            // Notify all participants
            await this.broadcastMessage(sessionId, {
                type: 'session_ended',
                endedBy: userId,
                timestamp: new Date()
            });
            
            // Clean up connections
            for (const [connKey, connData] of this.userConnections.entries()) {
                if (connData.sessionId === sessionId) {
                    this.userConnections.delete(connKey);
                }
            }
            
            console.log(`Session ${sessionId} ended by user ${userId}`);
            
            return {
                success: true,
                message: 'Session ended successfully'
            };
        } catch (error) {
            console.error('Error ending session:', error);
            throw error;
        }
    }
    
    /**
     * Get session chat history
     */
    async getSessionChat(sessionId, options = {}) {
        try {
            const {
                limit = 50,
                orderBy = 'timestamp',
                direction = 'desc'
            } = options;
            
            const chatSnapshot = await this.firebaseService.firestore
                .collection('collaboration_sessions')
                .doc(sessionId)
                .collection('chat')
                .orderBy(orderBy, direction)
                .limit(limit)
                .get();
            
            const messages = [];
            chatSnapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Reverse if ascending order was requested
            if (direction === 'asc') {
                messages.reverse();
            }
            
            return messages;
        } catch (error) {
            console.error('Error getting session chat:', error);
            throw error;
        }
    }
    
    /**
     * Get user's unread messages in a session
     */
    async getUserUnreadMessages(sessionId, userId) {
        try {
            // In a real implementation, this would track read receipts
            // For now, we'll return all messages as unread
            
            const messages = await this.getSessionChat(sessionId, { limit: 100 });
            
            // Filter to show only messages after user's last seen timestamp
            // This would require storing lastSeen timestamps per user per session
            
            return messages;
        } catch (error) {
            console.error('Error getting unread messages:', error);
            throw error;
        }
    }
    
    /**
     * Mark messages as read
     */
    async markMessagesAsRead(sessionId, userId, messageIds) {
        try {
            // In a real implementation, this would update read status in Firestore
            // For now, we'll just log the action
            
            console.log(`User ${userId} marked messages as read in session ${sessionId}`);
            
            return {
                success: true,
                message: 'Messages marked as read'
            };
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }
    
    /**
     * Set up real-time presence tracking
     */
    setupPresenceTracking() {
        // In a real implementation, this would use Firestore's real-time capabilities
        // or a real-time database to track user presence
        
        // For now, we'll just log that presence tracking is set up
        console.log('Presence tracking initialized');
    }
    
    /**
     * Set up message handling
     */
    setupMessageHandling() {
        // In a real implementation, this would set up WebSocket or similar
        // real-time communication channels
        
        // For now, we'll just log that message handling is set up
        console.log('Message handling initialized');
    }
    
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const output = { ...target };
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }
    
    /**
     * Check if value is an object
     */
    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
    }
    
    /**
     * Get active sessions count
     */
    getActiveSessionCount() {
        return this.activeSessions.size;
    }
    
    /**
     * Get user's connection status in a session
     */
    getUserConnectionStatus(sessionId, userId) {
        const connKey = `${sessionId}_${userId}`;
        return this.userConnections.has(connKey) ? 
            this.userConnections.get(connKey) : null;
    }
    
    /**
     * Get all conflicts for a session
     */
    getSessionConflicts(sessionId) {
        return this.editConflicts.get(sessionId) || [];
    }
    
    /**
     * Get collaboration statistics
     */
    async getCollaborationStats(userId) {
        try {
            // Get user's collaboration stats
            const sessions = await this.getUserSessions(userId);
            
            const stats = {
                totalSessions: sessions.length,
                activeSessions: sessions.filter(s => s.isActive).length,
                sessionsCreatedByUser: sessions.filter(s => s.hostUserId === userId).length,
                totalCollaborationTime: 0, // Would need time tracking
                messagesSent: 0, // Would need to query messages
                editsMade: 0 // Would need to track edits
            };
            
            return stats;
        } catch (error) {
            console.error('Error getting collaboration stats:', error);
            throw error;
        }
    }
    
    /**
     * Cleanup the collaboration service
     */
    cleanup() {
        // Clear all caches
        this.activeSessions.clear();
        this.userConnections.clear();
        this.sessionSubscriptions.clear();
        this.userPermissions.clear();
        this.presenceTracking.clear();
        this.messageQueues.clear();
        this.editConflicts.clear();
        
        console.log('Collaboration service cleaned up');
    }
    
    /**
     * Export collaboration session data
     */
    async exportSessionData(sessionId) {
        try {
            const session = await this.getSession(sessionId);
            
            // Get chat history
            const chat = await this.getSessionChat(sessionId);
            
            // Get all participants
            const participants = await this.getSessionParticipants(sessionId);
            
            // Structure export data
            const exportData = {
                session: {
                    ...session,
                    participants: participants
                },
                chat: chat,
                exportedAt: new Date(),
                exportedBy: this.firebaseService.getCurrentUser().uid
            };
            
            return {
                success: true,
                data: exportData,
                filename: `collaboration-session-${sessionId}-${Date.now()}.json`
            };
        } catch (error) {
            console.error('Error exporting session data:', error);
            throw error;
        }
    }
    
    /**
     * Import collaboration session data
     */
    async importSessionData(sessionData, options = {}) {
        try {
            const {
                createNewSession = true,
                mapUsers = true,
                preserveHistory = true
            } = options;
            
            if (createNewSession) {
                // Create a new session with imported data
                const newSessionId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                
                // Clean up the data for new session
                const cleanSessionData = {
                    ...sessionData.session,
                    id: newSessionId,
                    hostUserId: this.firebaseService.getCurrentUser().uid,
                    participants: {
                        [this.firebaseService.getCurrentUser().uid]: {
                            userId: this.firebaseService.getCurrentUser().uid,
                            role: 'editor',
                            joinedAt: new Date(),
                            status: 'online',
                            permissions: this.getPermissionsForRole('editor')
                        }
                    },
                    createdAt: new Date(),
                    isActive: true
                };
                
                // Save to Firestore
                const sessionRef = this.firebaseService.firestore.collection('collaboration_sessions').doc(newSessionId);
                await sessionRef.set(cleanSessionData);
                
                // If preserving history, import chat messages
                if (preserveHistory && sessionData.chat) {
                    for (const message of sessionData.chat) {
                        const msgRef = this.firebaseService.firestore.collection('collaboration_sessions')
                            .doc(newSessionId)
                            .collection('chat')
                            .doc();
                        await msgRef.set(message);
                    }
                }
                
                return {
                    success: true,
                    sessionId: newSessionId,
                    message: 'Session imported successfully'
                };
            }
            
            return {
                success: false,
                message: 'Import without creating new session not implemented'
            };
        } catch (error) {
            console.error('Error importing session data:', error);
            throw error;
        }
    }
}

// Export the service
export default MultiUserCollaborationService;