/**
 * SCORM Viewer Template
 * 
 * This template handles the display and interaction with SCORM packages.
 * It integrates with the bookmarking service to track progress and completion.
 */

import { BaseTemplate } from '../core/base-template.js';
import SCORMBookmarkingService from './scorm-bookmarking-service.js';

export class SCORMViewerTemplate extends BaseTemplate {
    constructor(templateId, containerId) {
        super(templateId, containerId);
        this.bookmarkingService = null;
        this.currentSessionId = null;
        this.scormAPI = null;
        this.iframe = null;
        this.packageLoaded = false;
        this.sessionActive = false;
    }
    
    /**
     * Initialize the template with bookmarking service
     */
    async initialize(data = null, firebaseService = null) {
        if (firebaseService) {
            this.bookmarkingService = new SCORMBookmarkingService(firebaseService);
        }
        
        await super.initialize(data);
    }
    
    /**
     * Get template HTML
     */
    async getTemplateHTML() {
        if (this.mode === 'play') {
            return this.getPlayModeHTML();
        } else {
            return this.getEditModeHTML();
        }
    }
    
    /**
     * Get play mode HTML
     */
    getPlayModeHTML() {
        const scormUrl = this.activityData?.scormUrl || '';
        const title = this.activityData?.metadata?.title || 'SCORM Package';
        const description = this.activityData?.metadata?.description || 'Interactive learning content';
        
        return `
            <div class="scorm-viewer-play-mode">
                <div class="activity-header mb-6">
                    <h2 class="text-2xl font-bold mb-2">${title}</h2>
                    <p class="text-muted">${description}</p>
                </div>
                
                <div class="scorm-container card p-0 mb-6" style="position: relative; overflow: hidden;">
                    ${scormUrl ? `
                        <iframe 
                            id="scorm-iframe"
                            src="${scormUrl}" 
                            style="width: 100%; height: ${this.activityData?.height || '600px'}; border: none;"
                            frameborder="0"
                            allow="autoplay; fullscreen"
                            allowfullscreen
                            title="SCORM Package Viewer"
                        ></iframe>
                        
                        <div class="scorm-controls absolute top-4 right-4 z-10 flex gap-2">
                            <button class="btn btn-sm btn-secondary" id="scorm-restart" title="Restart Package">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" id="scorm-progress" title="View Progress">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                        </div>
                        
                        <div class="scorm-status absolute bottom-4 left-4 z-10 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
                            <span id="scorm-status-text">Loading...</span>
                        </div>
                    ` : `
                        <div class="no-package card p-8 text-center">
                            <i class="fas fa-file-import text-4xl text-muted mb-4"></i>
                            <h3 class="text-xl font-bold mb-2">No SCORM Package Selected</h3>
                            <p class="text-muted">Please select or upload a SCORM package to view.</p>
                        </div>
                    `}
                </div>
                
                <div class="progress-tracking card p-6 mb-6 hidden" id="progress-tracking">
                    <h3 class="text-lg font-bold mb-4">Progress Tracking</h3>
                    <div class="progress-info grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div class="card p-3 text-center">
                            <div class="text-2xl font-bold" id="progress-value">0%</div>
                            <div class="text-sm text-muted">Progress</div>
                        </div>
                        <div class="card p-3 text-center">
                            <div class="text-2xl font-bold" id="status-value">-</div>
                            <div class="text-sm text-muted">Status</div>
                        </div>
                        <div class="card p-3 text-center">
                            <div class="text-2xl font-bold" id="score-value">-</div>
                            <div class="text-sm text-muted">Score</div>
                        </div>
                        <div class="card p-3 text-center">
                            <div class="text-2xl font-bold" id="time-value">0s</div>
                            <div class="text-sm text-muted">Time</div>
                        </div>
                    </div>
                    <div class="session-info text-sm text-muted">
                        <p><strong>Session:</strong> <span id="session-id">-</span></p>
                        <p><strong>Last Saved:</strong> <span id="last-saved">-</span></p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get edit mode HTML
     */
    getEditModeHTML() {
        const scormUrl = this.activityData?.scormUrl || '';
        const title = this.activityData?.metadata?.title || 'New SCORM Package';
        const description = this.activityData?.metadata?.description || '';
        const width = this.activityData?.width || '100%';
        const height = this.activityData?.height || '600px';
        
        return `
            <div class="scorm-viewer-edit-mode">
                <div class="activity-header mb-6">
                    <h2 class="text-2xl font-bold mb-2">Edit SCORM Package</h2>
                    <p class="text-muted">Configure your SCORM package settings.</p>
                </div>
                
                <div class="configuration-card card p-6 mb-6">
                    <h3 class="text-lg font-bold mb-4">Package Configuration</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Package Title</label>
                                <input type="text" id="package-title" value="${title}"
                                       class="w-full px-3 py-2 border rounded-lg"
                                       placeholder="Enter package title">
                            </div>
                            
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Description</label>
                                <textarea id="package-description" rows="3"
                                         class="w-full px-3 py-2 border rounded-lg"
                                         placeholder="Enter package description">${description}</textarea>
                            </div>
                        </div>
                        
                        <div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">SCORM Package URL</label>
                                <input type="text" id="scorm-url" value="${scormUrl}"
                                       class="w-full px-3 py-2 border rounded-lg"
                                       placeholder="Enter path to SCORM package (imsmanifest.xml location)">
                                <p class="text-xs text-muted mt-1">Path to the SCORM package directory</p>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">Width</label>
                                    <input type="text" id="package-width" value="${width}"
                                           class="w-full px-3 py-2 border rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-2">Height</label>
                                    <input type="text" id="package-height" value="${height}"
                                           class="w-full px-3 py-2 border rounded-lg">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end mt-6">
                        <button class="btn btn-primary" id="save-package-config">
                            <i class="fas fa-save mr-2"></i>Save Configuration
                        </button>
                    </div>
                </div>
                
                <div class="available-packages card p-6">
                    <h3 class="text-lg font-bold mb-4">Available Packages</h3>
                    <div class="packages-list" id="packages-list">
                        <div class="text-center py-8 text-muted">
                            <i class="fas fa-search text-2xl mb-2"></i>
                            <p>Available SCORM packages will appear here after scanning.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Called after render completes
     */
    async afterRender() {
        if (this.mode === 'play') {
            await this.initializePlayMode();
        } else {
            this.initializeEditMode();
        }
    }
    
    /**
     * Initialize play mode
     */
    async initializePlayMode() {
        // Initialize SCORM session if we have a package and user is authenticated
        if (this.activityData?.scormUrl && this.bookmarkingService) {
            await this.initializeSCORMSession();
        }
        
        this.initializePlayEventListeners();
        this.updateProgressDisplay();
    }
    
    /**
     * Initialize SCORM session
     */
    async initializeSCORMSession() {
        try {
            const userId = window.platform?.getUser()?.uid || 'guest_' + Date.now();
            const activityId = this.activityData?.metadata?.id || 'scorm_' + Date.now();
            const packagePath = this.activityData.scormUrl;
            
            if (this.bookmarkingService) {
                // Try to restore existing session first
                this.currentSessionId = await this.bookmarkingService.restoreSession(userId, activityId);
                
                if (!this.currentSessionId) {
                    // Initialize new session
                    this.currentSessionId = await this.bookmarkingService.initializeSession(
                        userId, activityId, packagePath
                    );
                }
                
                this.sessionActive = true;
                
                // Update status display
                this.updateStatusDisplay('Session Active');
                
                // Set up periodic progress saving
                this.startProgressTracking();
            }
        } catch (error) {
            console.error('Failed to initialize SCORM session:', error);
            this.updateStatusDisplay('Session Error: ' + error.message);
        }
    }
    
    /**
     * Start progress tracking
     */
    startProgressTracking() {
        // Update progress display every 30 seconds
        setInterval(() => {
            if (this.sessionActive && this.currentSessionId) {
                this.updateProgressDisplay();
            }
        }, 30000); // Every 30 seconds
        
        // Also update when visibility changes (tab focus/unfocus)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.sessionActive && this.currentSessionId) {
                this.updateProgressDisplay();
            }
        });
    }
    
    /**
     * Update progress display
     */
    updateProgressDisplay() {
        if (!this.bookmarkingService || !this.currentSessionId) {
            return;
        }
        
        try {
            const sessionSummary = this.bookmarkingService.getSessionSummary(this.currentSessionId);
            if (sessionSummary) {
                // Update progress tracking elements
                const progressValue = this.getElement('#progress-value');
                const statusValue = this.getElement('#status-value');
                const scoreValue = this.getElement('#score-value');
                const timeValue = this.getElement('#time-value');
                const sessionIdEl = this.getElement('#session-id');
                const lastSavedEl = this.getElement('#last-saved');
                
                if (progressValue) progressValue.textContent = `${sessionSummary.progress}%`;
                if (statusValue) statusValue.textContent = sessionSummary.status;
                if (scoreValue) scoreValue.textContent = sessionSummary.score ? 
                    `${Math.round(sessionSummary.score.raw)}/${sessionSummary.score.max}` : '-';
                if (timeValue) timeValue.textContent = `${Math.floor(sessionSummary.totalTime / 60)}m ${sessionSummary.totalTime % 60}s`;
                if (sessionIdEl) sessionIdEl.textContent = sessionSummary.sessionId.substring(0, 8) + '...';
                if (lastSavedEl) lastSavedEl.textContent = new Date().toLocaleTimeString();
            }
        } catch (error) {
            console.error('Error updating progress display:', error);
        }
    }
    
    /**
     * Update status display
     */
    updateStatusDisplay(status) {
        const statusText = this.getElement('#scorm-status-text');
        if (statusText) {
            statusText.textContent = status;
        }
    }
    
    /**
     * Initialize edit mode
     */
    initializeEditMode() {
        this.initializeEditEventListeners();
        this.loadAvailablePackages();
    }
    
    /**
     * Load available packages
     */
    async loadAvailablePackages() {
        // This would normally scan the SCORM directory
        // For now, we'll simulate with some example packages
        const packagesList = this.getElement('#packages-list');
        if (!packagesList) return;
        
        const examplePackages = [
            { name: 'Sample Course 1', path: 'Scrom/Quiz/Quiz Template by Montse/story.html', type: 'Quiz' },
            { name: 'Interactive Module', path: 'Scrom/Drag and Drop/story.html', type: 'Drag & Drop' },
            { name: 'Assessment Package', path: 'Scrom/Survey/survey/story.html', type: 'Survey' }
        ];
        
        packagesList.innerHTML = `
            <div class="space-y-3">
                ${examplePackages.map(pkg => `
                    <div class="package-item card p-3 flex justify-between items-center">
                        <div>
                            <div class="font-medium">${pkg.name}</div>
                            <div class="text-sm text-muted">${pkg.type} • ${pkg.path}</div>
                        </div>
                        <button class="btn btn-sm btn-primary select-package" data-path="${pkg.path}">
                            Select
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners to select buttons
        const selectButtons = this.getElements('.select-package');
        selectButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const path = e.target.dataset.path;
                this.selectPackage(path);
            });
        });
    }
    
    /**
     * Select a package
     */
    selectPackage(path) {
        if (!this.activityData) {
            this.activityData = {
                metadata: {
                    id: Date.now().toString(),
                    title: 'New SCORM Package',
                    template: 'scormviewer',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            };
        }
        
        this.activityData.scormUrl = path;
        this.activityData.metadata.title = path.split('/').pop().replace(/\.[^/.]+$/, "");
        
        // Update the UI
        const urlInput = this.getElement('#scorm-url');
        const titleInput = this.getElement('#package-title');
        if (urlInput) urlInput.value = path;
        if (titleInput) titleInput.value = this.activityData.metadata.title;
        
        this.updateStatusDisplay('Package Selected');
    }
    
    /**
     * Initialize play mode event listeners
     */
    initializePlayEventListeners() {
        // SCORM restart button
        const restartBtn = this.getElement('#scorm-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartPackage());
        }
        
        // Progress tracking toggle
        const progressBtn = this.getElement('#scorm-progress');
        const progressTracking = this.getElement('#progress-tracking');
        if (progressBtn && progressTracking) {
            progressBtn.addEventListener('click', () => {
                progressTracking.classList.toggle('hidden');
            });
        }
        
        // Monitor iframe loading
        this.iframe = this.getElement('#scorm-iframe');
        if (this.iframe) {
            this.iframe.addEventListener('load', () => {
                this.packageLoaded = true;
                this.updateStatusDisplay('Package Loaded');
                
                // Try to establish SCORM API connection
                this.establishSCORMAPIConnection();
            });
            
            this.iframe.addEventListener('error', () => {
                this.updateStatusDisplay('Load Error');
            });
        }
    }
    
    /**
     * Establish SCORM API connection
     */
    establishSCORMAPIConnection() {
        // In a real implementation, this would connect to the SCORM API
        // For now, we'll just log that we're attempting connection
        console.log('Attempting to establish SCORM API connection...');
        
        // This is where we would typically look for the SCORM API in the iframe
        // and set up communication between the parent and the SCORM content
    }
    
    /**
     * Initialize edit mode event listeners
     */
    initializeEditEventListeners() {
        // Save configuration button
        const saveBtn = this.getElement('#save-package-config');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfiguration());
        }
        
        // Configuration inputs
        const titleInput = this.getElement('#package-title');
        const descInput = this.getElement('#package-description');
        const urlInput = this.getElement('#scorm-url');
        const widthInput = this.getElement('#package-width');
        const heightInput = this.getElement('#package-height');
        
        if (titleInput) {
            titleInput.addEventListener('change', (e) => {
                if (!this.activityData) this.activityData = { metadata: {} };
                if (!this.activityData.metadata) this.activityData.metadata = {};
                this.activityData.metadata.title = e.target.value;
            });
        }
        
        if (descInput) {
            descInput.addEventListener('change', (e) => {
                if (!this.activityData) this.activityData = { metadata: {} };
                this.activityData.metadata.description = e.target.value;
            });
        }
        
        if (urlInput) {
            urlInput.addEventListener('change', (e) => {
                if (!this.activityData) this.activityData = {};
                this.activityData.scormUrl = e.target.value;
            });
        }
        
        if (widthInput) {
            widthInput.addEventListener('change', (e) => {
                if (!this.activityData) this.activityData = {};
                this.activityData.width = e.target.value;
            });
        }
        
        if (heightInput) {
            heightInput.addEventListener('change', (e) => {
                if (!this.activityData) this.activityData = {};
                this.activityData.height = e.target.value;
            });
        }
    }
    
    /**
     * Save configuration
     */
    saveConfiguration() {
        if (!this.activityData) {
            this.activityData = {
                metadata: {
                    id: Date.now().toString(),
                    title: 'New SCORM Package',
                    template: 'scormviewer',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            };
        }
        
        const titleInput = this.getElement('#package-title');
        const descInput = this.getElement('#package-description');
        const urlInput = this.getElement('#scorm-url');
        const widthInput = this.getElement('#package-width');
        const heightInput = this.getElement('#package-height');
        
        if (titleInput) this.activityData.metadata.title = titleInput.value;
        if (descInput) this.activityData.metadata.description = descInput.value;
        if (urlInput) this.activityData.scormUrl = urlInput.value;
        if (widthInput) this.activityData.width = widthInput.value;
        if (heightInput) this.activityData.height = heightInput.value;
        
        this.activityData.metadata.updatedAt = new Date();
        
        // Update status
        this.updateStatusDisplay('Configuration Saved');
        
        // If we're in play mode, update the iframe src
        if (this.mode === 'play' && this.iframe) {
            this.iframe.src = this.activityData.scormUrl;
        }
    }
    
    /**
     * Restart package
     */
    restartPackage() {
        if (this.iframe && this.activityData?.scormUrl) {
            this.iframe.src = this.activityData.scormUrl;
            this.updateStatusDisplay('Package Restarting...');
        }
    }
    
    /**
     * Template-specific validation
     */
    validateTemplateData() {
        const errors = [];
        
        if (!this.activityData?.scormUrl || this.activityData.scormUrl.trim() === '') {
            errors.push('SCORM package URL is required');
        }
        
        if (!this.activityData?.metadata?.title || this.activityData.metadata.title.trim() === '') {
            errors.push('Package title is required');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Called before saving
     */
    beforeSave() {
        super.beforeSave();
        
        // Commit any pending SCORM session data
        if (this.bookmarkingService && this.currentSessionId) {
            this.bookmarkingService.commitSession(this.currentSessionId);
        }
    }
    
    /**
     * Called before destroying
     */
    beforeDestroy() {
        // Terminate SCORM session if active
        if (this.bookmarkingService && this.currentSessionId) {
            this.bookmarkingService.terminateSession(this.currentSessionId);
            this.sessionActive = false;
        }
        
        super.beforeDestroy();
    }
    
    /**
     * Export SCORM data
     */
    exportToSCORM() {
        // This would export the current activity as a SCORM package
        // Implementation would depend on the specific requirements
        return {
            type: 'scorm',
            data: this.activityData,
            timestamp: new Date()
        };
    }
    
    /**
     * Import from SCORM
     */
    importFromSCORM(scormData) {
        // This would import data from a SCORM package
        // Implementation would parse the SCORM data and convert to our format
        return scormData;
    }
}

// Export the template
export default SCORMViewerTemplate;