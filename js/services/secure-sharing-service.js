/**
 * Secure Sharing Service
 * 
 * This service handles password-protected and expiring links for shared content
 * in the educational platform.
 */

class SecureSharingService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.encryptionKey = null;
        this.activeShares = new Map();
        this.shareValidationCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    /**
     * Initialize the service
     */
    initialize() {
        // Generate or retrieve encryption key
        this.encryptionKey = this.getEncryptionKey();
        console.log('Secure sharing service initialized');
    }
    
    /**
     * Get or create encryption key
     */
    getEncryptionKey() {
        // In a real implementation, this would securely retrieve the key
        // For now, we'll use a placeholder key
        let key = localStorage.getItem('secure-sharing-key');
        if (!key) {
            key = this.generateEncryptionKey();
            localStorage.setItem('secure-sharing-key', key);
        }
        return key;
    }
    
    /**
     * Generate a random encryption key
     */
    generateEncryptionKey() {
        // Generate a random string for encryption purposes
        // Note: This is a simplified approach - a real implementation would use proper crypto
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * Create a password-protected share link
     */
    async createPasswordProtectedShare(contentId, password, expirationHours = 24) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to create protected shares');
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const shareId = this.generateShareId();
            const expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
            
            // Hash the password (in a real implementation, use proper hashing)
            const hashedPassword = await this.hashPassword(password);
            
            // Create share record
            const shareData = {
                id: shareId,
                contentId: contentId,
                userId: userId,
                hashedPassword: hashedPassword,
                expiresAt: expiresAt,
                createdAt: new Date(),
                accessCount: 0,
                maxAccessCount: 100, // Limit number of accesses
                isActive: true
            };
            
            // Save to Firestore
            const shareRef = this.firebaseService.firestore.collection('shares').doc(shareId);
            await shareRef.set(shareData);
            
            // Generate the share URL
            const shareUrl = `${window.location.origin}/share/${shareId}`;
            
            console.log(`Password-protected share created: ${shareUrl}`);
            
            return {
                shareId,
                shareUrl,
                expiresAt,
                success: true
            };
        } catch (error) {
            console.error('Error creating password-protected share:', error);
            throw error;
        }
    }
    
    /**
     * Create an expiring share link without password
     */
    async createExpiringShare(contentId, expirationHours = 24) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to create shares');
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const shareId = this.generateShareId();
            const expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
            
            // Create share record without password
            const shareData = {
                id: shareId,
                contentId: contentId,
                userId: userId,
                expiresAt: expiresAt,
                createdAt: new Date(),
                accessCount: 0,
                maxAccessCount: 50, // Limit number of accesses for public shares
                isActive: true,
                requiresPassword: false
            };
            
            // Save to Firestore
            const shareRef = this.firebaseService.firestore.collection('shares').doc(shareId);
            await shareRef.set(shareData);
            
            // Generate the share URL
            const shareUrl = `${window.location.origin}/share/${shareId}`;
            
            console.log(`Expiring share created: ${shareUrl}`);
            
            return {
                shareId,
                shareUrl,
                expiresAt,
                success: true
            };
        } catch (error) {
            console.error('Error creating expiring share:', error);
            throw error;
        }
    }
    
    /**
     * Validate a share link and check password if required
     */
    async validateShare(shareId, password = null) {
        try {
            // Check cache first
            const cacheKey = `${shareId}_${password || 'nopass'}`;
            const cachedResult = this.shareValidationCache.get(cacheKey);
            
            if (cachedResult && Date.now() < cachedResult.expires) {
                return cachedResult.data;
            }
            
            // Get share from Firestore
            const shareRef = this.firebaseService.firestore.collection('shares').doc(shareId);
            const doc = await shareRef.get();
            
            if (!doc.exists) {
                const result = { valid: false, reason: 'Share not found' };
                this.cacheValidationResult(cacheKey, result);
                return result;
            }
            
            const shareData = doc.data();
            
            // Check if share is active
            if (!shareData.isActive) {
                const result = { valid: false, reason: 'Share is inactive' };
                this.cacheValidationResult(cacheKey, result);
                return result;
            }
            
            // Check expiration
            const now = new Date();
            const expiresAt = shareData.expiresAt.toDate ? shareData.expiresAt.toDate() : new Date(shareData.expiresAt);
            
            if (now > expiresAt) {
                // Mark as inactive
                await shareRef.update({ isActive: false });
                const result = { valid: false, reason: 'Share has expired' };
                this.cacheValidationResult(cacheKey, result);
                return result;
            }
            
            // Check access count
            if (shareData.accessCount >= (shareData.maxAccessCount || 100)) {
                await shareRef.update({ isActive: false });
                const result = { valid: false, reason: 'Maximum access count reached' };
                this.cacheValidationResult(cacheKey, result);
                return result;
            }
            
            // Check if password is required
            if (shareData.hashedPassword) {
                if (!password) {
                    const result = { valid: false, reason: 'Password required', requiresPassword: true };
                    this.cacheValidationResult(cacheKey, result);
                    return result;
                }
                
                // Verify password
                const isValidPassword = await this.verifyPassword(password, shareData.hashedPassword);
                if (!isValidPassword) {
                    const result = { valid: false, reason: 'Invalid password' };
                    this.cacheValidationResult(cacheKey, result);
                    return result;
                }
            }
            
            // Increment access count
            await shareRef.update({ 
                accessCount: this.firebaseService.firestore.FieldValue.increment(1),
                lastAccessed: new Date()
            });
            
            // Return valid share data
            const result = {
                valid: true,
                contentId: shareData.contentId,
                userId: shareData.userId,
                shareData: shareData
            };
            
            this.cacheValidationResult(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error validating share:', error);
            return { valid: false, reason: 'Validation error' };
        }
    }
    
    /**
     * Get share information (for the owner)
     */
    async getShareInfo(shareId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to access share info');
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const shareRef = this.firebaseService.firestore.collection('shares').doc(shareId);
            const doc = await shareRef.get();
            
            if (!doc.exists) {
                throw new Error('Share not found');
            }
            
            const shareData = doc.data();
            
            // Verify ownership
            if (shareData.userId !== userId) {
                throw new Error('Unauthorized: Not the owner of this share');
            }
            
            return {
                id: shareData.id,
                contentId: shareData.contentId,
                requiresPassword: !!shareData.hashedPassword,
                expiresAt: shareData.expiresAt,
                createdAt: shareData.createdAt,
                accessCount: shareData.accessCount,
                maxAccessCount: shareData.maxAccessCount,
                isActive: shareData.isActive
            };
        } catch (error) {
            console.error('Error getting share info:', error);
            throw error;
        }
    }
    
    /**
     * Revoke a share link
     */
    async revokeShare(shareId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to revoke shares');
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const shareRef = this.firebaseService.firestore.collection('shares').doc(shareId);
            const doc = await shareRef.get();
            
            if (!doc.exists) {
                throw new Error('Share not found');
            }
            
            const shareData = doc.data();
            
            // Verify ownership
            if (shareData.userId !== userId) {
                throw new Error('Unauthorized: Not the owner of this share');
            }
            
            // Mark as inactive
            await shareRef.update({ 
                isActive: false,
                revokedAt: new Date(),
                revokedBy: userId
            });
            
            console.log(`Share ${shareId} revoked`);
            return { success: true };
        } catch (error) {
            console.error('Error revoking share:', error);
            throw error;
        }
    }
    
    /**
     * Update share settings (password, expiration, etc.)
     */
    async updateShare(shareId, updates) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to update shares');
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            const shareRef = this.firebaseService.firestore.collection('shares').doc(shareId);
            const doc = await shareRef.get();
            
            if (!doc.exists) {
                throw new Error('Share not found');
            }
            
            const shareData = doc.data();
            
            // Verify ownership
            if (shareData.userId !== userId) {
                throw new Error('Unauthorized: Not the owner of this share');
            }
            
            // Prepare updates
            const preparedUpdates = {};
            
            if (updates.password !== undefined) {
                if (updates.password) {
                    preparedUpdates.hashedPassword = await this.hashPassword(updates.password);
                } else {
                    preparedUpdates.hashedPassword = null; // Remove password
                }
            }
            
            if (updates.expirationHours !== undefined) {
                const newExpiresAt = new Date(Date.now() + (updates.expirationHours * 60 * 60 * 1000));
                preparedUpdates.expiresAt = newExpiresAt;
            }
            
            if (updates.maxAccessCount !== undefined) {
                preparedUpdates.maxAccessCount = updates.maxAccessCount;
            }
            
            // Add updated timestamp
            preparedUpdates.updatedAt = new Date();
            
            // Apply updates
            await shareRef.update(preparedUpdates);
            
            console.log(`Share ${shareId} updated`);
            return { success: true };
        } catch (error) {
            console.error('Error updating share:', error);
            throw error;
        }
    }
    
    /**
     * Get user's active shares
     */
    async getUserShares(userId = null) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to get shares');
        }
        
        try {
            const currentUserId = userId || this.firebaseService.getCurrentUser().uid;
            const sharesSnapshot = await this.firebaseService.firestore
                .collection('shares')
                .where('userId', '==', currentUserId)
                .orderBy('createdAt', 'desc')
                .limit(50) // Limit to prevent huge result sets
                .get();
            
            const shares = [];
            sharesSnapshot.forEach(doc => {
                const data = doc.data();
                shares.push({
                    id: data.id,
                    contentId: data.contentId,
                    requiresPassword: !!data.hashedPassword,
                    expiresAt: data.expiresAt,
                    createdAt: data.createdAt,
                    accessCount: data.accessCount,
                    maxAccessCount: data.maxAccessCount,
                    isActive: data.isActive
                });
            });
            
            return shares;
        } catch (error) {
            console.error('Error getting user shares:', error);
            throw error;
        }
    }
    
    /**
     * Generate a unique share ID
     */
    generateShareId() {
        // Create a unique identifier for the share
        return 'share_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Hash a password (simplified implementation)
     */
    async hashPassword(password) {
        // Note: This is a simplified hash for demonstration
        // A real implementation would use proper cryptographic hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(password + this.encryptionKey);
        
        // In a real implementation, use crypto.subtle.digest or a proper hashing library
        // For now, we'll just use a simple approach
        let hash = 0;
        const str = Array.from(data).map(byte => String.fromCharCode(byte)).join('');
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return hash.toString();
    }
    
    /**
     * Verify a password against its hash
     */
    async verifyPassword(password, hashedPassword) {
        const hash = await this.hashPassword(password);
        return hash === hashedPassword;
    }
    
    /**
     * Cache validation result
     */
    cacheValidationResult(cacheKey, result) {
        this.shareValidationCache.set(cacheKey, {
            data: result,
            expires: Date.now() + this.cacheTimeout
        });
    }
    
    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.shareValidationCache.entries()) {
            if (now > value.expires) {
                this.shareValidationCache.delete(key);
            }
        }
    }
    
    /**
     * Create a secure embed code for the content
     */
    createSecureEmbedCode(shareId, options = {}) {
        const {
            width = '100%',
            height = '600px',
            allowFullscreen = true,
            hideBranding = false
        } = options;
        
        const embedUrl = `${window.location.origin}/embed/${shareId}`;
        
        let iframeAttrs = `src="${embedUrl}" width="${width}" height="${height}"`;
        if (allowFullscreen) {
            iframeAttrs += ' allowfullscreen';
        }
        
        const embedCode = `<iframe ${iframeAttrs}></iframe>`;
        
        return {
            embedCode,
            embedUrl,
            previewHtml: `<div class="secure-embed-container">${embedCode}</div>`
        };
    }
    
    /**
     * Validate and log access to shared content
     */
    async logShareAccess(shareId, accessInfo = {}) {
        try {
            const accessLogRef = this.firebaseService.firestore.collection('share_access_logs').doc();
            const logData = {
                shareId,
                timestamp: new Date(),
                ip: accessInfo.ip || null,
                userAgent: accessInfo.userAgent || null,
                referrer: accessInfo.referrer || null,
                country: accessInfo.country || null
            };
            
            await accessLogRef.set(logData);
            
            console.log(`Access logged for share: ${shareId}`);
        } catch (error) {
            console.error('Error logging share access:', error);
        }
    }
    
    /**
     * Get share analytics
     */
    async getShareAnalytics(shareId) {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            throw new Error('User must be authenticated to get analytics');
        }
        
        try {
            const userId = this.firebaseService.getCurrentUser().uid;
            
            // Verify ownership
            const shareRef = this.firebaseService.firestore.collection('shares').doc(shareId);
            const shareDoc = await shareRef.get();
            
            if (!shareDoc.exists || shareDoc.data().userId !== userId) {
                throw new Error('Unauthorized or share not found');
            }
            
            // Get access logs
            const logsSnapshot = await this.firebaseService.firestore
                .collection('share_access_logs')
                .where('shareId', '==', shareId)
                .orderBy('timestamp', 'desc')
                .limit(1000)
                .get();
            
            const accesses = [];
            let uniqueVisitors = new Set();
            
            logsSnapshot.forEach(doc => {
                const data = doc.data();
                accesses.push({
                    timestamp: data.timestamp,
                    ip: data.ip,
                    userAgent: data.userAgent,
                    referrer: data.referrer
                });
                
                if (data.ip) {
                    uniqueVisitors.add(data.ip);
                }
            });
            
            // Calculate analytics
            const analytics = {
                totalAccesses: accesses.length,
                uniqueVisitors: uniqueVisitors.size,
                firstAccess: accesses.length > 0 ? accesses[accesses.length - 1].timestamp : null,
                lastAccess: accesses.length > 0 ? accesses[0].timestamp : null,
                accesses: accesses
            };
            
            return analytics;
        } catch (error) {
            console.error('Error getting share analytics:', error);
            throw error;
        }
    }
    
    /**
     * Cleanup expired shares periodically
     */
    async cleanupExpiredShares() {
        try {
            // Query for expired but still active shares
            const now = new Date();
            const expiredSharesSnapshot = await this.firebaseService.firestore
                .collection('shares')
                .where('expiresAt', '<=', now)
                .where('isActive', '==', true)
                .get();
            
            const batch = this.firebaseService.firestore.batch();
            let count = 0;
            
            expiredSharesSnapshot.forEach(doc => {
                batch.update(doc.ref, { isActive: false, expiredAt: now });
                count++;
            });
            
            if (count > 0) {
                await batch.commit();
                console.log(`Deactivated ${count} expired shares`);
            }
        } catch (error) {
            console.error('Error cleaning up expired shares:', error);
        }
    }
    
    /**
     * Schedule periodic cleanup
     */
    scheduleCleanup() {
        // Run cleanup every hour
        setInterval(() => {
            this.cleanupExpiredShares();
            this.cleanupCache();
        }, 60 * 60 * 1000); // Every hour
        
        // Run initial cleanup
        setTimeout(() => {
            this.cleanupExpiredShares();
        }, 30000); // After 30 seconds
    }
    
    /**
     * Get share URL with custom domain (if configured)
     */
    getPublicShareUrl(shareId) {
        // In a real implementation, this might use a custom domain
        // For now, return the standard URL
        return `${window.location.origin}/share/${shareId}`;
    }
    
    /**
     * Cleanup the service
     */
    cleanup() {
        // Clear caches
        this.shareValidationCache.clear();
        
        // Clear intervals if any
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Export the service
export default SecureSharingService;