/**
 * SCORM Bookmarking Fix Service
 * 
 * This service fixes SCORM bookmarking and completion reporting issues
 * ensuring proper state persistence and communication with SCORM API.
 */

class SCORMBookmarkingFixService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.apiHandle = null;
        this.initialized = false;
        this.completionStatus = 'incomplete';
        this.successStatus = 'unknown';
        this.sessionData = {};
        this.bookmarks = new Map();
        this.retryAttempts = new Map();
        this.maxRetryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }
    
    /**
     * Initialize the SCORM API connection
     */
    initialize() {
        try {
            this.apiHandle = this.findAPI(window);
            if (this.apiHandle) {
                const result = this.apiHandle.Initialize('');
                if (result === 'true' || result === true) {
                    this.initialized = true;
                    console.log('SCORM API initialized successfully');
                    
                    // Set up session data
                    this.loadSessionData();
                    
                    // Start periodic saving
                    this.startPeriodicSave();
                    
                    return true;
                }
            }
            
            console.error('Failed to initialize SCORM API');
            return false;
        } catch (error) {
            console.error('Error initializing SCORM API:', error);
            return false;
        }
    }
    
    /**
     * Find the SCORM API
     */
    findAPI(win) {
        let tries = 0;
        let maxTries = 500;
        let api = null;
        
        while (!api && win && tries++ <= maxTries) {
            try {
                if (win.hasOwnProperty('API') && win.API) {
                    api = win.API;
                } else if (win.hasOwnProperty('API_1484_11') && win.API_1484_11) {
                    api = win.API_1484_11;
                }
            } catch (e) {
                // Access denied - try parent
            }
            
            if (!api) {
                try {
                    win = win.parent;
                    if (win === win.top) {
                        win = null;
                    }
                } catch (e) {
                    win = null;
                }
            }
        }
        
        return api;
    }
    
    /**
     * Get a value from the SCORM API
     */
    getValue(element) {
        if (!this.initialized || !this.apiHandle) {
            console.error('SCORM API not initialized');
            return '';
        }
        
        try {
            const result = this.apiHandle.GetValue(element);
            const errorCode = this.apiHandle.GetLastError();
            
            if (errorCode !== '0') {
                console.error(`SCORM GetValue error for ${element}: ${this.apiHandle.GetErrorString(errorCode)}`);
                return this.getFallbackValue(element);
            }
            
            return result;
        } catch (error) {
            console.error(`Error getting value for ${element}:`, error);
            return this.getFallbackValue(element);
        }
    }
    
    /**
     * Set a value in the SCORM API
     */
    setValue(element, value) {
        if (!this.initialized || !this.apiHandle) {
            console.error('SCORM API not initialized');
            return false;
        }
        
        try {
            const result = this.apiHandle.SetValue(element, value);
            const errorCode = this.apiHandle.GetLastError();
            
            if (errorCode !== '0') {
                console.error(`SCORM SetValue error for ${element}: ${this.apiHandle.GetErrorString(errorCode)}`);
                
                // Retry mechanism
                return this.retrySetValue(element, value);
            }
            
            // Update session data
            this.sessionData[element] = value;
            
            return result === 'true' || result === true;
        } catch (error) {
            console.error(`Error setting value for ${element}:`, error);
            
            // Retry mechanism
            return this.retrySetValue(element, value);
        }
    }
    
    /**
     * Retry setting a value
     */
    async retrySetValue(element, value) {
        const currentAttempts = this.retryAttempts.get(element) || 0;
        
        if (currentAttempts >= this.maxRetryAttempts) {
            console.error(`Max retry attempts reached for ${element}`);
            return false;
        }
        
        this.retryAttempts.set(element, currentAttempts + 1);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        return this.setValue(element, value);
    }
    
    /**
     * Get fallback value for when SCORM API fails
     */
    getFallbackValue(element) {
        // Return stored session data if available
        if (this.sessionData[element] !== undefined) {
            return this.sessionData[element];
        }
        
        // Return defaults based on element
        switch (element) {
            case 'cmi.core.lesson_status':
            case 'cmi.completion_status':
                return 'incomplete';
            case 'cmi.success_status':
                return 'unknown';
            case 'cmi.suspend_data':
                return '';
            case 'cmi.location':
                return '';
            case 'cmi.score.raw':
                return '';
            default:
                return '';
        }
    }
    
    /**
     * Set bookmark data
     */
    setBookmark(bookmarkData) {
        try {
            // Store in SCORM suspend_data
            const suspendData = typeof bookmarkData === 'string' ? 
                bookmarkData : JSON.stringify(bookmarkData);
                
            const success = this.setValue('cmi.suspend_data', suspendData);
            
            if (success) {
                // Also store in local session
                this.sessionData['cmi.suspend_data'] = suspendData;
                
                // Store in Firebase for backup
                this.saveBookmarkToFirebase(bookmarkData);
                
                console.log('Bookmark saved successfully');
                return true;
            } else {
                console.error('Failed to save bookmark to SCORM');
                return false;
            }
        } catch (error) {
            console.error('Error setting bookmark:', error);
            return false;
        }
    }
    
    /**
     * Get bookmark data
     */
    getBookmark() {
        try {
            // Try to get from SCORM first
            let suspendData = this.getValue('cmi.suspend_data');
            
            if (suspendData && suspendData !== '') {
                try {
                    return JSON.parse(suspendData);
                } catch (e) {
                    console.warn('Could not parse suspend_data, returning raw value:', suspendData);
                    return suspendData;
                }
            }
            
            // If not available in SCORM, try Firebase backup
            return this.loadBookmarkFromFirebase();
        } catch (error) {
            console.error('Error getting bookmark:', error);
            return null;
        }
    }
    
    /**
     * Set lesson status
     */
    setLessonStatus(status) {
        if (!['passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'].includes(status)) {
            console.error(`Invalid lesson status: ${status}`);
            return false;
        }
        
        const success = this.setValue('cmi.core.lesson_status', status) || 
                       this.setValue('cmi.completion_status', status);
        
        if (success) {
            this.completionStatus = status;
            this.sessionData['cmi.completion_status'] = status;
            
            // Report to Firebase
            this.reportCompletionToFirebase(status);
        }
        
        return success;
    }
    
    /**
     * Get lesson status
     */
    getLessonStatus() {
        return this.getValue('cmi.completion_status') || this.getValue('cmi.core.lesson_status');
    }
    
    /**
     * Set success status
     */
    setSuccessStatus(status) {
        if (!['passed', 'failed', 'unknown'].includes(status)) {
            console.error(`Invalid success status: ${status}`);
            return false;
        }
        
        const success = this.setValue('cmi.success_status', status);
        
        if (success) {
            this.successStatus = status;
            this.sessionData['cmi.success_status'] = status;
        }
        
        return success;
    }
    
    /**
     * Get success status
     */
    getSuccessStatus() {
        return this.getValue('cmi.success_status');
    }
    
    /**
     * Set score
     */
    setScore(score, min = 0, max = 100) {
        // Validate score range
        if (typeof score !== 'number' || score < min || score > max) {
            console.error(`Invalid score: ${score}. Must be between ${min} and ${max}`);
            return false;
        }
        
        // Set raw score
        const rawSuccess = this.setValue('cmi.score.raw', score.toString());
        
        // Set scaled score (0-1)
        const scaledScore = (score - min) / (max - min);
        const scaledSuccess = this.setValue('cmi.score.scaled', scaledScore.toString());
        
        // Set min and max
        const minSuccess = this.setValue('cmi.score.min', min.toString());
        const maxSuccess = this.setValue('cmi.score.max', max.toString());
        
        if (rawSuccess) {
            this.sessionData['cmi.score.raw'] = score.toString();
        }
        
        return rawSuccess && scaledSuccess && minSuccess && maxSuccess;
    }
    
    /**
     * Get current score
     */
    getScore() {
        const raw = this.getValue('cmi.score.raw');
        const scaled = this.getValue('cmi.score.scaled');
        const min = this.getValue('cmi.score.min');
        const max = this.getValue('cmi.score.max');
        
        return {
            raw: raw ? parseFloat(raw) : null,
            scaled: scaled ? parseFloat(scaled) : null,
            min: min ? parseFloat(min) : 0,
            max: max ? parseFloat(max) : 100
        };
    }
    
    /**
     * Set location (current page/section)
     */
    setLocation(location) {
        const success = this.setValue('cmi.location', location);
        
        if (success) {
            this.sessionData['cmi.location'] = location;
        }
        
        return success;
    }
    
    /**
     * Get current location
     */
    getLocation() {
        return this.getValue('cmi.location');
    }
    
    /**
     * Commit all changes to the LMS
     */
    commit() {
        if (!this.initialized || !this.apiHandle) {
            console.error('SCORM API not initialized');
            return false;
        }
        
        try {
            const result = this.apiHandle.Commit('');
            const errorCode = this.apiHandle.GetLastError();
            
            if (errorCode !== '0') {
                console.error('SCORM Commit error:', this.apiHandle.GetErrorString(errorCode));
                return false;
            }
            
            console.log('SCORM data committed successfully');
            return result === 'true' || result === true;
        } catch (error) {
            console.error('Error committing SCORM data:', error);
            return false;
        }
    }
    
    /**
     * Terminate the SCORM session
     */
    terminate() {
        if (!this.initialized || !this.apiHandle) {
            return true; // Nothing to terminate
        }
        
        try {
            // Commit any pending changes
            this.commit();
            
            const result = this.apiHandle.Terminate('');
            const errorCode = this.apiHandle.GetLastError();
            
            if (errorCode !== '0') {
                console.error('SCORM Terminate error:', this.apiHandle.GetErrorString(errorCode));
            }
            
            this.initialized = false;
            this.apiHandle = null;
            
            console.log('SCORM session terminated');
            return result === 'true' || result === true;
        } catch (error) {
            console.error('Error terminating SCORM session:', error);
            return false;
        }
    }
    
    /**
     * Start periodic saving to prevent data loss
     */
    startPeriodicSave(interval = 30000) { // Save every 30 seconds
        this.periodicSaveInterval = setInterval(() => {
            if (this.initialized) {
                this.commit();
            }
        }, interval);
    }
    
    /**
     * Stop periodic saving
     */
    stopPeriodicSave() {
        if (this.periodicSaveInterval) {
            clearInterval(this.periodicSaveInterval);
            this.periodicSaveInterval = null;
        }
    }
    
    /**
     * Load session data from SCORM and Firebase
     */
    loadSessionData() {
        try {
            // Load from SCORM
            this.sessionData['cmi.completion_status'] = this.getValue('cmi.completion_status');
            this.sessionData['cmi.success_status'] = this.getValue('cmi.success_status');
            this.sessionData['cmi.suspend_data'] = this.getValue('cmi.suspend_data');
            this.sessionData['cmi.location'] = this.getValue('cmi.location');
            this.sessionData['cmi.score.raw'] = this.getValue('cmi.score.raw');
            
            // Update internal state
            this.completionStatus = this.sessionData['cmi.completion_status'] || 'incomplete';
            this.successStatus = this.sessionData['cmi.success_status'] || 'unknown';
            
            console.log('Session data loaded');
        } catch (error) {
            console.error('Error loading session data:', error);
        }
    }
    
    /**
     * Save bookmark to Firebase for backup
     */
    async saveBookmarkToFirebase(bookmarkData) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            return;
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const activityId = this.sessionData.activityId || 'unknown';
            
            const bookmarkRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('scorm_bookmarks').doc(activityId);
            
            const saveData = {
                userId,
                activityId,
                bookmarkData,
                updatedAt: this.firebaseService.firestore.FieldValue.serverTimestamp(),
                lastSaved: new Date()
            };
            
            await bookmarkRef.set(saveData, { merge: true });
            
            console.log('Bookmark saved to Firebase backup');
        } catch (error) {
            console.error('Error saving bookmark to Firebase:', error);
        }
    }
    
    /**
     * Load bookmark from Firebase backup
     */
    async loadBookmarkFromFirebase() {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            return null;
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const activityId = this.sessionData.activityId || 'unknown';
            
            const bookmarkRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('scorm_bookmarks').doc(activityId);
            
            const doc = await bookmarkRef.get();
            
            if (doc.exists) {
                return doc.data().bookmarkData;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error loading bookmark from Firebase:', error);
            return null;
        }
    }
    
    /**
     * Report completion to Firebase
     */
    async reportCompletionToFirebase(status) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            return;
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const activityId = this.sessionData.activityId || 'unknown';
            
            const completionRef = this.firebaseService.firestore.collection('users').doc(userId)
                .collection('scorm_completion').doc(activityId);
            
            const completionData = {
                userId,
                activityId,
                status,
                completedAt: status === 'completed' || status === 'passed' ? 
                    this.firebaseService.firestore.FieldValue.serverTimestamp() : null,
                updatedAt: this.firebaseService.firestore.FieldValue.serverTimestamp()
            };
            
            await completionRef.set(completionData, { merge: true });
            
            console.log(`Completion status reported to Firebase: ${status}`);
        } catch (error) {
            console.error('Error reporting completion to Firebase:', error);
        }
    }
    
    /**
     * Get SCORM error details
     */
    getErrorDetails() {
        if (!this.apiHandle) {
            return { code: '0', string: 'No API handle', diagnostic: 'API not initialized' };
        }
        
        const code = this.apiHandle.GetLastError();
        const string = this.apiHandle.GetErrorString(code);
        const diagnostic = this.apiHandle.GetDiagnostic(code);
        
        return { code, string, diagnostic };
    }
    
    /**
     * Validate SCORM connection
     */
    validateConnection() {
        if (!this.apiHandle) {
            return false;
        }
        
        try {
            // Test with a simple read operation
            const version = this.getValue('cmi.core.student_name') || 
                           this.getValue('cmi.learner_name') || 
                           'connection_ok';
            
            return version !== '';
        } catch (error) {
            console.error('SCORM connection validation failed:', error);
            return false;
        }
    }
    
    /**
     * Reset retry attempts for an element
     */
    resetRetryAttempts(element) {
        this.retryAttempts.delete(element);
    }
    
    /**
     * Get current session data
     */
    getSessionData() {
        return { ...this.sessionData };
    }
    
    /**
     * Set activity ID for this session
     */
    setActivityId(activityId) {
        this.sessionData.activityId = activityId;
    }
    
    /**
     * Get activity ID for this session
     */
    getActivityId() {
        return this.sessionData.activityId;
    }
    
    /**
     * Handle window unload to save state
     */
    setupUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            if (this.initialized) {
                this.commit();
                this.terminate();
            }
        });
    }
    
    /**
     * Cleanup the service
     */
    cleanup() {
        this.stopPeriodicSave();
        this.terminate();
        
        // Clear retry attempts
        this.retryAttempts.clear();
        
        // Clear session data
        this.sessionData = {};
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            connected: this.validateConnection(),
            completionStatus: this.completionStatus,
            successStatus: this.successStatus,
            sessionDataSize: Object.keys(this.sessionData).length
        };
    }
    
    /**
     * Force save all current data
     */
    forceSave() {
        if (this.initialized) {
            this.commit();
            
            // Also save to Firebase backup
            if (this.sessionData['cmi.suspend_data']) {
                try {
                    const bookmarkData = JSON.parse(this.sessionData['cmi.suspend_data']);
                    this.saveBookmarkToFirebase(bookmarkData);
                } catch (e) {
                    this.saveBookmarkToFirebase(this.sessionData['cmi.suspend_data']);
                }
            }
        }
    }
    
    /**
     * Set up error handling for robust operation
     */
    setupErrorHandling() {
        // Listen for SCORM-specific errors
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('SCORM')) {
                console.error('SCORM-related error detected:', event.error);
                
                // Attempt recovery
                this.attemptRecovery();
            }
        });
    }
    
    /**
     * Attempt to recover from SCORM errors
     */
    attemptRecovery() {
        console.log('Attempting SCORM recovery...');
        
        // Clear current API handle
        this.apiHandle = null;
        this.initialized = false;
        
        // Try to reinitialize
        setTimeout(() => {
            this.initialize();
        }, 2000); // Wait 2 seconds before attempting reinitialization
    }
}

// Export the service
export default SCORMBookmarkingFixService;