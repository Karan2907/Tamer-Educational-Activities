/**
 * Main Application Entry Point
 * 
 * This file initializes the entire educational platform application.
 * It sets up the core components and starts the application.
 */

// Import core components
import EducationalPlatform from './core/app.js';
import templateRegistry from './core/template-registry.js';
import FirebaseService from './services/firebase-service.js';

// Import templates
import MCQTemplate from './templates/mcq-template.js';

// Import utilities
import { createNewActivity } from './core/schema.js';

class MainApplication {
    constructor() {
        this.platform = null;
        this.firebaseService = null;
        this.templateRegistry = templateRegistry;
    }
    
    /**
     * Initialize the entire application
     */
    async initialize() {
        try {
            console.log('Initializing Main Application...');
            
            // Initialize Firebase service
            await this.initializeFirebase();
            
            // Register templates
            this.registerTemplates();
            
            // Initialize platform
            this.initializePlatform();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Load initial content
            await this.loadInitialContent();
            
            console.log('Main Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Main Application:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Initialize Firebase service
     */
    async initializeFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyCkT1kO2rS4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0",
            authDomain: "tamer-educational.firebaseapp.com",
            projectId: "tamer-educational",
            storageBucket: "tamer-educational.appspot.com",
            messagingSenderId: "123456789012",
            appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k1"
        };
        
        this.firebaseService = new FirebaseService(firebaseConfig);
        await this.firebaseService.initialize();
        
        console.log('Firebase service initialized');
    }
    
    /**
     * Register all templates
     */
    registerTemplates() {
        // Register MCQ template
        this.templateRegistry.register('mcq', MCQTemplate, {
            autoInitialize: false,
            lazyLoad: false
        });
        
        // Additional templates would be registered here
        // this.templateRegistry.register('truefalse', TrueFalseTemplate, {...});
        // this.templateRegistry.register('flipcards', FlipCardsTemplate, {...});
        // etc.
        
        console.log('Templates registered:', this.templateRegistry.getTemplateIds());
    }
    
    /**
     * Initialize platform
     */
    initializePlatform() {
        this.platform = new EducationalPlatform();
        window.platform = this.platform; // Make available globally
        
        console.log('Platform initialized');
    }
    
    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Handle before unload
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Handle errors
        window.addEventListener('error', this.handleError.bind(this));
        
        // Handle unhandled rejections
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        console.log('Global event listeners set up');
    }
    
    /**
     * Load initial content
     */
    async loadInitialContent() {
        // Load user data if authenticated
        if (this.firebaseService.isAuthenticated()) {
            console.log('User authenticated, loading user data...');
            // Load user activities, preferences, etc.
        } else {
            console.log('No user authenticated, loading default content...');
            // Load default templates or guest content
        }
        
        // Initialize UI components
        this.initializeUI();
    }
    
    /**
     * Initialize UI components
     */
    initializeUI() {
        // Initialize theme
        this.initializeTheme();
        
        // Initialize navigation
        this.initializeNavigation();
        
        // Initialize template selector
        this.initializeTemplateSelector();
        
        console.log('UI components initialized');
    }
    
    /**
     * Initialize theme system
     */
    initializeTheme() {
        // Theme initialization logic
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    /**
     * Initialize navigation
     */
    initializeNavigation() {
        // Navigation initialization logic
        console.log('Navigation initialized');
    }
    
    /**
     * Initialize template selector
     */
    initializeTemplateSelector() {
        // Template selector initialization logic
        console.log('Template selector initialized');
    }
    
    /**
     * Handle window resize
     */
    handleResize(event) {
        // Responsive handling logic
        console.log('Window resized');
    }
    
    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        // Save current state, show confirmation if needed
        console.log('Before unload');
    }
    
    /**
     * Handle global errors
     */
    handleError(event) {
        console.error('Global error:', event.error);
        // Error reporting logic
    }
    
    /**
     * Handle unhandled rejections
     */
    handleUnhandledRejection(event) {
        console.error('Unhandled rejection:', event.reason);
        // Error reporting logic
    }
    
    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        // Error handling and recovery logic
        console.error('Initialization error:', error);
        
        // Show error message to user
        this.showErrorMessage('Failed to initialize application. Please refresh the page.');
    }
    
    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        // Simple error display - would be replaced with proper UI component
        alert(`Error: ${message}`);
    }
    
    /**
     * Create new activity
     */
    async createNewActivity(templateType, title = 'New Activity') {
        try {
            const activityData = createNewActivity(templateType, title);
            
            // Save to Firebase if user is authenticated
            if (this.firebaseService.isAuthenticated()) {
                await this.firebaseService.saveActivity(activityData);
            }
            
            return activityData;
        } catch (error) {
            console.error('Failed to create new activity:', error);
            throw error;
        }
    }
    
    /**
     * Load activity
     */
    async loadActivity(activityId) {
        try {
            if (this.firebaseService.isAuthenticated()) {
                return await this.firebaseService.loadActivity(activityId);
            } else {
                throw new Error('User not authenticated');
            }
        } catch (error) {
            console.error('Failed to load activity:', error);
            throw error;
        }
    }
    
    /**
     * Get template instance
     */
    getTemplateInstance(templateId, containerId) {
        return this.templateRegistry.getInstance(templateId) || 
               this.templateRegistry.createInstance(templateId, containerId);
    }
    
    /**
     * Destroy application
     */
    destroy() {
        // Cleanup logic
        if (this.platform) {
            this.platform.destroy();
        }
        
        this.templateRegistry.destroyAllInstances();
        
        console.log('Main Application destroyed');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new MainApplication();
    window.mainApp = app; // Make available globally for debugging
    
    try {
        await app.initialize();
        console.log('Application is ready');
    } catch (error) {
        console.error('Failed to start application:', error);
    }
});

// Export for module usage
export default MainApplication;