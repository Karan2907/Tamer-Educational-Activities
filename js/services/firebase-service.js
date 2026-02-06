/**
 * Firebase Service
 * 
 * This service handles all Firebase interactions including:
 * - Authentication
 * - Firestore database operations
 * - Storage operations
 * - Real-time data synchronization
 */

class FirebaseService {
    constructor(config) {
        this.config = config;
        this.app = null;
        this.auth = null;
        this.firestore = null;
        this.storage = null;
        this.initialized = false;
        this.currentUser = null;
        this.authObservers = [];
        this.connectionObservers = [];
    }
    
    /**
     * Initialize Firebase services
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        
        try {
            // Import Firebase modules dynamically
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
            const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
            const { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js');
            
            // Initialize Firebase app
            this.app = initializeApp(this.config);
            
            // Initialize services
            this.auth = getAuth(this.app);
            this.firestore = getFirestore(this.app);
            this.storage = getStorage(this.app);
            
            // Set up auth state observer
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                this.notifyAuthObservers(user);
            });
            
            this.initialized = true;
            console.log('Firebase services initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            throw error;
        }
    }
    
    /**
     * Check if Firebase is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Authentication methods
     */
    
    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        return userCredential.user;
    }
    
    /**
     * Sign up with email and password
     */
    async signUp(email, password) {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        return userCredential.user;
    }
    
    /**
     * Sign out
     */
    async signOut() {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        const { signOut } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
        await signOut(this.auth);
    }
    
    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        if (!this.auth) {
            throw new Error('Firebase Auth not initialized');
        }
        
        const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
        await sendPasswordResetEmail(this.auth, email);
    }
    
    /**
     * Firestore methods
     */
    
    /**
     * Save activity data
     */
    async saveActivity(activityData) {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const activityId = activityData.metadata.id;
        const activityRef = doc(this.firestore, 'users', this.currentUser.uid, 'activities', activityId);
        
        const saveData = {
            ...activityData,
            metadata: {
                ...activityData.metadata,
                updatedAt: serverTimestamp()
            }
        };
        
        await setDoc(activityRef, saveData, { merge: true });
        return activityId;
    }
    
    /**
     * Load activity data
     */
    async loadActivity(activityId) {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const activityRef = doc(this.firestore, 'users', this.currentUser.uid, 'activities', activityId);
        const docSnap = await getDoc(activityRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            throw new Error(`Activity ${activityId} not found`);
        }
    }
    
    /**
     * List all activities for current user
     */
    async listActivities() {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const activitiesRef = collection(this.firestore, 'users', this.currentUser.uid, 'activities');
        const q = query(activitiesRef, orderBy('metadata.updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const activities = [];
        querySnapshot.forEach((doc) => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        
        return activities;
    }
    
    /**
     * Delete activity
     */
    async deleteActivity(activityId) {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const activityRef = doc(this.firestore, 'users', this.currentUser.uid, 'activities', activityId);
        await deleteDoc(activityRef);
    }
    
    /**
     * Save user progress
     */
    async saveProgress(activityId, progressData) {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const progressRef = doc(this.firestore, 'users', this.currentUser.uid, 'progress', activityId);
        
        const saveData = {
            activityId,
            ...progressData,
            updatedAt: serverTimestamp()
        };
        
        await setDoc(progressRef, saveData, { merge: true });
    }
    
    /**
     * Load user progress
     */
    async loadProgress(activityId) {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const progressRef = doc(this.firestore, 'users', this.currentUser.uid, 'progress', activityId);
        const docSnap = await getDoc(progressRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    }
    
    /**
     * Save sharing settings
     */
    async saveSharingSettings(activityId, settings) {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const sharingRef = doc(this.firestore, 'users', this.currentUser.uid, 'sharing', activityId);
        
        const saveData = {
            activityId,
            ...settings,
            createdAt: serverTimestamp()
        };
        
        await setDoc(sharingRef, saveData, { merge: true });
    }
    
    /**
     * Load sharing settings
     */
    async loadSharingSettings(activityId) {
        if (!this.firestore || !this.currentUser) {
            throw new Error('Firestore not initialized or user not authenticated');
        }
        
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        
        const sharingRef = doc(this.firestore, 'users', this.currentUser.uid, 'sharing', activityId);
        const docSnap = await getDoc(sharingRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    }
    
    /**
     * Storage methods
     */
    
    /**
     * Upload file
     */
    async uploadFile(file, path) {
        if (!this.storage || !this.currentUser) {
            throw new Error('Storage not initialized or user not authenticated');
        }
        
        const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js');
        
        const storageRef = ref(this.storage, `users/${this.currentUser.uid}/${path}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
            url: downloadURL,
            path: snapshot.ref.fullPath
        };
    }
    
    /**
     * Delete file
     */
    async deleteFile(path) {
        if (!this.storage || !this.currentUser) {
            throw new Error('Storage not initialized or user not authenticated');
        }
        
        const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js');
        
        const storageRef = ref(this.storage, `users/${this.currentUser.uid}/${path}`);
        await deleteObject(storageRef);
    }
    
    /**
     * Observer methods
     */
    
    /**
     * Add auth state observer
     */
    addAuthObserver(callback) {
        this.authObservers.push(callback);
        // Immediately notify with current user state
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }
    
    /**
     * Remove auth state observer
     */
    removeAuthObserver(callback) {
        const index = this.authObservers.indexOf(callback);
        if (index > -1) {
            this.authObservers.splice(index, 1);
        }
    }
    
    /**
     * Notify auth observers
     */
    notifyAuthObservers(user) {
        this.authObservers.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error in auth observer:', error);
            }
        });
    }
    
    /**
     * Add connection state observer
     */
    addConnectionObserver(callback) {
        this.connectionObservers.push(callback);
    }
    
    /**
     * Remove connection state observer
     */
    removeConnectionObserver(callback) {
        const index = this.connectionObservers.indexOf(callback);
        if (index > -1) {
            this.connectionObservers.splice(index, 1);
        }
    }
    
    /**
     * Utility methods
     */
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    /**
     * Get user ID
     */
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }
    
    /**
     * Get user email
     */
    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }
}

// Export the service
export default FirebaseService;