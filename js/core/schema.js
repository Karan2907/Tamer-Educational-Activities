/**
 * Unified Activity Data Schema
 * 
 * This schema defines the standardized structure for all educational activities
 * across all templates. It ensures consistency and enables cross-template functionality.
 * 
 * Schema Version: 1.0.0
 * Last Updated: 2024-01-28
 */

export const ActivitySchema = {
    // Core activity metadata
    metadata: {
        id: { type: 'string', required: true, description: 'Unique activity identifier' },
        title: { type: 'string', required: true, description: 'Activity title' },
        description: { type: 'string', required: false, description: 'Activity description' },
        template: { type: 'string', required: true, description: 'Template type identifier' },
        version: { type: 'string', default: '1.0.0', description: 'Activity schema version' },
        createdAt: { type: 'date', default: () => new Date(), description: 'Creation timestamp' },
        updatedAt: { type: 'date', default: () => new Date(), description: 'Last update timestamp' },
        author: { type: 'string', required: false, description: 'Activity author/creator' },
        tags: { type: 'array', default: [], description: 'Activity tags for categorization' }
    },
    
    // Configuration settings
    config: {
        timeLimit: { type: 'number', required: false, description: 'Time limit in seconds (0 = no limit)' },
        allowRetakes: { type: 'boolean', default: true, description: 'Allow multiple attempts' },
        showFeedback: { type: 'boolean', default: true, description: 'Show immediate feedback' },
        shuffleQuestions: { type: 'boolean', default: false, description: 'Randomize question order' },
        accessibility: { 
            type: 'object', 
            default: { 
                screenReader: true, 
                keyboardNav: true, 
                highContrast: false 
            },
            description: 'Accessibility settings'
        }
    },
    
    // User progress tracking
    progress: {
        currentAttempt: { type: 'number', default: 1, description: 'Current attempt number' },
        maxScore: { type: 'number', default: 0, description: 'Maximum possible score' },
        userScore: { type: 'number', default: 0, description: 'Current user score' },
        timeSpent: { type: 'number', default: 0, description: 'Time spent in seconds' },
        completed: { type: 'boolean', default: false, description: 'Activity completion status' },
        startDate: { type: 'date', description: 'Current session start date' }
    }
};

export const TemplateSchemas = {
    /**
     * Multiple Choice Questions Schema
     */
    mcq: {
        questions: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                question: { type: 'string', required: true },
                options: { 
                    type: 'array', 
                    required: true, 
                    minItems: 2, 
                    maxItems: 6,
                    items: { type: 'string' }
                },
                correctIndex: { type: 'number', required: true, description: 'Zero-based index of correct answer' },
                explanation: { type: 'string', required: false },
                points: { type: 'number', default: 1 }
            }
        }
    },
    
    /**
     * True/False Questions Schema
     */
    truefalse: {
        items: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                question: { type: 'string', required: true },
                isTrue: { type: 'boolean', required: true },
                explanation: { type: 'string', required: false },
                points: { type: 'number', default: 1 }
            }
        }
    },
    
    /**
     * Flash Cards Schema
     */
    flipcards: {
        cards: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                front: { type: 'string', required: true },
                back: { type: 'string', required: true },
                reviewed: { type: 'boolean', default: false },
                lastReviewed: { type: 'date', required: false }
            }
        }
    },
    
    /**
     * Drag & Drop Matching Schema
     */
    dragdrop: {
        pairs: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                left: { type: 'string', required: true },
                right: { type: 'string', required: true },
                matched: { type: 'boolean', default: false }
            }
        }
    },
    
    /**
     * Interactive Video Schema
     */
    interactivevideo: {
        videoUrl: { type: 'string', required: true },
        videoType: { type: 'string', enum: ['youtube', 'vimeo'], default: 'youtube' },
        questions: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                timestamp: { type: 'number', required: true, description: 'Time in seconds' },
                question: { type: 'string', required: true },
                options: { 
                    type: 'array', 
                    required: true, 
                    items: { type: 'string' }
                },
                correctIndex: { type: 'number', required: true },
                answered: { type: 'boolean', default: false }
            }
        }
    },
    
    /**
     * Content Reveal Schema
     */
    contentreveal: {
        panels: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                title: { type: 'string', required: true },
                content: { type: 'string', required: true },
                revealed: { type: 'boolean', default: false }
            }
        }
    },
    
    /**
     * Timeline Schema
     */
    timeline: {
        events: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                date: { type: 'string', required: true, description: 'ISO date string' },
                title: { type: 'string', required: true },
                description: { type: 'string', required: false },
                position: { type: 'number', required: false, description: 'Position in sequence' }
            }
        }
    },
    
    /**
     * Label Diagram Schema
     */
    labeldiagram: {
        imageUrl: { type: 'string', required: true },
        labels: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                x: { type: 'number', required: true, description: 'X coordinate (0-100%)' },
                y: { type: 'number', required: true, description: 'Y coordinate (0-100%)' },
                text: { type: 'string', required: true },
                correct: { type: 'boolean', default: false }
            }
        }
    },
    
    /**
     * Survey Schema
     */
    survey: {
        questions: {
            type: 'array',
            required: true,
            items: {
                id: { type: 'string', required: true },
                question: { type: 'string', required: true },
                type: { type: 'string', enum: ['rating', 'text', 'multiple'], required: true },
                options: { type: 'array', required: false, items: { type: 'string' } },
                required: { type: 'boolean', default: false }
            }
        }
    },
    
    /**
     * Game Arena Schema
     */
    gamearena: {
        packagePath: { type: 'string', required: true },
        instructions: { type: 'string', required: false },
        width: { type: 'string', default: '100%' },
        height: { type: 'string', default: '700px' }
    },
    
    /**
     * SCORM Viewer Schema
     */
    scormviewer: {
        scormUrl: { type: 'string', required: true },
        width: { type: 'string', default: '100%' },
        height: { type: 'string', default: '600px' }
    }
};

/**
 * Validate activity data against schema
 */
export function validateActivityData(data, templateType) {
    const errors = [];
    
    // Validate core metadata
    if (!data.metadata || !data.metadata.id) {
        errors.push('Missing required metadata.id');
    }
    
    if (!data.metadata || !data.metadata.title) {
        errors.push('Missing required metadata.title');
    }
    
    if (!data.metadata || !data.metadata.template) {
        errors.push('Missing required metadata.template');
    }
    
    // Validate template-specific data
    const templateSchema = TemplateSchemas[templateType];
    if (templateSchema) {
        // Template validation logic would go here
        // This is a simplified version
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Create a new activity with default structure
 */
export function createNewActivity(templateType, title = 'New Activity') {
    const activity = {
        metadata: {
            id: generateId(),
            title: title,
            template: templateType,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        config: {
            timeLimit: 0,
            allowRetakes: true,
            showFeedback: true,
            shuffleQuestions: false,
            accessibility: {
                screenReader: true,
                keyboardNav: true,
                highContrast: false
            }
        },
        progress: {
            currentAttempt: 1,
            maxScore: 0,
            userScore: 0,
            timeSpent: 0,
            completed: false,
            startDate: new Date()
        }
    };
    
    // Add template-specific default structure
    const templateDefaults = getTemplateDefaults(templateType);
    Object.assign(activity, templateDefaults);
    
    return activity;
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get default structure for template type
 */
function getTemplateDefaults(templateType) {
    const defaults = {
        mcq: { questions: [] },
        truefalse: { items: [] },
        flipcards: { cards: [] },
        dragdrop: { pairs: [] },
        interactivevideo: { videoUrl: '', questions: [] },
        contentreveal: { panels: [] },
        timeline: { events: [] },
        labeldiagram: { imageUrl: '', labels: [] },
        survey: { questions: [] },
        gamearena: { packagePath: '', instructions: '' },
        scormviewer: { scormUrl: '' }
    };
    
    return defaults[templateType] || {};
}

// Export everything
export default {
    ActivitySchema,
    TemplateSchemas,
    validateActivityData,
    createNewActivity
};