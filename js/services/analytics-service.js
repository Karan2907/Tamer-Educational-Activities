/**
 * Analytics Service
 * 
 * This service tracks usage metrics, user engagement, activity completion,
 * and other key performance indicators for the educational platform.
 */

class AnalyticsService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.trackingQueue = [];
        this.isTracking = false;
        this.sessionId = null;
        this.userId = null;
        this.startTime = null;
        this.pageViews = 0;
        this.events = [];
    }
    
    /**
     * Initialize analytics service
     */
    async initialize() {
        this.sessionId = this.generateSessionId();
        this.startTime = new Date();
        
        // Get user ID if available
        if (this.firebaseService && this.firebaseService.isAuthenticated()) {
            this.userId = this.firebaseService.getUserId();
        }
        
        // Set up event listeners for tracking
        this.setupEventListeners();
        
        // Start periodic data sending
        this.startPeriodicSend();
        
        this.isTracking = true;
        console.log('Analytics service initialized');
    }
    
    /**
     * Setup event listeners for tracking
     */
    setupEventListeners() {
        // Track page views
        this.trackPageView(window.location.pathname);
        
        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.resumeTracking();
            } else {
                this.pauseTracking();
            }
        });
        
        // Track before unload
        window.addEventListener('beforeunload', () => {
            this.sendData();
        });
        
        // Track clicks
        document.addEventListener('click', (event) => {
            this.trackClick(event.target);
        });
        
        // Track form submissions
        document.addEventListener('submit', (event) => {
            this.trackFormSubmission(event.target);
        });
        
        // Track scroll depth
        window.addEventListener('scroll', this.debounce(() => {
            this.trackScrollDepth();
        }, 500));
    }
    
    /**
     * Start periodic data sending
     */
    startPeriodicSend() {
        // Send data every 30 seconds
        setInterval(() => {
            if (this.trackingQueue.length > 0) {
                this.sendData();
            }
        }, 30000);
    }
    
    /**
     * Track page view
     */
    trackPageView(path) {
        this.pageViews++;
        
        const event = {
            type: 'page_view',
            sessionId: this.sessionId,
            userId: this.userId,
            path: path,
            timestamp: new Date(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            referrer: document.referrer,
            userAgent: navigator.userAgent
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Track user engagement
     */
    trackEngagement(templateType, action, details = {}) {
        const event = {
            type: 'engagement',
            sessionId: this.sessionId,
            userId: this.userId,
            templateType: templateType,
            action: action,
            details: details,
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Track activity completion
     */
    trackActivityCompletion(activityId, templateType, score, maxScore, timeSpent) {
        const event = {
            type: 'activity_completion',
            sessionId: this.sessionId,
            userId: this.userId,
            activityId: activityId,
            templateType: templateType,
            score: score,
            maxScore: maxScore,
            percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
            timeSpent: timeSpent,
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Track time spent on activity
     */
    trackTimeSpent(activityId, templateType, timeSpent) {
        const event = {
            type: 'time_spent',
            sessionId: this.sessionId,
            userId: this.userId,
            activityId: activityId,
            templateType: templateType,
            timeSpent: timeSpent,
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Track attempts
     */
    trackAttempt(activityId, templateType, attemptNumber, success = false) {
        const event = {
            type: 'attempt',
            sessionId: this.sessionId,
            userId: this.userId,
            activityId: activityId,
            templateType: templateType,
            attemptNumber: attemptNumber,
            success: success,
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Track click
     */
    trackClick(element) {
        const event = {
            type: 'click',
            sessionId: this.sessionId,
            userId: this.userId,
            element: this.getElementInfo(element),
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Track form submission
     */
    trackFormSubmission(form) {
        const event = {
            type: 'form_submission',
            sessionId: this.sessionId,
            userId: this.userId,
            form: this.getFormInfo(form),
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        const event = {
            type: 'scroll_depth',
            sessionId: this.sessionId,
            userId: this.userId,
            scrollPercent: scrollPercent,
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Queue event for sending
     */
    queueEvent(event) {
        this.trackingQueue.push(event);
        this.events.push(event);
    }
    
    /**
     * Send queued data to server
     */
    async sendData() {
        if (this.trackingQueue.length === 0 || !this.firebaseService || !this.firebaseService.isAuthenticated()) {
            return;
        }
        
        try {
            // In a real implementation, this would send data to Firebase or another analytics service
            // For now, we'll simulate sending to a Firebase collection
            const eventsToSend = [...this.trackingQueue];
            this.trackingQueue = []; // Clear the queue
            
            // This is where you would actually send the data
            console.log('Sending analytics data:', eventsToSend);
            
            // Example of how to save to Firebase
            /*
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const db = this.firebaseService.firestore;
            
            for (const event of eventsToSend) {
                await addDoc(collection(db, 'analytics_events'), event);
            }
            */
            
            console.log(`Sent ${eventsToSend.length} events to analytics`);
        } catch (error) {
            console.error('Error sending analytics data:', error);
            // Put events back in queue if sending failed
            this.trackingQueue = [...eventsToSend, ...this.trackingQueue];
        }
    }
    
    /**
     * Get element information for tracking
     */
    getElementInfo(element) {
        return {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            text: element.textContent?.substring(0, 50),
            href: element.href,
            src: element.src
        };
    }
    
    /**
     * Get form information for tracking
     */
    getFormInfo(form) {
        return {
            id: form.id,
            name: form.name,
            action: form.action,
            method: form.method,
            elementCount: form.elements.length
        };
    }
    
    /**
     * Resume tracking (when tab becomes visible)
     */
    resumeTracking() {
        this.startTime = new Date();
    }
    
    /**
     * Pause tracking (when tab becomes invisible)
     */
    pauseTracking() {
        // Send any pending data before pausing
        if (this.trackingQueue.length > 0) {
            this.sendData();
        }
    }
    
    /**
     * Get session duration
     */
    getSessionDuration() {
        if (!this.startTime) {
            return 0;
        }
        
        return Math.floor((new Date() - this.startTime) / 1000); // in seconds
    }
    
    /**
     * Get current session info
     */
    getSessionInfo() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: this.startTime,
            duration: this.getSessionDuration(),
            pageViews: this.pageViews,
            totalEvents: this.events.length
        };
    }
    
    /**
     * Get analytics report
     */
    async getReport(startDate, endDate) {
        try {
            // In a real implementation, this would query the analytics data from Firebase
            // For now, we'll return simulated data
            
            const report = {
                period: {
                    start: startDate,
                    end: endDate
                },
                totals: {
                    sessions: 150,
                    users: 89,
                    pageViews: 1250,
                    events: 2340
                },
                byTemplate: {
                    mcq: { completions: 45, avgTime: 180, avgScore: 78 },
                    flipcards: { completions: 32, avgTime: 120, avgScore: 85 },
                    dragdrop: { completions: 28, avgTime: 240, avgScore: 82 },
                    gamearena: { completions: 15, avgTime: 360, avgScore: 75 }
                },
                userEngagement: {
                    dailyActive: 67,
                    weeklyActive: 89,
                    monthlyActive: 120,
                    retention: 0.72
                }
            };
            
            return report;
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }
    
    /**
     * Get user-specific analytics
     */
    async getUserAnalytics(userId) {
        try {
            // In a real implementation, this would query user-specific data
            // For now, we'll return simulated data
            
            const userAnalytics = {
                userId: userId,
                totalActivities: 23,
                completedActivities: 18,
                averageScore: 82,
                timeSpent: 4200, // in seconds
                lastActive: new Date(Date.now() - 86400000), // 1 day ago
                engagementLevel: 'high'
            };
            
            return userAnalytics;
        } catch (error) {
            console.error('Error getting user analytics:', error);
            throw error;
        }
    }
    
    /**
     * Get activity-specific analytics
     */
    async getActivityAnalytics(activityId) {
        try {
            // In a real implementation, this would query activity-specific data
            // For now, we'll return simulated data
            
            const activityAnalytics = {
                activityId: activityId,
                totalAttempts: 45,
                completions: 38,
                averageScore: 78,
                averageTime: 240, // in seconds
                successRate: 0.84,
                difficultyRating: 3.2,
                lastAttempt: new Date(Date.now() - 3600000) // 1 hour ago
            };
            
            return activityAnalytics;
        } catch (error) {
            console.error('Error getting activity analytics:', error);
            throw error;
        }
    }
    
    /**
     * Get template usage statistics
     */
    async getTemplateUsageStats() {
        try {
            // In a real implementation, this would aggregate template usage data
            // For now, we'll return simulated data
            
            const templateStats = {
                mcq: {
                    totalActivities: 120,
                    totalCompletions: 340,
                    avgCompletionRate: 0.78,
                    avgTimeSpent: 180,
                    avgScore: 76
                },
                flipcards: {
                    totalActivities: 89,
                    totalCompletions: 210,
                    avgCompletionRate: 0.85,
                    avgTimeSpent: 120,
                    avgScore: 84
                },
                dragdrop: {
                    totalActivities: 67,
                    totalCompletions: 156,
                    avgCompletionRate: 0.82,
                    avgTimeSpent: 240,
                    avgScore: 81
                },
                gamearena: {
                    totalActivities: 45,
                    totalCompletions: 89,
                    avgCompletionRate: 0.75,
                    avgTimeSpent: 360,
                    avgScore: 72
                },
                interactivevideo: {
                    totalActivities: 32,
                    totalCompletions: 67,
                    avgCompletionRate: 0.71,
                    avgTimeSpent: 480,
                    avgScore: 79
                }
            };
            
            return templateStats;
        } catch (error) {
            console.error('Error getting template usage stats:', error);
            throw error;
        }
    }
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Debounce function for scroll events
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Get real-time analytics
     */
    getRealTimeData() {
        return {
            activeUsers: 12,
            currentSessions: 8,
            eventsPerMinute: 45,
            pageViewsPerMinute: 23,
            currentTopTemplate: 'mcq',
            currentTopActivity: 'Science Quiz'
        };
    }
    
    /**
     * Track custom event
     */
    trackCustomEvent(eventName, properties = {}) {
        const event = {
            type: 'custom',
            eventName: eventName,
            sessionId: this.sessionId,
            userId: this.userId,
            properties: properties,
            timestamp: new Date()
        };
        
        this.queueEvent(event);
    }
    
    /**
     * Cleanup analytics service
     */
    cleanup() {
        this.isTracking = false;
        
        // Send any remaining data
        if (this.trackingQueue.length > 0) {
            this.sendData();
        }
        
        // Clear intervals and event listeners
        // In a real implementation, you would remove event listeners here
    }
    
    /**
     * Export analytics data
     */
    exportData(format = 'json', startDate = null, endDate = null) {
        const data = {
            sessionInfo: this.getSessionInfo(),
            events: this.events,
            timestamp: new Date()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            case 'excel':
                // Would return Excel format in a real implementation
                return JSON.stringify(data, null, 2);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Convert data to CSV
     */
    convertToCSV(data) {
        const events = data.events;
        if (!events || events.length === 0) {
            return 'timestamp,type,template,action\n';
        }
        
        // Get all unique property keys for CSV headers
        const headers = ['timestamp', 'type', 'templateType', 'action'];
        const csvRows = [headers.join(',')];
        
        for (const event of events) {
            const row = [
                new Date(event.timestamp).toISOString(),
                event.type || '',
                event.templateType || '',
                event.action || ''
            ];
            csvRows.push(row.join(','));
        }
        
        return csvRows.join('\n');
    }
}

// Export the service
export default AnalyticsService;