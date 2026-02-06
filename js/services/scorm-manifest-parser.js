/**
 * SCORM Manifest Parser
 * 
 * This service parses imsmanifest.xml files to extract SCORM package information
 * and map them to appropriate templates.
 */

class SCORMManifestParser {
    constructor() {
        this.parser = new DOMParser();
    }
    
    /**
     * Parse SCORM manifest XML
     */
    parseManifest(manifestXml) {
        try {
            const xmlDoc = this.parser.parseFromString(manifestXml, 'text/xml');
            
            // Check for parsing errors
            const parserError = xmlDoc.getElementsByTagName('parsererror');
            if (parserError.length > 0) {
                throw new Error('Invalid XML format');
            }
            
            const manifest = xmlDoc.getElementsByTagName('manifest')[0];
            if (!manifest) {
                throw new Error('No manifest element found');
            }
            
            const metadata = this.extractMetadata(xmlDoc);
            const organizations = this.extractOrganizations(xmlDoc);
            const resources = this.extractResources(xmlDoc);
            
            return {
                manifestId: manifest.getAttribute('identifier'),
                version: manifest.getAttribute('version') || '1.2',
                metadata: metadata,
                organizations: organizations,
                resources: resources,
                isValid: true
            };
        } catch (error) {
            console.error('Error parsing SCORM manifest:', error);
            return {
                isValid: false,
                error: error.message,
                manifestId: null,
                version: null,
                metadata: null,
                organizations: null,
                resources: null
            };
        }
    }
    
    /**
     * Extract metadata from manifest
     */
    extractMetadata(xmlDoc) {
        const metadataNodes = xmlDoc.getElementsByTagName('metadata');
        if (metadataNodes.length === 0) {
            return null;
        }
        
        const metadataNode = metadataNodes[0];
        const metadata = {};
        
        // Extract schema information
        const schemaNodes = metadataNode.getElementsByTagName('schemaversion');
        if (schemaNodes.length > 0) {
            metadata.schemaVersion = schemaNodes[0].textContent.trim();
        }
        
        // Extract SCORM version
        const scormVersionNodes = metadataNode.getElementsByTagName('scopecd');
        if (scormVersionNodes.length > 0) {
            metadata.scormVersion = scormVersionNodes[0].textContent.trim();
        }
        
        // Extract title
        const titleNodes = xmlDoc.getElementsByTagName('title');
        if (titleNodes.length > 0) {
            metadata.title = titleNodes[0].textContent.trim();
        }
        
        // Extract description
        const descriptionNodes = xmlDoc.getElementsByTagName('description');
        if (descriptionNodes.length > 0) {
            metadata.description = descriptionNodes[0].textContent.trim();
        }
        
        // Extract other metadata
        const lomNodes = metadataNode.getElementsByTagNameNS('*', '*');
        for (let i = 0; i < lomNodes.length; i++) {
            const node = lomNodes[i];
            const nodeName = node.localName || node.nodeName;
            if (!metadata[nodeName] && node.textContent.trim()) {
                metadata[nodeName] = node.textContent.trim();
            }
        }
        
        return metadata;
    }
    
    /**
     * Extract organizations from manifest
     */
    extractOrganizations(xmlDoc) {
        const organizationsNodes = xmlDoc.getElementsByTagName('organizations');
        if (organizationsNodes.length === 0) {
            return [];
        }
        
        const organizations = [];
        const orgNodes = xmlDoc.getElementsByTagName('organization');
        
        for (let i = 0; i < orgNodes.length; i++) {
            const orgNode = orgNodes[i];
            const organization = {
                id: orgNode.getAttribute('identifier'),
                title: orgNode.getAttribute('title') || '',
                structure: orgNode.getAttribute('structure') || 'hierarchical',
                items: this.extractOrganizationItems(orgNode)
            };
            
            organizations.push(organization);
        }
        
        return organizations;
    }
    
    /**
     * Extract organization items (learning objects)
     */
    extractOrganizationItems(orgNode) {
        const items = [];
        const itemNodes = orgNode.getElementsByTagName('item');
        
        for (let i = 0; i < itemNodes.length; i++) {
            const itemNode = itemNodes[i];
            const item = {
                id: itemNode.getAttribute('identifier'),
                identifierref: itemNode.getAttribute('identifierref'),
                title: itemNode.getAttribute('title') || '',
                isvisible: itemNode.getAttribute('isvisible') === 'true',
                parameters: itemNode.getAttribute('parameters') || '',
                prerequisites: this.extractPrerequisites(itemNode),
                objectives: this.extractObjectives(itemNode),
                children: this.extractOrganizationItems(itemNode) // Recursive for nested items
            };
            
            items.push(item);
        }
        
        return items;
    }
    
    /**
     * Extract prerequisites from item
     */
    extractPrerequisites(itemNode) {
        const prereqNodes = itemNode.getElementsByTagName('prerequisites');
        if (prereqNodes.length === 0) {
            return null;
        }
        
        return prereqNodes[0].textContent.trim();
    }
    
    /**
     * Extract objectives from item
     */
    extractObjectives(itemNode) {
        const objectiveNodes = itemNode.getElementsByTagName('objective');
        if (objectiveNodes.length === 0) {
            return [];
        }
        
        const objectives = [];
        for (let i = 0; i < objectiveNodes.length; i++) {
            const objNode = objectiveNodes[i];
            objectives.push({
                id: objNode.getAttribute('objectiveid'),
                satisfiedByMeasure: objNode.getAttribute('satisfiedByMeasure') === 'true',
                minNormalizedMeasure: objNode.getAttribute('minNormalizedMeasure')
            });
        }
        
        return objectives;
    }
    
    /**
     * Extract resources from manifest
     */
    extractResources(xmlDoc) {
        const resourcesNodes = xmlDoc.getElementsByTagName('resources');
        if (resourcesNodes.length === 0) {
            return [];
        }
        
        const resources = [];
        const resourceNodes = xmlDoc.getElementsByTagName('resource');
        
        for (let i = 0; i < resourceNodes.length; i++) {
            const resourceNode = resourceNodes[i];
            const resource = {
                id: resourceNode.getAttribute('identifier'),
                type: resourceNode.getAttribute('type'),
                href: resourceNode.getAttribute('href'),
                parameters: resourceNode.getAttribute('parameters') || '',
                metadata: this.extractResourceMetadata(resourceNode),
                files: this.extractResourceFiles(resourceNode),
                dependencies: this.extractResourceDependencies(resourceNode)
            };
            
            resources.push(resource);
        }
        
        return resources;
    }
    
    /**
     * Extract resource metadata
     */
    extractResourceMetadata(resourceNode) {
        const metadataNodes = resourceNode.getElementsByTagName('metadata');
        if (metadataNodes.length === 0) {
            return null;
        }
        
        const metadata = {};
        const metaNode = metadataNodes[0];
        const elements = metaNode.getElementsByTagName('*');
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const name = element.localName || element.nodeName;
            metadata[name] = element.textContent.trim();
        }
        
        return metadata;
    }
    
    /**
     * Extract resource files
     */
    extractResourceFiles(resourceNode) {
        const files = [];
        const fileNodes = resourceNode.getElementsByTagName('file');
        
        for (let i = 0; i < fileNodes.length; i++) {
            const fileNode = fileNodes[i];
            files.push({
                href: fileNode.getAttribute('href')
            });
        }
        
        return files;
    }
    
    /**
     * Extract resource dependencies
     */
    extractResourceDependencies(resourceNode) {
        const deps = [];
        const dependencyNodes = resourceNode.getElementsByTagName('dependency');
        
        for (let i = 0; i < dependencyNodes.length; i++) {
            const depNode = dependencyNodes[i];
            deps.push({
                identifierref: depNode.getAttribute('identifierref')
            });
        }
        
        return deps;
    }
    
    /**
     * Detect template type from manifest
     */
    detectTemplateType(manifestData) {
        if (!manifestData.isValid) {
            return 'scormviewer';
        }
        
        const metadata = manifestData.metadata;
        const resources = manifestData.resources;
        const organizations = manifestData.organizations;
        
        // Look for clues in metadata
        if (metadata && metadata.title) {
            const title = metadata.title.toLowerCase();
            
            if (title.includes('quiz') || title.includes('question') || title.includes('assessment')) {
                return 'mcq';
            }
            
            if (title.includes('flash') || title.includes('card')) {
                return 'flipcards';
            }
            
            if (title.includes('match') || title.includes('drag') || title.includes('pair')) {
                return 'dragdrop';
            }
            
            if (title.includes('crossword') || title.includes('puzzle')) {
                return 'crossword';
            }
            
            if (title.includes('survey') || title.includes('poll')) {
                return 'survey';
            }
            
            if (title.includes('timeline') || title.includes('chronology')) {
                return 'timeline';
            }
            
            if (title.includes('reveal') || title.includes('panel') || title.includes('content')) {
                return 'contentreveal';
            }
            
            if (title.includes('label') || title.includes('diagram')) {
                return 'labeldiagram';
            }
            
            if (title.includes('pick') || title.includes('many')) {
                return 'pickmany';
            }
            
            if (title.includes('game') || title.includes('arena') || title.includes('challenge')) {
                return 'gamearena';
            }
        }
        
        // Look for clues in resources
        if (resources && resources.length > 0) {
            for (const resource of resources) {
                if (resource.type && resource.type.toLowerCase().includes('webcontent')) {
                    if (resource.href && resource.href.toLowerCase().includes('quiz')) {
                        return 'mcq';
                    }
                    
                    if (resource.href && resource.href.toLowerCase().includes('game')) {
                        return 'gamearena';
                    }
                }
            }
        }
        
        // Look for clues in organizations
        if (organizations && organizations.length > 0) {
            for (const org of organizations) {
                if (org.title && org.title.toLowerCase().includes('quiz')) {
                    return 'mcq';
                }
                
                if (org.title && org.title.toLowerCase().includes('game')) {
                    return 'gamearena';
                }
            }
        }
        
        // Default to SCORM viewer if no specific type detected
        return 'scormviewer';
    }
    
    /**
     * Extract SCORM configuration from manifest
     */
    extractSCORMConfiguration(manifestData) {
        const config = {
            version: manifestData.version || '1.2',
            completionThreshold: 100, // Default completion threshold
            masteryScore: null,
            launchData: '',
            dataFromLMS: '',
            prerequisites: null,
            objectives: null
        };
        
        // Extract completion and mastery settings from metadata
        if (manifestData.metadata) {
            if (manifestData.metadata.masteryscore) {
                config.masteryScore = parseFloat(manifestData.metadata.masteryscore);
            }
            
            if (manifestData.metadata.completionthreshold) {
                config.completionThreshold = parseFloat(manifestData.metadata.completionthreshold);
            }
        }
        
        return config;
    }
    
    /**
     * Parse manifest from file
     */
    async parseManifestFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const manifestData = this.parseManifest(event.target.result);
                    resolve(manifestData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read manifest file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Parse manifest from URL
     */
    async parseManifestFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const manifestXml = await response.text();
            return this.parseManifest(manifestXml);
        } catch (error) {
            console.error('Error fetching manifest from URL:', error);
            return {
                isValid: false,
                error: error.message,
                manifestId: null,
                version: null,
                metadata: null,
                organizations: null,
                resources: null
            };
        }
    }
}

// Export the parser
export default SCORMManifestParser;