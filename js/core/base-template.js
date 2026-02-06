/**
 * Base Template Class
 * 
 * This class provides the foundation for all educational activity templates.
 * It defines the common interface and shared functionality.
 * 
 * All specific templates should extend this class.
 */

export class BaseTemplate {
    constructor(templateId, containerId) {
        this.templateId = templateId;
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.activityData = null;
        this.mode = 'create'; // 'create', 'edit', 'play'
        this.eventListeners = new Map();
    }
    
    /**
     * Initialize the template
     */
    async initialize(data = null) {
        if (data) {
            this.setActivityData(data);
        }
        await this.render();
        this.initializeEventListeners();
        this.onInitialized();
    }
    
    /**
     * Set activity data
     */
    setActivityData(data) {
        this.activityData = data;
        this.onDataChanged();
    }
    
    /**
     * Get activity data
     */
    getActivityData() {
        return this.activityData;
    }
    
    /**
     * Set mode (create, edit, play)
     */
    setMode(mode) {
        if (['create', 'edit', 'play'].includes(mode)) {
            this.mode = mode;
            this.onModeChanged(mode);
        }
    }
    
    /**
     * Get current mode
     */
    getMode() {
        return this.mode;
    }
    
    /**
     * Render the template
     */
    async render() {
        if (!this.container) {
            throw new Error(`Container with id '${this.containerId}' not found`);
        }
        
        this.container.innerHTML = await this.getTemplateHTML();
        await this.afterRender();
    }
    
    /**
     * Get template HTML
     * Should be implemented by child classes
     */
    async getTemplateHTML() {
        throw new Error('getTemplateHTML() must be implemented by child class');
    }
    
    /**
     * Called after render completes
     * Can be overridden by child classes
     */
    async afterRender() {
        // Default implementation - can be overridden
    }
    
    /**
     * Initialize event listeners
     * Should be implemented by child classes
     */
    initializeEventListeners() {
        // Default implementation - can be overridden
    }
    
    /**
     * Validate activity data
     */
    validateData() {
        if (!this.activityData) {
            return { valid: false, errors: ['No activity data provided'] };
        }
        
        // Call template-specific validation
        return this.validateTemplateData();
    }
    
    /**
     * Template-specific validation
     * Should be implemented by child classes
     */
    validateTemplateData() {
        return { valid: true, errors: [] };
    }
    
    /**
     * Save activity data
     */
    async save() {
        const validation = this.validateData();
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        this.beforeSave();
        const savedData = await this.saveToStorage();
        this.afterSave(savedData);
        return savedData;
    }
    
    /**
     * Called before saving
     * Can be overridden by child classes
     */
    beforeSave() {
        // Default implementation - can be overridden
        if (this.activityData) {
            this.activityData.metadata.updatedAt = new Date();
        }
    }
    
    /**
     * Save to storage (Firebase, localStorage, etc.)
     * Should be implemented by child classes or service
     */
    async saveToStorage() {
        // This should be implemented by storage service
        throw new Error('saveToStorage() must be implemented by storage service');
    }
    
    /**
     * Called after saving
     * Can be overridden by child classes
     */
    afterSave(savedData) {
        // Default implementation - can be overridden
        console.log(`${this.templateId} activity saved:`, savedData);
    }
    
    /**
     * Load activity data
     */
    async load(activityId) {
        const loadedData = await this.loadFromStorage(activityId);
        this.setActivityData(loadedData);
        this.afterLoad(loadedData);
        return loadedData;
    }
    
    /**
     * Load from storage (Firebase, localStorage, etc.)
     * Should be implemented by child classes or service
     */
    async loadFromStorage(activityId) {
        // This should be implemented by storage service
        throw new Error('loadFromStorage() must be implemented by storage service');
    }
    
    /**
     * Called after loading
     * Can be overridden by child classes
     */
    afterLoad(loadedData) {
        // Default implementation - can be overridden
        console.log(`${this.templateId} activity loaded:`, loadedData);
    }
    
    /**
     * Reset activity
     */
    reset() {
        this.beforeReset();
        this.activityData = null;
        this.render();
        this.afterReset();
    }
    
    /**
     * Called before reset
     * Can be overridden by child classes
     */
    beforeReset() {
        // Default implementation - can be overridden
    }
    
    /**
     * Called after reset
     * Can be overridden by child classes
     */
    afterReset() {
        // Default implementation - can be overridden
        console.log(`${this.templateId} activity reset`);
    }
    
    /**
     * Export activity data
     */
    async export(format = 'json') {
        const data = this.getActivityData();
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.exportToCSV(data);
            case 'pdf':
                return this.exportToPDF(data);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Export to CSV (template-specific)
     * Should be implemented by child classes
     */
    exportToCSV(data) {
        throw new Error('exportToCSV() must be implemented by child class');
    }
    
    /**
     * Export to PDF (template-specific)
     * Should be implemented by child classes
     */
    exportToPDF(data) {
        throw new Error('exportToPDF() must be implemented by child class');
    }
    
    /**
     * Import activity data
     */
    async import(data, format = 'json') {
        let parsedData;
        switch (format) {
            case 'json':
                parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                break;
            case 'csv':
                parsedData = this.importFromCSV(data);
                break;
            default:
                throw new Error(`Unsupported import format: ${format}`);
        }
        
        const validation = this.validateData(parsedData);
        if (!validation.valid) {
            throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
        }
        
        this.setActivityData(parsedData);
        await this.render();
        this.afterImport(parsedData);
    }
    
    /**
     * Import from CSV (template-specific)
     * Should be implemented by child classes
     */
    importFromCSV(data) {
        throw new Error('importFromCSV() must be implemented by child class');
    }
    
    /**
     * Called after import
     * Can be overridden by child classes
     */
    afterImport(importedData) {
        // Default implementation - can be overridden
        console.log(`${this.templateId} activity imported:`, importedData);
    }
    
    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event
     */
    emit(event, data = null) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Lifecycle hooks - can be overridden by child classes
     */
    onInitialized() {
        this.emit('initialized');
    }
    
    onDataChanged() {
        this.emit('dataChanged', this.activityData);
    }
    
    onModeChanged(newMode) {
        this.emit('modeChanged', newMode);
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        this.beforeDestroy();
        
        // Remove all event listeners
        this.eventListeners.clear();
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.afterDestroy();
    }
    
    /**
     * Called before destroy
     * Can be overridden by child classes
     */
    beforeDestroy() {
        // Default implementation - can be overridden
    }
    
    /**
     * Called after destroy
     * Can be overridden by child classes
     */
    afterDestroy() {
        // Default implementation - can be overridden
        console.log(`${this.templateId} template destroyed`);
    }
    
    /**
     * Utility methods
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        if (content) {
            element.innerHTML = content;
        }
        return element;
    }
    
    getElement(selector) {
        return this.container.querySelector(selector);
    }
    
    getElements(selector) {
        return this.container.querySelectorAll(selector);
    }
    
    hasElement(selector) {
        return this.container.querySelector(selector) !== null;
    }
    
    showElement(selector) {
        const element = this.getElement(selector);
        if (element) {
            element.style.display = '';
        }
    }
    
    hideElement(selector) {
        const element = this.getElement(selector);
        if (element) {
            element.style.display = 'none';
        }
    }
    
    toggleElement(selector) {
        const element = this.getElement(selector);
        if (element) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
        }
    }
    
    addClass(selector, className) {
        const element = this.getElement(selector);
        if (element) {
            element.classList.add(className);
        }
    }
    
    removeClass(selector, className) {
        const element = this.getElement(selector);
        if (element) {
            element.classList.remove(className);
        }
    }
    
    toggleClass(selector, className) {
        const element = this.getElement(selector);
        if (element) {
            element.classList.toggle(className);
        }
    }
    
    hasClass(selector, className) {
        const element = this.getElement(selector);
        return element ? element.classList.contains(className) : false;
    }
}

export default BaseTemplate;