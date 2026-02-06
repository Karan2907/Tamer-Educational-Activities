/**
 * Template Registry
 * 
 * This module manages all available templates in the system.
 * It provides registration, lookup, and instantiation services.
 */

import { BaseTemplate } from './base-template.js';

class TemplateRegistry {
    constructor() {
        this.templates = new Map();
        this.instances = new Map();
        this.defaultConfig = {
            autoInitialize: true,
            lazyLoad: true
        };
    }
    
    /**
     * Register a new template
     */
    register(templateId, templateClass, config = {}) {
        if (!(templateClass.prototype instanceof BaseTemplate)) {
            throw new Error(`Template ${templateId} must extend BaseTemplate`);
        }
        
        const templateConfig = { ...this.defaultConfig, ...config };
        
        this.templates.set(templateId, {
            class: templateClass,
            config: templateConfig
        });
        
        console.log(`Template registered: ${templateId}`);
    }
    
    /**
     * Unregister a template
     */
    unregister(templateId) {
        if (this.templates.has(templateId)) {
            // Destroy any existing instances
            this.destroyInstance(templateId);
            this.templates.delete(templateId);
            console.log(`Template unregistered: ${templateId}`);
        }
    }
    
    /**
     * Check if template is registered
     */
    isRegistered(templateId) {
        return this.templates.has(templateId);
    }
    
    /**
     * Get template class
     */
    getTemplateClass(templateId) {
        const template = this.templates.get(templateId);
        return template ? template.class : null;
    }
    
    /**
     * Get template configuration
     */
    getTemplateConfig(templateId) {
        const template = this.templates.get(templateId);
        return template ? template.config : null;
    }
    
    /**
     * Create template instance
     */
    createInstance(templateId, containerId, data = null) {
        const TemplateClass = this.getTemplateClass(templateId);
        if (!TemplateClass) {
            throw new Error(`Template ${templateId} is not registered`);
        }
        
        // Destroy existing instance if it exists
        this.destroyInstance(templateId);
        
        // Create new instance
        const instance = new TemplateClass(templateId, containerId);
        
        // Store instance
        this.instances.set(templateId, instance);
        
        // Initialize if autoInitialize is enabled
        const config = this.getTemplateConfig(templateId);
        if (config && config.autoInitialize) {
            instance.initialize(data);
        }
        
        console.log(`Template instance created: ${templateId}`);
        return instance;
    }
    
    /**
     * Get existing template instance
     */
    getInstance(templateId) {
        return this.instances.get(templateId);
    }
    
    /**
     * Check if template instance exists
     */
    hasInstance(templateId) {
        return this.instances.has(templateId);
    }
    
    /**
     * Destroy template instance
     */
    destroyInstance(templateId) {
        const instance = this.instances.get(templateId);
        if (instance) {
            instance.destroy();
            this.instances.delete(templateId);
            console.log(`Template instance destroyed: ${templateId}`);
        }
    }
    
    /**
     * Get all registered template IDs
     */
    getTemplateIds() {
        return Array.from(this.templates.keys());
    }
    
    /**
     * Get all template instances
     */
    getInstances() {
        return Array.from(this.instances.values());
    }
    
    /**
     * Destroy all instances
     */
    destroyAllInstances() {
        this.instances.forEach((instance, templateId) => {
            instance.destroy();
        });
        this.instances.clear();
        console.log('All template instances destroyed');
    }
    
    /**
     * Get template metadata
     */
    getTemplateMetadata(templateId) {
        const template = this.templates.get(templateId);
        if (!template) return null;
        
        return {
            id: templateId,
            className: template.class.name,
            config: template.config
        };
    }
    
    /**
     * Get all template metadata
     */
    getAllTemplateMetadata() {
        const metadata = {};
        this.templates.forEach((template, templateId) => {
            metadata[templateId] = this.getTemplateMetadata(templateId);
        });
        return metadata;
    }
    
    /**
     * Validate template data
     */
    validateTemplateData(templateId, data) {
        const instance = this.getInstance(templateId);
        if (instance) {
            return instance.validateData(data);
        }
        
        // If no instance exists, create a temporary one for validation
        const TemplateClass = this.getTemplateClass(templateId);
        if (TemplateClass) {
            const tempInstance = new TemplateClass(templateId, 'temp');
            tempInstance.setActivityData(data);
            const result = tempInstance.validateData();
            tempInstance.destroy();
            return result;
        }
        
        return { valid: false, errors: [`Template ${templateId} not found`] };
    }
    
    /**
     * Export template data
     */
    async exportTemplateData(templateId, format = 'json') {
        const instance = this.getInstance(templateId);
        if (!instance) {
            throw new Error(`No instance found for template ${templateId}`);
        }
        
        return await instance.export(format);
    }
    
    /**
     * Import template data
     */
    async importTemplateData(templateId, data, format = 'json') {
        const instance = this.getInstance(templateId);
        if (!instance) {
            throw new Error(`No instance found for template ${templateId}`);
        }
        
        return await instance.import(data, format);
    }
    
    /**
     * Get template statistics
     */
    getStatistics() {
        return {
            registeredTemplates: this.templates.size,
            activeInstances: this.instances.size,
            templateIds: this.getTemplateIds(),
            instanceIds: Array.from(this.instances.keys())
        };
    }
    
    /**
     * Load template dynamically (for lazy loading)
     */
    async loadTemplate(templateId, modulePath) {
        try {
            const module = await import(modulePath);
            const TemplateClass = module.default || module[templateId];
            
            if (TemplateClass) {
                this.register(templateId, TemplateClass);
                console.log(`Template loaded dynamically: ${templateId} from ${modulePath}`);
            } else {
                throw new Error(`Template class not found in module ${modulePath}`);
            }
        } catch (error) {
            console.error(`Failed to load template ${templateId}:`, error);
            throw error;
        }
    }
}

// Create singleton instance
const templateRegistry = new TemplateRegistry();

// Export both class and instance
export { TemplateRegistry };
export default templateRegistry;