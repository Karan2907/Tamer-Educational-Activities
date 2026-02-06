# Educational Platform Architecture Documentation

## Overview

This document describes the modular architecture of the Tamer Educational Activities platform. The system has been refactored from a monolithic structure to a modular, scalable architecture following modern JavaScript best practices.

## Architecture Layers

### 1. Core Layer (`js/core/`)

The core layer contains the fundamental building blocks of the application:

#### `app.js` - Main Application Controller
- Central application controller managing state and lifecycle
- Handles template routing and initialization
- Manages user authentication and session
- Provides global event handling
- Error handling and logging

#### `schema.js` - Unified Data Schema
- Standardized data structure for all activities
- Template-specific schemas for validation
- Data creation and validation utilities
- Ensures consistency across all templates

#### `base-template.js` - Base Template Class
- Abstract base class for all templates
- Common interface and shared functionality
- Lifecycle management (initialize, render, destroy)
- Event system and utility methods
- Data validation and persistence hooks

#### `template-registry.js` - Template Registry
- Manages all registered templates
- Handles template instantiation and lifecycle
- Provides template lookup and validation services
- Supports lazy loading and dynamic template registration

### 2. Services Layer (`js/services/`)

#### `firebase-service.js` - Firebase Integration
- Handles all Firebase interactions
- Authentication management
- Firestore database operations
- Storage operations
- Real-time data synchronization
- User progress tracking

### 3. Templates Layer (`js/templates/`)

Each template implements a specific educational activity type:

#### `mcq-template.js` - Multiple Choice Questions
- Implements MCQ functionality with single correct answers
- Play mode with question navigation and feedback
- Edit mode for creating and managing questions
- Progress tracking and results display
- Example of how other templates should be structured

### 4. Utilities Layer (`js/utils/`)

Utility functions and helpers (to be implemented):
- String and data manipulation utilities
- DOM manipulation helpers
- Accessibility utilities
- Validation helpers
- Error handling utilities

### 5. Main Entry Point (`js/main.js`)

- Application bootstrap and initialization
- Firebase service setup
- Template registration
- Global event listener setup
- UI component initialization
- Error handling and recovery

## Data Flow

```
User Interaction → Main Application → Template Registry → Template Instance → Firebase Service
                                   ↖                    ↙
                                   Template Base Class
```

1. **User Interaction**: User selects template, creates activity, etc.
2. **Main Application**: Routes request to appropriate handler
3. **Template Registry**: Manages template instantiation and lifecycle
4. **Template Instance**: Handles template-specific logic
5. **Firebase Service**: Persists data and handles authentication
6. **Template Base Class**: Provides common functionality and utilities

## Key Features

### 1. Modular Design
- Each component has a single responsibility
- Loose coupling between components
- Easy to extend and maintain
- Supports code splitting and lazy loading

### 2. Unified Data Schema
- Consistent data structure across all templates
- Built-in validation and error handling
- Easy data migration and versioning
- Supports complex nested structures

### 3. Template System
- Extensible template architecture
- Common interface for all templates
- Built-in lifecycle management
- Event-driven communication

### 4. Firebase Integration
- Real-time data synchronization
- Offline support
- User authentication and authorization
- Scalable data storage

### 5. Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced features with JavaScript enabled
- Graceful degradation for older browsers
- Accessible design principles

## Implementation Guidelines

### Creating New Templates

1. **Extend BaseTemplate**: All templates must extend `BaseTemplate`
2. **Implement Required Methods**: 
   - `getTemplateHTML()` - Return template HTML
   - `validateTemplateData()` - Validate template-specific data
3. **Use Utility Methods**: Leverage inherited utility methods
4. **Follow Naming Conventions**: Use descriptive names and consistent patterns
5. **Add Documentation**: Document public methods and configuration options

### Template Registration

```javascript
import MyTemplate from './templates/my-template.js';

templateRegistry.register('mytemplate', MyTemplate, {
    autoInitialize: true,
    lazyLoad: false
});
```

### Data Structure

All templates follow the unified schema:

```javascript
{
    metadata: {
        id: 'unique-id',
        title: 'Activity Title',
        template: 'template-type',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    config: {
        timeLimit: 0,
        allowRetakes: true,
        showFeedback: true
    },
    progress: {
        currentAttempt: 1,
        userScore: 0,
        maxScore: 0,
        completed: false
    },
    // Template-specific data
    questions: [...], // For MCQ
    cards: [...],     // For Flash Cards
    // etc.
}
```

### Event System

Templates use an event-driven architecture:

```javascript
// Emit events
this.emit('questionAnswered', { questionId, answer });

// Listen for events
this.addEventListener('dataChanged', (data) => {
    // Handle data change
});

// Remove listeners
this.removeEventListener('dataChanged', handler);
```

## Future Enhancements

### Phase 1 - Stabilization (Completed)
- ✅ Modular architecture implementation
- ✅ Unified data schema
- ✅ Base template class
- ✅ Template registry
- ✅ Firebase service integration

### Phase 2 - SCORM & Storyline Core
- SCORM manifest parser
- Articulate Storyline conversion
- Auto-detection and mapping
- Bookmarking and completion tracking

### Phase 3 - Admin & Analytics
- Admin dashboard
- Usage analytics
- Advanced sharing features
- Collaboration tools

## Testing

### Unit Testing
- Test individual components in isolation
- Mock dependencies and services
- Focus on pure functions and methods

### Integration Testing
- Test component interactions
- Verify data flow between layers
- Test with real Firebase services

### End-to-End Testing
- Test complete user workflows
- Verify cross-browser compatibility
- Test accessibility compliance

## Deployment

### Build Process
1. Bundle JavaScript modules
2. Optimize assets and resources
3. Generate service workers for offline support
4. Deploy to static hosting (Firebase Hosting, Netlify, etc.)

### Environment Configuration
- Development, staging, and production environments
- Environment-specific configuration files
- Feature flags for gradual rollout

## Contributing

### Code Standards
- Follow ES6+ syntax and modern JavaScript practices
- Use consistent naming conventions
- Write clear, descriptive comments
- Maintain 100% test coverage for critical functionality

### Git Workflow
- Use feature branches for new development
- Follow conventional commit messages
- Create pull requests for code review
- Maintain clean, linear git history

### Documentation
- Update this document for architectural changes
- Document new features and APIs
- Provide examples and usage instructions
- Keep README files up to date

---

This architecture provides a solid foundation for building a scalable, maintainable educational platform that can evolve with changing requirements and technologies.