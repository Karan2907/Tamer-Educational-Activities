/**
 * SCORM Bookmarking & Completion Service
 * 
 * This service handles SCORM bookmarking, completion tracking, and state persistence.
 * It manages learner progress, bookmarks, and completion status according to SCORM standards.
 */

class SCORMBookmarkingService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.sessionData = new Map(); // In-memory session data
        this.bookmarks = new Map(); // Current bookmarks
        this.completionStatus = new Map(); // Completion status
        this.suspendData = new Map(); // Suspend data
    }
    
    /**
     * Initialize SCORM session for a user
     */
    async initializeSession(userId, activityId, packagePath) {
        const sessionId = `${userId}-${activityId}-${Date.now()}`;
        
        // Create session data
        const session = {
            sessionId: sessionId,
            userId: userId,
            activityId: activityId,
            packagePath: packagePath,
            startTime: new Date(),
            lastAccess: new Date(),
            progress: 0,
            score: null,
            status: 'not attempted',
            bookmarks: {},
            suspendData: '',
            sessionTime: 0,
            totalTime: 0
        };
        
        // Store in session data
        this.sessionData.set(sessionId, session);
        
        // Load existing progress from Firebase if available
        const existingProgress = await this.loadProgress(userId, activityId);
        if (existingProgress) {
            session.progress = existingProgress.progress || 0;
            session.score = existingProgress.score || null;
            session.status = existingProgress.status || 'not attempted';
            session.bookmarks = existingProgress.bookmarks || {};
            session.suspendData = existingProgress.suspendData || '';
            session.totalTime = existingProgress.totalTime || 0;
        }
        
        return sessionId;
    }
    
    /**
     * Get session data
     */
    getSession(sessionId) {
        return this.sessionData.get(sessionId);
    }
    
    /**
     * Set bookmark for a SCO (Shareable Content Object)
     */
    setBookmark(sessionId, scoId, bookmarkValue) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        session.bookmarks[scoId] = bookmarkValue;
        session.lastAccess = new Date();
        
        // Update session in map
        this.sessionData.set(sessionId, session);
        
        // Save to Firebase
        this.saveProgress(session.userId, session.activityId, session);
        
        return true;
    }
    
    /**
     * Get bookmark for a SCO
     */
    getBookmark(sessionId, scoId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return null;
        }
        
        return session.bookmarks[scoId] || null;
    }
    
    /**
     * Set suspend data
     */
    setSuspendData(sessionId, suspendData) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        session.suspendData = suspendData;
        session.lastAccess = new Date();
        
        // Update session in map
        this.sessionData.set(sessionId, session);
        
        // Save to Firebase
        this.saveProgress(session.userId, session.activityId, session);
        
        return true;
    }
    
    /**
     * Get suspend data
     */
    getSuspendData(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return '';
        }
        
        return session.suspendData || '';
    }
    
    /**
     * Set lesson status
     */
    setLessonStatus(sessionId, status) {
        const validStatuses = ['not attempted', 'completed', 'incomplete', 'passed', 'failed', 'browsed', 'suspend'];
        
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid lesson status: ${status}`);
        }
        
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        session.status = status;
        session.lastAccess = new Date();
        
        // Calculate progress based on status
        if (status === 'completed' || status === 'passed') {
            session.progress = 100;
        } else if (status === 'incomplete') {
            session.progress = Math.max(session.progress, 50); // At least 50% for incomplete
        } else if (status === 'not attempted') {
            session.progress = 0;
        }
        
        // Update session in map
        this.sessionData.set(sessionId, session);
        
        // Save to Firebase
        this.saveProgress(session.userId, session.activityId, session);
        
        return true;
    }
    
    /**
     * Get lesson status
     */
    getLessonStatus(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return 'not attempted';
        }
        
        return session.status;
    }
    
    /**
     * Set score
     */
    setScore(sessionId, score, minScore = 0, maxScore = 100) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Validate score range
        if (score < minScore || score > maxScore) {
            throw new Error(`Score ${score} out of range [${minScore}, ${maxScore}]`);
        }
        
        session.score = {
            raw: score,
            min: minScore,
            max: maxScore,
            scaled: (score - minScore) / (maxScore - minScore) // Scale to 0-1
        };
        
        session.lastAccess = new Date();
        
        // Calculate progress based on score
        session.progress = Math.round((score / maxScore) * 100);
        
        // Update session in map
        this.sessionData.set(sessionId, session);
        
        // Save to Firebase
        this.saveProgress(session.userId, session.activityId, session);
        
        return true;
    }
    
    /**
     * Get score
     */
    getScore(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return null;
        }
        
        return session.score;
    }
    
    /**
     * Set progress measure
     */
    setProgress(sessionId, progress) {
        if (progress < 0 || progress > 100) {
            throw new Error(`Progress ${progress}% out of range [0, 100]`);
        }
        
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        session.progress = progress;
        session.lastAccess = new Date();
        
        // Update session in map
        this.sessionData.set(sessionId, session);
        
        // Save to Firebase
        this.saveProgress(session.userId, session.activityId, session);
        
        return true;
    }
    
    /**
     * Get progress
     */
    getProgress(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return 0;
        }
        
        return session.progress;
    }
    
    /**
     * Record interaction
     */
    recordInteraction(sessionId, interactionId, type, objectives, timestamp, correctResponses, weighting, learnerResponse, result, latency) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        if (!session.interactions) {
            session.interactions = {};
        }
        
        session.interactions[interactionId] = {
            type,
            objectives,
            timestamp: timestamp || new Date(),
            correctResponses,
            weighting,
            learnerResponse,
            result,
            latency
        };
        
        session.lastAccess = new Date();
        
        // Update session in map
        this.sessionData.set(sessionId, session);
        
        // Save to Firebase
        this.saveProgress(session.userId, session.activityId, session);
        
        return true;
    }
    
    /**
     * Calculate total time spent in session
     */
    calculateSessionTime(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return 0;
        }
        
        const currentTime = new Date();
        const sessionStart = session.startTime;
        const timeDiff = currentTime - sessionStart;
        
        // Convert milliseconds to seconds
        return Math.floor(timeDiff / 1000);
    }
    
    /**
     * Save progress to Firebase
     */
    async saveProgress(userId, activityId, sessionData) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping progress save');
            return;
        }
        
        try {
            const progressData = {
                userId: userId,
                activityId: activityId,
                progress: sessionData.progress,
                score: sessionData.score,
                status: sessionData.status,
                bookmarks: sessionData.bookmarks,
                suspendData: sessionData.suspendData,
                totalTime: sessionData.totalTime + this.calculateSessionTime(sessionData.sessionId),
                lastAccess: new Date(),
                sessionData: {
                    // Only store essential data to minimize storage
                    progress: sessionData.progress,
                    status: sessionData.status,
                    bookmarks: sessionData.bookmarks,
                    suspendData: sessionData.suspendData
                }
            };
            
            await this.firebaseService.saveProgress(activityId, progressData);
        } catch (error) {
            console.error('Failed to save progress to Firebase:', error);
            // Could implement fallback storage here if needed
        }
    }
    
    /**
     * Load progress from Firebase
     */
    async loadProgress(userId, activityId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('Firebase not available or user not authenticated, skipping progress load');
            return null;
        }
        
        try {
            const progressData = await this.firebaseService.loadProgress(activityId);
            return progressData;
        } catch (error) {
            console.error('Failed to load progress from Firebase:', error);
            return null;
        }
    }
    
    /**
     * Commit session data
     */
    async commitSession(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Save current session data to Firebase
        await this.saveProgress(session.userId, session.activityId, session);
        
        // Update total time
        session.totalTime += this.calculateSessionTime(sessionId);
        session.startTime = new Date(); // Reset start time for next chunk
        
        return true;
    }
    
    /**
     * Terminate session
     */
    async terminateSession(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Commit any remaining data
        await this.commitSession(sessionId);
        
        // Clean up session data
        this.sessionData.delete(sessionId);
        this.bookmarks.delete(sessionId);
        this.completionStatus.delete(sessionId);
        this.suspendData.delete(sessionId);
        
        return true;
    }
    
    /**
     * Get all sessions for a user
     */
    getUserSessions(userId) {
        return Array.from(this.sessionData.values()).filter(
            session => session.userId === userId
        );
    }
    
    /**
     * Get session by activity ID
     */
    getSessionByActivity(userId, activityId) {
        return Array.from(this.sessionData.values()).find(
            session => session.userId === userId && session.activityId === activityId
        );
    }
    
    /**
     * Clear all session data (for cleanup)
     */
    clearAllSessions() {
        this.sessionData.clear();
        this.bookmarks.clear();
        this.completionStatus.clear();
        this.suspendData.clear();
    }
    
    /**
     * Check if session is still valid (not expired)
     */
    isSessionValid(sessionId, maxInactiveMinutes = 60) {
        const session = this.getSession(sessionId);
        if (!session) {
            return false;
        }
        
        const now = new Date();
        const lastAccess = new Date(session.lastAccess);
        const minutesSinceAccess = (now - lastAccess) / (1000 * 60);
        
        return minutesSinceAccess <= maxInactiveMinutes;
    }
    
    /**
     * Get session summary
     */
    getSessionSummary(sessionId) {
        const session = this.getSession(sessionId);
        if (!session) {
            return null;
        }
        
        return {
            sessionId: session.sessionId,
            userId: session.userId,
            activityId: session.activityId,
            progress: session.progress,
            status: session.status,
            score: session.score,
            startTime: session.startTime,
            lastAccess: session.lastAccess,
            totalTime: session.totalTime + this.calculateSessionTime(sessionId),
            bookmarksCount: Object.keys(session.bookmarks || {}).length
        };
    }
    
    /**
     * Restore session from saved data
     */
    async restoreSession(userId, activityId) {
        const savedProgress = await this.loadProgress(userId, activityId);
        if (!savedProgress) {
            return null;
        }
        
        // Create a new session based on saved data
        const sessionId = await this.initializeSession(userId, activityId, savedProgress.packagePath || '');
        return sessionId;
    }
}

// Export the service
export default SCORMBookmarkingService;