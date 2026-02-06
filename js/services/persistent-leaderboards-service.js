/**
 * Persistent Leaderboards Service
 * 
 * This service handles persistent leaderboards for Game Arena and other competitive activities
 * in the educational platform.
 */

class PersistentLeaderboardsService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.leaderboards = new Map(); // Cache for leaderboard data
        this.subscribers = new Map(); // Subscribers for real-time updates
        this.currentUserRankings = new Map(); // Cache for user rankings
        this.updateIntervals = new Map(); // Update intervals for each leaderboard
        this.refreshTimeouts = new Map(); // Refresh timeouts
    }
    
    /**
     * Initialize the leaderboards service
     */
    initialize() {
        console.log('Persistent leaderboards service initialized');
        // Load initial data if needed
        this.loadInitialData();
    }
    
    /**
     * Load initial leaderboard data
     */
    loadInitialData() {
        // Pre-populate with empty leaderboards for common types
        const defaultTypes = ['gamearena', 'mcq', 'flashcards', 'overall'];
        defaultTypes.forEach(type => {
            this.leaderboards.set(type, []);
        });
    }
    
    /**
     * Submit a score to a leaderboard
     */
    async submitScore(userId, username, activityId, score, options = {}) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to submit scores');
        }
        
        try {
            const {
                leaderboardType = 'gamearena',
                metadata = {},
                timestamp = new Date()
            } = options;
            
            // Validate inputs
            if (!userId || !username || !activityId || typeof score !== 'number') {
                throw new Error('Missing required parameters for score submission');
            }
            
            // Create score entry
            const scoreEntry = {
                userId,
                username,
                activityId,
                score,
                timestamp,
                metadata: { ...metadata, leaderboardType }
            };
            
            // Save to Firestore
            const scoresRef = this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores')
                .doc(); // Auto-generated ID
            
            await scoresRef.set(scoreEntry);
            
            // Update local cache
            await this.updateLocalCache(leaderboardType);
            
            console.log(`Score submitted: ${username} scored ${score} in ${activityId}`);
            
            return {
                success: true,
                scoreId: scoresRef.id,
                message: 'Score submitted successfully'
            };
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }
    
    /**
     * Get leaderboard data
     */
    async getLeaderboard(leaderboardType = 'gamearena', options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                timeframe = 'all_time', // 'daily', 'weekly', 'monthly', 'all_time'
                includeUserRank = true
            } = options;
            
            // Check cache first
            const cacheKey = `${leaderboardType}_${limit}_${offset}_${timeframe}`;
            const cachedData = this.leaderboards.get(cacheKey);
            
            if (cachedData && Date.now() < cachedData.expires) {
                return cachedData.data;
            }
            
            // Query Firestore for scores
            let query = this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores');
            
            // Apply timeframe filter if specified
            if (timeframe !== 'all_time') {
                const cutoffDate = this.getTimeframeCutoff(timeframe);
                query = query.where('timestamp', '>=', cutoffDate);
            }
            
            // Order by score descending and limit results
            query = query.orderBy('score', 'desc')
                        .limit(limit)
                        .offset(offset);
            
            const snapshot = await query.get();
            
            const scores = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                scores.push({
                    id: doc.id,
                    ...data
                });
            });
            
            // Add rank to each entry
            const rankedScores = scores.map((score, index) => ({
                ...score,
                rank: index + 1 + offset
            }));
            
            // Create result object
            const result = {
                leaderboardType,
                timeframe,
                totalEntries: snapshot.size,
                entries: rankedScores,
                lastUpdated: new Date()
            };
            
            // Include user's rank if requested and user is authenticated
            if (includeUserRank && this.firebaseService && this.firebaseService.isAuthenticated()) {
                const currentUser = this.firebaseService.getCurrentUser();
                if (currentUser) {
                    const userRank = await this.getUserRank(leaderboardType, currentUser.uid, timeframe);
                    result.userRank = userRank;
                }
            }
            
            // Cache the result
            this.leaderboards.set(cacheKey, {
                data: result,
                expires: Date.now() + (5 * 60 * 1000) // Cache for 5 minutes
            });
            
            return result;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }
    
    /**
     * Get user's rank in a specific leaderboard
     */
    async getUserRank(leaderboardType, userId, timeframe = 'all_time') {
        try {
            // Check cache first
            const cacheKey = `rank_${leaderboardType}_${userId}_${timeframe}`;
            const cachedRank = this.currentUserRankings.get(cacheKey);
            
            if (cachedRank && Date.now() < cachedRank.expires) {
                return cachedRank.data;
            }
            
            // Get all scores for the leaderboard and timeframe
            let query = this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores');
            
            if (timeframe !== 'all_time') {
                const cutoffDate = this.getTimeframeCutoff(timeframe);
                query = query.where('timestamp', '>=', cutoffDate);
            }
            
            // Get all scores ordered by score descending
            const allScoresQuery = await query.orderBy('score', 'desc').get();
            
            // Find user's rank
            let rank = -1;
            let userScore = null;
            let totalParticipants = allScoresQuery.size;
            
            let currentRank = 1;
            let previousScore = Infinity;
            
            allScoresQuery.forEach(doc => {
                const data = doc.data();
                
                // Update rank if score is different from previous
                if (data.score !== previousScore) {
                    currentRank = allScoresQuery.docs.findIndex(d => d.id === doc.id) + 1;
                }
                
                if (data.userId === userId) {
                    rank = currentRank;
                    userScore = data.score;
                }
                
                previousScore = data.score;
            });
            
            const rankInfo = {
                userId,
                leaderboardType,
                timeframe,
                rank: rank,
                score: userScore,
                totalParticipants
            };
            
            // Cache the result
            this.currentUserRankings.set(cacheKey, {
                data: rankInfo,
                expires: Date.now() + (2 * 60 * 1000) // Cache for 2 minutes
            });
            
            return rankInfo;
        } catch (error) {
            console.error('Error getting user rank:', error);
            throw error;
        }
    }
    
    /**
     * Get top performers for a specific time period
     */
    async getTopPerformers(leaderboardType, timeframe = 'weekly', limit = 10) {
        try {
            const cutoffDate = this.getTimeframeCutoff(timeframe);
            
            const query = await this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores')
                .where('timestamp', '>=', cutoffDate)
                .orderBy('score', 'desc')
                .limit(limit)
                .get();
            
            const performers = [];
            query.forEach(doc => {
                const data = doc.data();
                performers.push({
                    id: doc.id,
                    userId: data.userId,
                    username: data.username,
                    score: data.score,
                    timestamp: data.timestamp,
                    rank: performers.length + 1
                });
            });
            
            return performers;
        } catch (error) {
            console.error('Error getting top performers:', error);
            throw error;
        }
    }
    
    /**
     * Get user's recent scores
     */
    async getUserRecentScores(userId, leaderboardType = null, limit = 10) {
        try {
            let query = this.firebaseService.firestore.collection('leaderboards');
            
            if (leaderboardType) {
                query = query.doc(leaderboardType).collection('scores');
            } else {
                // If no specific leaderboard, get from all leaderboards
                // This would require a more complex query in a real implementation
                throw new Error('Specific leaderboard type required for this implementation');
            }
            
            query = query.where('userId', '==', userId)
                        .orderBy('timestamp', 'desc')
                        .limit(limit);
            
            const snapshot = await query.get();
            
            const scores = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                scores.push({
                    id: doc.id,
                    ...data
                });
            });
            
            return scores;
        } catch (error) {
            console.error('Error getting user recent scores:', error);
            throw error;
        }
    }
    
    /**
     * Subscribe to leaderboard updates
     */
    async subscribeToLeaderboard(leaderboardType, callback, options = {}) {
        const {
            limit = 50,
            timeframe = 'all_time',
            refreshInterval = 30000 // 30 seconds
        } = options;
        
        try {
            // Create a real-time listener
            let query = this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores');
            
            if (timeframe !== 'all_time') {
                const cutoffDate = this.getTimeframeCutoff(timeframe);
                query = query.where('timestamp', '>=', cutoffDate);
            }
            
            query = query.orderBy('score', 'desc').limit(limit);
            
            const unsubscribe = query.onSnapshot(snapshot => {
                const scores = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    scores.push({
                        id: doc.id,
                        ...data
                    });
                });
                
                // Add ranks
                const rankedScores = scores.map((score, index) => ({
                    ...score,
                    rank: index + 1
                }));
                
                callback({
                    leaderboardType,
                    entries: rankedScores,
                    timestamp: new Date()
                });
            }, error => {
                console.error('Error in leaderboard subscription:', error);
            });
            
            // Store unsubscribe function
            const subscriberId = `${leaderboardType}_${Date.now()}`;
            this.subscribers.set(subscriberId, {
                unsubscribe,
                callback,
                options
            });
            
            return subscriberId;
        } catch (error) {
            console.error('Error subscribing to leaderboard:', error);
            throw error;
        }
    }
    
    /**
     * Unsubscribe from leaderboard updates
     */
    unsubscribeFromLeaderboard(subscriberId) {
        const subscriber = this.subscribers.get(subscriberId);
        if (subscriber) {
            subscriber.unsubscribe();
            this.subscribers.delete(subscriberId);
            return true;
        }
        return false;
    }
    
    /**
     * Get historical trends for a user or leaderboard
     */
    async getHistoricalTrends(leaderboardType, userId = null, timeframe = 'monthly') {
        try {
            const cutoffDate = this.getTimeframeCutoff(timeframe);
            
            let query = this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores')
                .where('timestamp', '>=', cutoffDate);
            
            if (userId) {
                query = query.where('userId', '==', userId);
            }
            
            const snapshot = await query.orderBy('timestamp', 'asc').get();
            
            const trends = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                trends.push({
                    timestamp: data.timestamp,
                    score: data.score,
                    userId: data.userId,
                    username: data.username
                });
            });
            
            // Group by day/week/month for trend analysis
            const groupedTrends = this.groupTrendsByPeriod(trends, timeframe);
            
            return {
                leaderboardType,
                userId,
                timeframe,
                trends: groupedTrends,
                summary: this.calculateTrendSummary(groupedTrends)
            };
        } catch (error) {
            console.error('Error getting historical trends:', error);
            throw error;
        }
    }
    
    /**
     * Group trends by time period
     */
    groupTrendsByPeriod(trends, timeframe) {
        const grouped = {};
        
        trends.forEach(trend => {
            let period;
            const date = trend.timestamp.toDate ? trend.timestamp.toDate() : new Date(trend.timestamp);
            
            switch (timeframe) {
                case 'daily':
                    period = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    break;
                case 'weekly':
                    // Get week number
                    const year = date.getFullYear();
                    const week = this.getWeekNumber(date);
                    period = `${year}-W${week}`;
                    break;
                case 'monthly':
                    period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
                    break;
                default:
                    period = date.toISOString().split('T')[0];
            }
            
            if (!grouped[period]) {
                grouped[period] = {
                    period,
                    scores: [],
                    average: 0,
                    highest: 0,
                    lowest: Infinity,
                    count: 0
                };
            }
            
            grouped[period].scores.push(trend.score);
            grouped[period].highest = Math.max(grouped[period].highest, trend.score);
            grouped[period].lowest = Math.min(grouped[period].lowest, trend.score);
            grouped[period].count++;
        });
        
        // Calculate averages
        Object.values(grouped).forEach(period => {
            period.average = period.scores.reduce((sum, score) => sum + score, 0) / period.scores.length;
        });
        
        return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
    }
    
    /**
     * Calculate trend summary
     */
    calculateTrendSummary(groupedTrends) {
        if (groupedTrends.length === 0) return null;
        
        const latest = groupedTrends[groupedTrends.length - 1];
        const previous = groupedTrends.length > 1 ? groupedTrends[groupedTrends.length - 2] : null;
        
        let trendDirection = 'neutral';
        let trendPercentage = 0;
        
        if (previous) {
            const prevAvg = previous.average;
            const currAvg = latest.average;
            trendPercentage = ((currAvg - prevAvg) / prevAvg) * 100;
            
            if (trendPercentage > 5) trendDirection = 'positive';
            else if (trendPercentage < -5) trendDirection = 'negative';
        }
        
        return {
            currentAverage: latest.average,
            currentHighest: latest.highest,
            currentLowest: latest.lowest,
            trendDirection,
            trendPercentage,
            totalPeriods: groupedTrends.length
        };
    }
    
    /**
     * Get week number for a date
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    /**
     * Get timeframe cutoff date
     */
    getTimeframeCutoff(timeframe) {
        const now = new Date();
        
        switch (timeframe) {
            case 'daily':
                now.setDate(now.getDate() - 1);
                break;
            case 'weekly':
                now.setDate(now.getDate() - 7);
                break;
            case 'monthly':
                now.setMonth(now.getMonth() - 1);
                break;
            case 'quarterly':
                now.setMonth(now.getMonth() - 3);
                break;
            case 'yearly':
                now.setFullYear(now.getFullYear() - 1);
                break;
            default:
                // For all_time, return a very old date
                return new Date(0);
        }
        
        return now;
    }
    
    /**
     * Update local cache for a leaderboard
     */
    async updateLocalCache(leaderboardType) {
        try {
            // Clear related cache entries
            for (const [key, value] of this.leaderboards.entries()) {
                if (key.startsWith(leaderboardType)) {
                    this.leaderboards.delete(key);
                }
            }
            
            // Clear user ranking cache for this leaderboard
            for (const [key, value] of this.currentUserRankings.entries()) {
                if (key.includes(leaderboardType)) {
                    this.currentUserRankings.delete(key);
                }
            }
        } catch (error) {
            console.error('Error updating local cache:', error);
        }
    }
    
    /**
     * Calculate percentile rank for a score
     */
    async calculatePercentileRank(leaderboardType, score, timeframe = 'all_time') {
        try {
            let query = this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores');
            
            if (timeframe !== 'all_time') {
                const cutoffDate = this.getTimeframeCutoff(timeframe);
                query = query.where('timestamp', '>=', cutoffDate);
            }
            
            const allScoresSnapshot = await query.get();
            const allScores = [];
            
            allScoresSnapshot.forEach(doc => {
                allScores.push(doc.data().score);
            });
            
            // Sort scores in descending order
            allScores.sort((a, b) => b - a);
            
            // Count scores higher than the given score
            const higherScores = allScores.filter(s => s > score).length;
            
            // Calculate percentile
            const percentile = allScores.length > 0 ? 
                Math.round(((allScores.length - higherScores) / allScores.length) * 100) : 0;
            
            return {
                score,
                percentile,
                totalCompetitors: allScores.length,
                rank: higherScores + 1
            };
        } catch (error) {
            console.error('Error calculating percentile rank:', error);
            throw error;
        }
    }
    
    /**
     * Get seasonal leaderboards (for gamification)
     */
    async getSeasonalLeaderboard(seasonId, leaderboardType = 'gamearena') {
        try {
            // In a real implementation, seasons would be stored separately
            // For now, we'll simulate a seasonal filter
            
            const startOfSeason = new Date(seasonId); // Assuming seasonId is a date string
            const endOfSeason = new Date(startOfSeason);
            endOfSeason.setMonth(endOfSeason.getMonth() + 3); // 3-month season
            
            const query = await this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores')
                .where('timestamp', '>=', startOfSeason)
                .where('timestamp', '<', endOfSeason)
                .orderBy('score', 'desc')
                .limit(50)
                .get();
            
            const scores = [];
            query.forEach(doc => {
                const data = doc.data();
                scores.push({
                    id: doc.id,
                    ...data
                });
            });
            
            return {
                seasonId,
                leaderboardType,
                entries: scores.map((score, index) => ({ ...score, rank: index + 1 })),
                totalEntries: scores.length,
                seasonStart: startOfSeason,
                seasonEnd: endOfSeason
            };
        } catch (error) {
            console.error('Error getting seasonal leaderboard:', error);
            throw error;
        }
    }
    
    /**
     * Award badges/achievements based on leaderboard performance
     */
    async awardAchievements(userId, leaderboardType, currentRank) {
        try {
            // Define achievement criteria
            const achievements = [
                { name: 'Top Performer', rankThreshold: 1, badge: 'gold-medal' },
                { name: 'High Achiever', rankThreshold: 5, badge: 'silver-medal' },
                { name: 'Contender', rankThreshold: 10, badge: 'bronze-medal' },
                { name: 'Consistent Player', rankThreshold: 25, badge: 'consistency-badge' }
            ];
            
            // Check which achievements the user qualifies for
            const earnedAchievements = achievements.filter(achievement => 
                currentRank <= achievement.rankThreshold
            );
            
            if (earnedAchievements.length > 0) {
                // Save achievements to user profile
                const userAchievementsRef = this.firebaseService.firestore.collection('users').doc(userId);
                
                // Add achievements to user profile
                await userAchievementsRef.update({
                    [`achievements.${leaderboardType}`]: this.firebaseService.firestore.FieldValue.arrayUnion(
                        ...earnedAchievements.map(a => ({
                            name: a.name,
                            badge: a.badge,
                            earnedAt: new Date(),
                            rank: currentRank
                        }))
                    )
                }).catch(async () => {
                    // If the field doesn't exist, create it
                    await userAchievementsRef.set({
                        [`achievements.${leaderboardType}`]: earnedAchievements.map(a => ({
                            name: a.name,
                            badge: a.badge,
                            earnedAt: new Date(),
                            rank: currentRank
                        }))
                    }, { merge: true });
                });
                
                console.log(`Awarded achievements to user ${userId}:`, earnedAchievements);
            }
            
            return earnedAchievements;
        } catch (error) {
            console.error('Error awarding achievements:', error);
            throw error;
        }
    }
    
    /**
     * Get user's achievements
     */
    async getUserAchievements(userId, leaderboardType = null) {
        try {
            const userRef = this.firebaseService.firestore.collection('users').doc(userId);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                return [];
            }
            
            const userData = userDoc.data();
            if (!userData.achievements) {
                return [];
            }
            
            if (leaderboardType) {
                return userData.achievements[leaderboardType] || [];
            } else {
                // Combine all achievements
                return Object.values(userData.achievements).flat();
            }
        } catch (error) {
            console.error('Error getting user achievements:', error);
            throw error;
        }
    }
    
    /**
     * Purge old leaderboard entries (maintenance)
     */
    async purgeOldEntries(leaderboardType, cutoffDate) {
        try {
            // This would typically be done via a Cloud Function due to limitations
            // For this implementation, we'll just log the intended action
            
            console.log(`Purging entries older than ${cutoffDate} for leaderboard ${leaderboardType}`);
            
            // In a real implementation, you would need to:
            // 1. Query for documents older than cutoffDate
            // 2. Delete them in batches (due to Firestore limitations)
            // 3. Handle the asynchronous nature of batch operations
            
            return {
                success: true,
                message: 'Purge operation initiated (would run via Cloud Function in production)'
            };
        } catch (error) {
            console.error('Error purging old entries:', error);
            throw error;
        }
    }
    
    /**
     * Get leaderboard statistics
     */
    async getLeaderboardStats(leaderboardType, timeframe = 'all_time') {
        try {
            let query = this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores');
            
            if (timeframe !== 'all_time') {
                const cutoffDate = this.getTimeframeCutoff(timeframe);
                query = query.where('timestamp', '>=', cutoffDate);
            }
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                return {
                    leaderboardType,
                    timeframe,
                    totalEntries: 0,
                    participantCount: 0,
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0
                };
            }
            
            const scores = [];
            const userIds = new Set();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                scores.push(data.score);
                userIds.add(data.userId);
            });
            
            const stats = {
                leaderboardType,
                timeframe,
                totalEntries: scores.length,
                participantCount: userIds.size,
                averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
                highestScore: Math.max(...scores),
                lowestScore: Math.min(...scores),
                medianScore: this.calculateMedian(scores)
            };
            
            return stats;
        } catch (error) {
            console.error('Error getting leaderboard stats:', error);
            throw error;
        }
    }
    
    /**
     * Calculate median of an array
     */
    calculateMedian(values) {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    }
    
    /**
     * Cleanup the leaderboards service
     */
    cleanup() {
        // Unsubscribe from all subscriptions
        for (const [id, subscriber] of this.subscribers.entries()) {
            subscriber.unsubscribe();
        }
        this.subscribers.clear();
        
        // Clear caches
        this.leaderboards.clear();
        this.currentUserRankings.clear();
        this.updateIntervals.clear();
        this.refreshTimeouts.clear();
    }
    
    /**
     * Refresh leaderboard data
     */
    async refreshLeaderboard(leaderboardType) {
        try {
            // Clear cache for this leaderboard
            for (const [key, value] of this.leaderboards.entries()) {
                if (key.startsWith(leaderboardType)) {
                    this.leaderboards.delete(key);
                }
            }
            
            // The next getLeaderboard call will fetch fresh data
            console.log(`Leaderboard ${leaderboardType} marked for refresh`);
        } catch (error) {
            console.error('Error refreshing leaderboard:', error);
        }
    }
    
    /**
     * Export leaderboard data
     */
    async exportLeaderboard(leaderboardType, options = {}) {
        try {
            const {
                timeframe = 'all_time',
                format = 'json', // 'json', 'csv'
                includeMetadata = true
            } = options;
            
            const allScoresQuery = await this.firebaseService.firestore.collection('leaderboards')
                .doc(leaderboardType)
                .collection('scores');
            
            if (timeframe !== 'all_time') {
                const cutoffDate = this.getTimeframeCutoff(timeframe);
                allScoresQuery.where('timestamp', '>=', cutoffDate);
            }
            
            const snapshot = await allScoresQuery.orderBy('score', 'desc').get();
            
            const scores = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                scores.push({
                    id: doc.id,
                    userId: data.userId,
                    username: data.username,
                    score: data.score,
                    timestamp: data.timestamp,
                    ...includeMetadata ? data.metadata : {}
                });
            });
            
            // Add ranks
            const rankedScores = scores.map((score, index) => ({
                ...score,
                rank: index + 1
            }));
            
            if (format === 'csv') {
                return this.convertToCSV(rankedScores);
            } else {
                return {
                    leaderboardType,
                    timeframe,
                    exportDate: new Date(),
                    entries: rankedScores
                };
            }
        } catch (error) {
            console.error('Error exporting leaderboard:', error);
            throw error;
        }
    }
    
    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                // Escape commas and quotes in values
                if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }
}

// Export the service
export default PersistentLeaderboardsService;