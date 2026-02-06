/**
 * Package Auto-Detection Service
 * 
 * This service automatically detects the type of educational package (SCORM, Storyline, etc.)
 * and maps it to the appropriate template in the system.
 */

class PackageAutoDetectionService {
    constructor(scormManifestParser, storylineParser) {
        this.scormManifestParser = scormManifestParser;
        this.storylineParser = storylineParser;
        this.packageCache = new Map(); // Cache for detected package types
        this.detectionRules = this.initializeDetectionRules();
    }
    
    /**
     * Initialize detection rules for different package types
     */
    initializeDetectionRules() {
        return {
            // SCORM detection rules
            scorm: [
                {
                    name: 'imsmanifest.xml',
                    condition: (files) => files.some(file => file.name === 'imsmanifest.xml'),
                    confidence: 100
                },
                {
                    name: 'SCORM API',
                    condition: (files) => files.some(file => file.content && 
                               (file.content.includes('API') || file.content.includes('Initialize') || 
                                file.content.includes('Finish') || file.content.includes('GetValue') ||
                                file.content.includes('SetValue'))),
                    confidence: 80
                }
            ],
            // Articulate Storyline detection rules
            storyline: [
                {
                    name: 'story_content folder',
                    condition: (files) => files.some(file => file.path.includes('story_content')),
                    confidence: 90
                },
                {
                    name: 'story.js',
                    condition: (files) => files.some(file => file.name === 'story.js'),
                    confidence: 85
                },
                {
                    name: 'story.html',
                    condition: (files) => files.some(file => file.name === 'story.html'),
                    confidence: 80
                },
                {
                    name: 'Articulate player',
                    condition: (files) => files.some(file => file.content && 
                               file.content.includes('articulate') && 
                               file.content.includes('player')),
                    confidence: 75
                }
            ],
            // PowerPoint detection rules
            powerpoint: [
                {
                    name: 'ppt folder',
                    condition: (files) => files.some(file => file.path.includes('/ppt/') || 
                               file.path.includes('\\ppt\\')),
                    confidence: 85
                },
                {
                    name: '.ppsx extension',
                    condition: (files) => files.some(file => file.name.endsWith('.ppsx')),
                    confidence: 90
                },
                {
                    name: 'Microsoft Office',
                    condition: (files) => files.some(file => file.content && 
                               file.content.includes('Microsoft') && 
                               file.content.includes('PowerPoint')),
                    confidence: 70
                }
            ],
            // Quiz/Assessment detection rules
            quiz: [
                {
                    name: 'quiz data',
                    condition: (files) => files.some(file => file.name.includes('quiz') || 
                               file.content && file.content.includes('question') && 
                               file.content.includes('answer')),
                    confidence: 70
                },
                {
                    name: 'assessment structure',
                    condition: (files) => files.some(file => file.content && 
                               (file.content.includes('multiple choice') || 
                                file.content.includes('true/false') || 
                                file.content.includes('mcq') || 
                                file.content.includes('tf'))),
                    confidence: 65
                }
            ],
            // Flash card detection rules
            flashcard: [
                {
                    name: 'flashcard data',
                    condition: (files) => files.some(file => file.name.includes('flashcard') || 
                               file.content && file.content.includes('term') && 
                               file.content.includes('definition')),
                    confidence: 70
                },
                {
                    name: 'card structure',
                    condition: (files) => files.some(file => file.content && 
                               file.content.includes('front') && 
                               file.content.includes('back')),
                    confidence: 65
                }
            ],
            // Drag and drop detection rules
            dragdrop: [
                {
                    name: 'drag drop structure',
                    condition: (files) => files.some(file => file.content && 
                               file.content.includes('drag') && 
                               file.content.includes('drop') && 
                               file.content.includes('match')),
                    confidence: 70
                },
                {
                    name: 'matching data',
                    condition: (files) => files.some(file => file.name.includes('match') || 
                               file.content && file.content.includes('pair') && 
                               file.content.includes('connect')),
                    confidence: 65
                }
            ],
            // Crossword detection rules
            crossword: [
                {
                    name: 'crossword structure',
                    condition: (files) => files.some(file => file.content && 
                               file.content.includes('across') && 
                               file.content.includes('down') && 
                               file.content.includes('clue')),
                    confidence: 75
                },
                {
                    name: 'grid pattern',
                    condition: (files) => files.some(file => file.content && 
                               file.content.includes('grid') && 
                               file.content.includes('cell')),
                    confidence: 65
                }
            ]
        };
    }
    
    /**
     * Detect package type from file structure
     */
    async detectPackageType(files) {
        const detectionResults = [];
        
        // Check each package type against detection rules
        for (const [packageType, rules] of Object.entries(this.detectionRules)) {
            let totalConfidence = 0;
            let matchedRules = 0;
            
            for (const rule of rules) {
                if (rule.condition(files)) {
                    totalConfidence += rule.confidence;
                    matchedRules++;
                }
            }
            
            // Calculate average confidence for this package type
            if (matchedRules > 0) {
                const avgConfidence = totalConfidence / matchedRules;
                detectionResults.push({
                    type: packageType,
                    confidence: avgConfidence,
                    matchedRules: matchedRules,
                    totalRules: rules.length
                });
            }
        }
        
        // Sort results by confidence
        detectionResults.sort((a, b) => b.confidence - a.confidence);
        
        // Return the highest confidence result
        return detectionResults.length > 0 ? detectionResults[0] : null;
    }
    
    /**
     * Analyze a SCORM package and determine template mapping
     */
    async analyzeSCORMPackage(packagePath) {
        try {
            // Parse the manifest file
            const manifestData = await this.scormManifestParser.parseManifest(packagePath);
            
            if (!manifestData) {
                return null;
            }
            
            // Extract package information
            const packageInfo = {
                type: 'scorm',
                title: manifestData.metadata?.title || manifestData.organizations?.[0]?.title || 'Untitled SCORM Package',
                description: manifestData.metadata?.description || '',
                version: manifestData.version || '1.2',
                organization: manifestData.organizations?.[0]?.title || 'Default Organization',
                resources: manifestData.resources || [],
                objectives: manifestData.objectives || [],
                prerequisites: manifestData.prerequisites || []
            };
            
            // Determine the most appropriate template based on content
            const templateMapping = this.mapSCORMToTemplate(manifestData);
            
            return {
                ...packageInfo,
                template: templateMapping.template,
                templateConfidence: templateMapping.confidence,
                metadata: manifestData
            };
        } catch (error) {
            console.error('Error analyzing SCORM package:', error);
            return null;
        }
    }
    
    /**
     * Map SCORM package to appropriate template
     */
    mapSCORMToTemplate(manifestData) {
        // Analyze the manifest to determine the most appropriate template
        const resources = manifestData.resources || [];
        const organizations = manifestData.organizations || [];
        
        // Look for clues in resources
        for (const resource of resources) {
            const href = resource.href || '';
            
            // Check for quiz/assessment content
            if (href.toLowerCase().includes('quiz') || 
                href.toLowerCase().includes('assessment') ||
                href.toLowerCase().includes('exam') ||
                href.toLowerCase().includes('test')) {
                return { template: 'mcq', confidence: 90 };
            }
            
            // Check for video content
            if (href.toLowerCase().includes('video') || 
                href.toLowerCase().includes('movie') ||
                href.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
                return { template: 'interactivevideo', confidence: 85 };
            }
            
            // Check for presentation content
            if (href.toLowerCase().includes('slide') || 
                href.toLowerCase().includes('presentation') ||
                href.match(/\.(ppt|pptx|pps|ppsx)$/)) {
                return { template: 'contentreveal', confidence: 80 };
            }
            
            // Check for flashcard content
            if (href.toLowerCase().includes('flashcard') || 
                href.toLowerCase().includes('card')) {
                return { template: 'flipcards', confidence: 85 };
            }
        }
        
        // Look for clues in organization structure
        if (organizations.length > 0) {
            const orgTitle = organizations[0].title || '';
            
            if (orgTitle.toLowerCase().includes('quiz') || 
                orgTitle.toLowerCase().includes('assessment')) {
                return { template: 'mcq', confidence: 85 };
            }
            
            if (orgTitle.toLowerCase().includes('flashcard') || 
                orgTitle.toLowerCase().includes('cards')) {
                return { template: 'flipcards', confidence: 80 };
            }
            
            if (orgTitle.toLowerCase().includes('game') || 
                orgTitle.toLowerCase().includes('activity')) {
                return { template: 'gamearena', confidence: 75 };
            }
        }
        
        // Default to content reveal for general SCORM packages
        return { template: 'contentreveal', confidence: 60 };
    }
    
    /**
     * Analyze a Storyline package and determine template mapping
     */
    async analyzeStorylinePackage(storyFile) {
        try {
            // Parse the Storyline file
            const parsedData = await this.storylineParser.parseStoryFile(storyFile);
            
            if (!parsedData) {
                return null;
            }
            
            // Extract package information
            const packageInfo = {
                type: 'storyline',
                title: parsedData.title || 'Untitled Storyline Package',
                description: parsedData.description || '',
                slides: parsedData.slides?.length || 0,
                interactions: parsedData.interactions || [],
                quizzes: parsedData.quizzes || [],
                multimedia: parsedData.multimedia || []
            };
            
            // Determine the most appropriate template based on content
            const templateMapping = this.mapStorylineToTemplate(parsedData);
            
            return {
                ...packageInfo,
                template: templateMapping.template,
                templateConfidence: templateMapping.confidence,
                parsedData: parsedData
            };
        } catch (error) {
            console.error('Error analyzing Storyline package:', error);
            return null;
        }
    }
    
    /**
     * Map Storyline content to appropriate template
     */
    mapStorylineToTemplate(parsedData) {
        const slides = parsedData.slides || [];
        const interactions = parsedData.interactions || [];
        const quizzes = parsedData.quizzes || [];
        
        // Count different types of interactions
        let quizCount = 0;
        let flashcardCount = 0;
        let dragDropCount = 0;
        let surveyCount = 0;
        let timelineCount = 0;
        let contentRevealCount = 0;
        let labelDiagramCount = 0;
        let pickManyCount = 0;
        
        for (const interaction of interactions) {
            const type = interaction.type?.toLowerCase() || '';
            
            if (type.includes('quiz') || type.includes('question') || type.includes('mcq')) {
                quizCount++;
            } else if (type.includes('flash') || type.includes('card')) {
                flashcardCount++;
            } else if (type.includes('drag') || type.includes('drop') || type.includes('match')) {
                dragDropCount++;
            } else if (type.includes('survey') || type.includes('poll')) {
                surveyCount++;
            } else if (type.includes('timeline') || type.includes('chronology')) {
                timelineCount++;
            } else if (type.includes('reveal') || type.includes('hide') || type.includes('show')) {
                contentRevealCount++;
            } else if (type.includes('label') || type.includes('diagram')) {
                labelDiagramCount++;
            } else if (type.includes('pick') || type.includes('select')) {
                pickManyCount++;
            }
        }
        
        // Also check quiz objects directly
        quizCount += quizzes.length;
        
        // Determine template based on counts
        const maxCount = Math.max(quizCount, flashcardCount, dragDropCount, surveyCount, 
                                  timelineCount, contentRevealCount, labelDiagramCount, pickManyCount);
        
        if (maxCount === 0) {
            // If no specific interactions, check slide content
            return this.analyzeSlideContent(slides);
        }
        
        if (maxCount === quizCount) {
            return { template: 'mcq', confidence: 90 };
        } else if (maxCount === flashcardCount) {
            return { template: 'flipcards', confidence: 85 };
        } else if (maxCount === dragDropCount) {
            return { template: 'dragdrop', confidence: 85 };
        } else if (maxCount === surveyCount) {
            return { template: 'survey', confidence: 80 };
        } else if (maxCount === timelineCount) {
            return { template: 'timeline', confidence: 80 };
        } else if (maxCount === contentRevealCount) {
            return { template: 'contentreveal', confidence: 80 };
        } else if (maxCount === labelDiagramCount) {
            return { template: 'labeldiagram', confidence: 85 };
        } else if (maxCount === pickManyCount) {
            return { template: 'pickmany', confidence: 85 };
        }
        
        // Default fallback
        return { template: 'contentreveal', confidence: 60 };
    }
    
    /**
     * Analyze slide content to determine template
     */
    analyzeSlideContent(slides) {
        if (!slides || slides.length === 0) {
            return { template: 'contentreveal', confidence: 60 };
        }
        
        let hasQuestions = 0;
        let hasMedia = 0;
        let hasInteractions = 0;
        let hasTextOnly = 0;
        
        for (const slide of slides) {
            const content = slide.content || '';
            const interactions = slide.interactions || [];
            
            if (content.toLowerCase().includes('question') || 
                content.toLowerCase().includes('?') ||
                interactions.length > 0) {
                hasQuestions++;
            }
            
            if (content.toLowerCase().includes('image') || 
                content.toLowerCase().includes('video') ||
                content.toLowerCase().includes('audio')) {
                hasMedia++;
            }
            
            if (interactions.length > 0) {
                hasInteractions++;
            }
            
            if (content.trim() && !hasQuestions && !hasMedia) {
                hasTextOnly++;
            }
        }
        
        if (hasQuestions > slides.length / 2) {
            return { template: 'mcq', confidence: 75 };
        } else if (hasMedia > slides.length / 2) {
            return { template: 'interactivevideo', confidence: 70 };
        } else if (hasInteractions > slides.length / 2) {
            return { template: 'gamearena', confidence: 70 };
        } else {
            return { template: 'contentreveal', confidence: 65 };
        }
    }
    
    /**
     * Process and map a package file to the appropriate template
     */
    async processPackage(filePath) {
        try {
            // Check cache first
            if (this.packageCache.has(filePath)) {
                return this.packageCache.get(filePath);
            }
            
            // Determine file type by extension
            const ext = filePath.toLowerCase().split('.').pop();
            
            let result = null;
            
            if (ext === 'zip' || ext === 'story') {
                // Could be SCORM or Storyline - need to inspect contents
                const files = await this.extractPackageFiles(filePath);
                const detectionResult = await this.detectPackageType(files);
                
                if (detectionResult) {
                    if (detectionResult.type === 'scorm') {
                        result = await this.analyzeSCORMPackage(filePath);
                    } else if (detectionResult.type === 'storyline') {
                        // For .story files specifically
                        const storyFile = await this.loadStoryFile(filePath);
                        result = await this.analyzeStorylinePackage(storyFile);
                    } else {
                        // Fallback - use detection result
                        result = {
                            type: detectionResult.type,
                            template: this.mapGenericPackage(detectionResult.type),
                            templateConfidence: detectionResult.confidence,
                            filePath: filePath
                        };
                    }
                }
            } else if (ext === 'xml') {
                // Likely a SCORM manifest
                result = await this.analyzeSCORMPackage(filePath);
            }
            
            // Cache the result
            if (result) {
                this.packageCache.set(filePath, result);
            }
            
            return result;
        } catch (error) {
            console.error('Error processing package:', error);
            return null;
        }
    }
    
    /**
     * Map generic package type to template
     */
    mapGenericPackage(packageType) {
        const mapping = {
            'quiz': 'mcq',
            'flashcard': 'flipcards',
            'dragdrop': 'dragdrop',
            'crossword': 'crossword',
            'timeline': 'timeline',
            'powerpoint': 'contentreveal',
            'flashcard': 'flipcards'
        };
        
        return mapping[packageType] || 'contentreveal';
    }
    
    /**
     * Extract files from a package (placeholder implementation)
     */
    async extractPackageFiles(filePath) {
        // This would typically use JSZip or similar to extract files
        // For now, return a placeholder structure
        return [
            { name: 'placeholder.txt', path: '/placeholder.txt', content: 'sample content' }
        ];
    }
    
    /**
     * Load Storyline file (placeholder implementation)
     */
    async loadStoryFile(filePath) {
        // This would load and parse the .story file
        // For now, return a placeholder
        return { title: 'Sample Storyline', slides: [] };
    }
    
    /**
     * Validate detected template mapping
     */
    validateTemplateMapping(detectedPackage) {
        if (!detectedPackage || !detectedPackage.template) {
            return false;
        }
        
        // Define valid templates
        const validTemplates = [
            'mcq', 'truefalse', 'flipcards', 'dragdrop', 'crossword', 
            'survey', 'timeline', 'contentreveal', 'labeldiagram', 
            'pickmany', 'interactivevideo', 'gamearena', 'scormviewer'
        ];
        
        return validTemplates.includes(detectedPackage.template);
    }
    
    /**
     * Get recommended template with confidence threshold
     */
    getRecommendedTemplate(detectedPackage, minConfidence = 60) {
        if (!detectedPackage || !detectedPackage.templateConfidence) {
            return null;
        }
        
        if (detectedPackage.templateConfidence >= minConfidence) {
            return detectedPackage.template;
        }
        
        // If confidence is low, suggest alternatives
        return this.getSuggestedAlternatives(detectedPackage, minConfidence);
    }
    
    /**
     * Get suggested alternative templates
     */
    getSuggestedAlternatives(detectedPackage, minConfidence) {
        // For now, return contentreveal as a safe fallback
        return 'contentreveal';
    }
    
    /**
     * Bulk process multiple packages
     */
    async bulkProcessPackages(filePaths) {
        const results = [];
        
        for (const filePath of filePaths) {
            const result = await this.processPackage(filePath);
            results.push({ filePath, result });
        }
        
        return results;
    }
    
    /**
     * Update detection rules dynamically
     */
    updateDetectionRules(newRules) {
        this.detectionRules = { ...this.detectionRules, ...newRules };
    }
    
    /**
     * Get detection statistics
     */
    getDetectionStats() {
        return {
            cachedPackages: this.packageCache.size,
            detectionRuleCount: Object.keys(this.detectionRules).reduce(
                (sum, key) => sum + this.detectionRules[key].length, 0
            )
        };
    }
    
    /**
     * Clear the package cache
     */
    clearCache() {
        this.packageCache.clear();
    }
    
    /**
     * Cleanup service
     */
    cleanup() {
        this.clearCache();
    }
}

// Export the service
export default PackageAutoDetectionService;