/**
 * State Persistence Service
 * 
 * This service handles saving and restoring user progress, scores, and attempts
 * in Firestore to ensure data persists across sessions and page reloads.
 */

class StatePersistenceService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.cache = new Map(); // In-memory cache for recent data
        this.syncQueue = []; // Queue for pending sync operations
        this.isSyncing = false;
    }
    
    /**
     * Save user progress for an activity
     */
    async saveProgress(userId, activityId, progressData) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping progress save');
            return;
        }
        
        try {
            const progressRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('progress').doc(activityId);
            
            const saveData = {
                userId,
                activityId,
                ...progressData,
                updatedAt: this.firebaseService.firestore.FieldValue.serverTimestamp(),
                lastAccessed: new Date()
            };
            
            // Add to cache
            const cacheKey = `${userId}:${activityId}`;
            this.cache.set(cacheKey, saveData);
            
            // Save to Firestore
            await progressRef.set(saveData, { merge: true });
            
            console.log(`Progress saved for user ${userId}, activity ${activityId}`);
            return true;
        } catch (error) {
            console.error('Error saving progress:', error);
            // Add to sync queue for retry
            this.addToSyncQueue('save', userId, activityId, progressData);
            throw error;
        }
    }
    
    /**
     * Load user progress for an activity
     */
    async loadProgress(userId, activityId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping progress load');
            return null;
        }
        
        try {
            // Check cache first
            const cacheKey = `${userId}:${activityId}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const progressRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('progress').doc(activityId);
            
            const doc = await progressRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                // Add to cache
                this.cache.set(cacheKey, data);
                return data;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            return null;
        }
    }
    
    /**
     * Save quiz scores
     */
    async saveScores(userId, activityId, scoresData) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping scores save');
            return;
        }
        
        try {
            const scoresRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('scores').doc(activityId);
            
            const saveData = {
                userId,
                activityId,
                ...scoresData,
                updatedAt: this.firebaseService.firestore.FieldValue.serverTimestamp(),
                completedAt: new Date()
            };
            
            await scoresRef.set(saveData, { merge: true });
            
            console.log(`Scores saved for user ${userId}, activity ${activityId}`);
            return true;
        } catch (error) {
            console.error('Error saving scores:', error);
            // Add to sync queue for retry
            this.addToSyncQueue('saveScores', userId, activityId, scoresData);
            throw error;
        }
    }
    
    /**
     * Load quiz scores
     */
    async loadScores(userId, activityId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping scores load');
            return null;
        }
        
        try {
            const scoresRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('scores').doc(activityId);
            
            const doc = await scoresRef.get();
            
            if (doc.exists) {
                return doc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error loading scores:', error);
            return null;
        }
    }
    
    /**
     * Save attempt data
     */
    async saveAttempt(userId, activityId, attemptData) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping attempt save');
            return;
        }
        
        try {
            const attemptsRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('attempts').doc();
            
            const saveData = {
                userId,
                activityId,
                ...attemptData,
                createdAt: this.firebaseService.firestore.FieldValue.serverTimestamp(),
                startedAt: new Date()
            };
            
            const docId = await attemptsRef.set(saveData);
            
            console.log(`Attempt saved for user ${userId}, activity ${activityId}`);
            return docId;
        } catch (error) {
            console.error('Error saving attempt:', error);
            // Add to sync queue for retry
            this.addToSyncQueue('saveAttempt', userId, activityId, attemptData);
            throw error;
        }
    }
    
    /**
     * Load user's attempts for an activity
     */
    async loadAttempts(userId, activityId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping attempts load');
            return [];
        }
        
        try {
            const attemptsRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('attempts')
                .where('activityId', '==', activityId)
                .orderBy('createdAt', 'desc');
            
            const snapshot = await attemptsRef.get();
            const attempts = [];
            
            snapshot.forEach(doc => {
                attempts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return attempts;
        } catch (error) {
            console.error('Error loading attempts:', error);
            return [];
        }
    }
    
    /**
     * Save activity state (for preserving progress during session)
     */
    async saveActivityState(userId, activityId, stateData) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping state save');
            return;
        }
        
        try {
            const stateRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('states').doc(activityId);
            
            const saveData = {
                userId,
                activityId,
                ...stateData,
                updatedAt: this.firebaseService.firestore.FieldValue.serverTimestamp(),
                lastSaved: new Date()
            };
            
            await stateRef.set(saveData, { merge: true });
            
            // Update cache
            const cacheKey = `${userId}:state:${activityId}`;
            this.cache.set(cacheKey, saveData);
            
            console.log(`Activity state saved for user ${userId}, activity ${activityId}`);
            return true;
        } catch (error) {
            console.error('Error saving activity state:', error);
            // Add to sync queue for retry
            this.addToSyncQueue('saveState', userId, activityId, stateData);
            throw error;
        }
    }
    
    /**
     * Load activity state
     */
    async loadActivityState(userId, activityId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping state load');
            return null;
        }
        
        try {
            // Check cache first
            const cacheKey = `${userId}:state:${activityId}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const stateRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('states').doc(activityId);
            
            const doc = await stateRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                // Add to cache
                this.cache.set(cacheKey, data);
                return data;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error loading activity state:', error);
            return null;
        }
    }
    
    /**
     * Get user's activity history
     */
    async getActivityHistory(userId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping history load');
            return [];
        }
        
        try {
            // Get progress, scores, and attempts for all activities
            const progressSnapshot = await this.firebaseService.firestore
                .collection('users').doc(userId).collection('progress')
                .get();
            
            const scoresSnapshot = await this.firebaseService.firestore
                .collection('users').doc(userId).collection('scores')
                .get();
            
            const history = [];
            
            progressSnapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    activityId: data.activityId,
                    type: 'progress',
                    data: data,
                    timestamp: data.updatedAt || data.lastAccessed
                });
            });
            
            scoresSnapshot.forEach(doc => {
                const data = doc.data();
                history.push({
                    activityId: data.activityId,
                    type: 'score',
                    data: data,
                    timestamp: data.updatedAt || data.completedAt
                });
            });
            
            // Sort by timestamp (most recent first)
            history.sort((a, b) => b.timestamp - a.timestamp);
            
            return history;
        } catch (error) {
            console.error('Error loading activity history:', error);
            return [];
        }
    }
    
    /**
     * Clear user's progress for an activity
     */
    async clearProgress(userId, activityId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping progress clear');
            return;
        }
        
        try {
            const progressRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('progress').doc(activityId);
            
            await progressRef.delete();
            
            // Clear from cache
            const cacheKey = `${userId}:${activityId}`;
            this.cache.delete(cacheKey);
            
            console.log(`Progress cleared for user ${userId}, activity ${activityId}`);
            return true;
        } catch (error) {
            console.error('Error clearing progress:', error);
            throw error;
        }
    }
    
    /**
     * Add operation to sync queue
     */
    addToSyncQueue(operation, userId, activityId, data) {
        this.syncQueue.push({
            operation,
            userId,
            activityId,
            data,
            timestamp: new Date()
        });
        
        // Try to sync immediately
        this.processSyncQueue();
    }
    
    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.isSyncing || this.syncQueue.length === 0) {
            return;
        }
        
        this.isSyncing = true;
        
        try {
            const queue = [...this.syncQueue];
            this.syncQueue = [];
            
            for (const item of queue) {
                try {
                    switch (item.operation) {
                        case 'save':
                            await this.saveProgress(item.userId, item.activityId, item.data);
                            break;
                        case 'saveScores':
                            await this.saveScores(item.userId, item.activityId, item.data);
                            break;
                        case 'saveAttempt':
                            await this.saveAttempt(item.userId, item.activityId, item.data);
                            break;
                        case 'saveState':
                            await this.saveActivityState(item.userId, item.activityId, item.data);
                            break;
                        default:
                            console.warn('Unknown operation in sync queue:', item.operation);
                    }
                } catch (error) {
                    console.error(`Error processing sync queue item (${item.operation}):`, error);
                    // Add back to queue for retry
                    this.syncQueue.unshift(item);
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }
    
    /**
     * Subscribe to progress updates (real-time)
     */
    async subscribeToProgress(userId, activityId, callback) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, cannot subscribe');
            return null;
        }
        
        try {
            const unsubscribe = this.firebaseService.firestore
                .collection('users').doc(userId)
                .collection('progress').doc(activityId)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        callback(doc.data());
                    } else {
                        callback(null);
                    }
                }, (error) => {
                    console.error('Error in progress subscription:', error);
                });
            
            return unsubscribe;
        } catch (error) {
            console.error('Error subscribing to progress:', error);
            return null;
        }
    }
    
    /**
     * Batch save multiple activities' progress
     */
    async batchSaveProgress(userId, progressArray) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping batch save');
            return;
        }
        
        try {
            const batch = this.firebaseService.firestore.batch();
            
            for (const progress of progressArray) {
                const progressRef = this.firebaseService.firestore
                    .collection('users').doc(userId)
                    .collection('progress').doc(progress.activityId);
                
                const saveData = {
                    userId,
                    ...progress,
                    updatedAt: this.firebaseService.firestore.FieldValue.serverTimestamp(),
                    lastAccessed: new Date()
                };
                
                batch.set(progressRef, saveData, { merge: true });
            }
            
            await batch.commit();
            
            console.log(`Batch saved progress for ${progressArray.length} activities`);
            return true;
        } catch (error) {
            console.error('Error in batch save progress:', error);
            throw error;
        }
    }
    
    /**
     * Get summary of user's progress across all activities
     */
    async getUserProgressSummary(userId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping summary load');
            return null;
        }
        
        try {
            const progressSnapshot = await this.firebaseService.firestore
                .collection('users').doc(userId).collection('progress')
                .get();
            
            const scoresSnapshot = await this.firebaseService.firestore
                .collection('users').doc(userId).collection('scores')
                .get();
            
            const attemptsSnapshot = await this.firebaseService.firestore
                .collection('users').doc(userId).collection('attempts')
                .get();
            
            const summary = {
                totalActivities: progressSnapshot.size,
                completedActivities: 0,
                totalScore: 0,
                averageScore: 0,
                totalAttempts: attemptsSnapshot.size,
                lastActivity: null
            };
            
            let scoreSum = 0;
            let completedCount = 0;
            
            progressSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.completed) {
                    completedCount++;
                }
                if (data.completedAt) {
                    summary.lastActivity = data.completedAt;
                }
            });
            
            scoresSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.score !== undefined) {
                    scoreSum += data.score;
                }
            });
            
            summary.completedActivities = completedCount;
            summary.averageScore = scoresSnapshot.size > 0 ? scoreSum / scoresSnapshot.size : 0;
            
            return summary;
        } catch (error) {
            console.error('Error getting user progress summary:', error);
            return null;
        }
    }
    
    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Cleanup service
     */
    cleanup() {
        this.clearCache();
    }
}

// Export the service
export default StatePersistenceService;