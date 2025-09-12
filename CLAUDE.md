# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Time-FTP** is a Rakuten RMS-compatible SFTP/FTP file management system with advanced scheduling and data retention features. The system consists of a Node.js Express backend (`sftp-server.js`) and a comprehensive single-page frontend (`index.html`) that provides scheduled file uploads, capacity management, and data persistence for e-commerce platforms.

## System Architecture

### Core Components

```
time-ftp/
├── sftp-server.js           # Express API server (port 8091)
├── index.html               # Monolithic frontend (170KB+ single file)
├── package.json             # Node dependencies
├── data/                    # Server-side persistence
│   ├── temp-files/         # Temporary file storage (60-day retention)
│   ├── server-schedules.json # Server-side schedule persistence
│   └── *.json              # Various data files
├── uploads/                 # Local file upload staging
├── test-data/              # Sample CSV files for testing
├── test-*.js               # Testing utilities
└── docker-compose*.yml     # Multiple Docker configurations
```

### Backend API Architecture (sftp-server.js)

**File Management APIs:**
- `POST /api/upload` - Direct file upload with encoding conversion
- `POST /api/save-temp-file` - Save file temporarily for scheduled uploads (NEW)
- `POST /api/upload-temp-file` - Upload saved temporary file (NEW)

**Server Management APIs:**
- `POST /api/test-connection` - Connection testing for SFTP/FTP
- `POST /api/browse` - Directory browsing on remote server
- `POST /api/check-directory` - Directory existence validation
- `POST /api/list-files` - File listing from remote server
- `POST /api/preview-file` - CSV file preview with encoding detection

**Schedule Management APIs:**
- `GET /api/server-schedules` - Retrieve server-side schedules
- `POST /api/server-schedules` - Create server-side schedule
- `DELETE /api/server-schedules/:id` - Delete server-side schedule

**Key Backend Features:**
- **Temporary File System**: 60-day retention with automatic cleanup
- **Data Compression**: Completed uploads stored as compressed metadata
- **Encoding Handling**: Automatic Shift-JIS/UTF-8 detection and conversion
- **Protocol Support**: Both SFTP and FTP with unified interface

### Frontend Architecture (index.html)

**Core Systems:**
- **Profile Management**: Multi-server configurations in LocalStorage
- **Schedule Queue**: Client and server-side scheduling with retry logic
- **Capacity Management**: LocalStorage monitoring with automatic cleanup (NEW)
- **File Browser**: Multi-modal directory browsing system
- **Progress Tracking**: Real-time upload status and progress bars

**Critical Frontend Functions:**
```javascript
// Schedule Management
scheduleUpload()           // Create scheduled upload task
executeScheduledTask()     // Execute scheduled task with fallback
saveScheduledUploads()     // Persist with compression and cleanup

// Capacity Management (NEW)
checkStorageCapacity()     // Monitor LocalStorage usage
autoCleanupOldTasks()      // Remove old completed tasks (30+ days)
updateStorageDisplay()     // Visual capacity warnings

// Directory Management
browseServerDirectory()    // Modal directory browser
browseServerDirectoryFromSidebar() // Sidebar browser
browseUploadDirectory()    // Main area browser
```

## Development Commands

### Primary Development
```bash
# Quick start (Windows)
run-test.bat                 # Fastest way to test functionality
quick-start.bat              # Alternative quick start

# Standard development
npm start                    # Production server (port 8091)
npm run dev                  # Development with nodemon
npm test                     # Run SFTP connection tests
```

### Docker Operations
```bash
# Development environments
docker-compose -f docker-compose-dev.yml up       # Full development stack
docker-compose -f docker-compose-sftp.yml up -d   # With SFTP test server
docker-compose -f docker-compose.minimal.yml up   # Minimal setup

# Production-like
docker-compose up -d          # Standard production setup
docker-compose.simple.yml     # Simplified deployment

# Management
npm run docker:stop          # Stop all containers
docker-compose logs -f       # Monitor logs
```

### Testing & Debugging
```bash
# Connection testing
node test-sftp-connection.js    # Test SFTP connections
node test-sftp-upload.js        # Test SFTP upload functionality
node test-ftp-server.js         # Start local FTP test server

# Debug utilities
test-localstorage.html          # LocalStorage functionality tests
clear-storage.html              # Reset LocalStorage
fix-storage.html                # Fix corrupted storage
test-schedule-queue.html        # Schedule system testing
```

## Critical Implementation Details

### Data Retention System (NEW)
**60-Day Retention Policy:**
- Completed uploads: Physical files deleted immediately, metadata compressed
- Client-side cleanup: Tasks older than 60 days auto-removed from LocalStorage
- Server-side cleanup: Daily cleanup of expired temporary files
- Capacity warnings: 80% warning, 90% critical with cleanup prompts

```javascript
// Cleanup triggers
saveScheduledUploads()  // Automatic 60-day cleanup on save
autoCleanupOldTasks()   // Manual/automatic 30-day cleanup
checkStorageCapacity()  // Every 30 seconds + on operations
```

### File Upload Processing
**Enhanced Upload Pipeline:**
1. **Temporary Storage**: Files saved server-side for scheduled uploads
2. **Encoding Detection**: Automatic Shift-JIS vs UTF-8 detection
3. **BOM Handling**: UTF-8 BOM addition for Rakuten RMS compatibility
4. **Line Ending Normalization**: CRLF for Windows server compatibility
5. **Upload Verification**: Post-upload existence verification
6. **Cleanup**: Immediate file deletion with compressed log retention

### Profile & Schedule Management
**Profile Storage:**
- LocalStorage with timestamp-based unique IDs
- Automatic corruption detection and cleanup
- Schema: host, port, username, password, protocol, defaultDirectory
- Multi-format support: CSV, HTML, XML, TXT, ZIP

**Schedule System:**
- **Dual persistence**: LocalStorage (client) + JSON files (server)
- **Execution modes**: Immediate upload, scheduled date/time, recurring
- **Queue management**: Status tracking (waiting → executing → completed/failed)
- **Retry logic**: Automatic retries with exponential backoff

### Directory Browser System
**Three Browser Modes:**
- `browseServerDirectory()` - Modal popup browser
- `browseServerDirectoryFromSidebar()` - Sidebar integration
- `browseUploadDirectory()` - Main area browser

**Path Persistence:**
- Directory paths saved to profile.defaultDirectory
- Automatic path validation to prevent corruption
- Cross-session persistence with fallback handling

## Performance & Capacity Management

### LocalStorage Optimization
**Capacity Limits:**
- Browser limit: ~5-10MB (varies by browser)
- Warning threshold: 80% usage
- Critical threshold: 90% usage with auto-cleanup prompt
- Automatic cleanup: 30+ day old completed tasks

**Optimization Strategies:**
- Completed task compression (remove unnecessary fields)
- Automatic 60-day data expiration
- Manual cleanup tools with detailed usage statistics
- Real-time capacity monitoring and warnings

### File Size Constraints
- Maximum file size: 100MB per file
- Frontend size: 170KB+ single file (consider modularization)
- Concurrent uploads: Supported but may impact performance
- Memory usage: Optimized with stream processing

## Test Server Configurations

### SFTP Test Servers
```javascript
// Rebex Test Server (most reliable)
{
  host: 'test.rebex.net',
  username: 'demo',
  password: 'password',
  port: 22,
  protocol: 'sftp'
}

// Alternative test configurations in test-servers.json
```

### FTP Test Servers
```javascript
// DLP Test Server
{
  host: 'ftp.dlptest.com',
  username: 'dlpuser',
  password: 'rNrKYTX9g7z3RgJRmxWuGHbeu',
  port: 21,
  protocol: 'ftp'
}
```

### Rakuten RMS Production
```javascript
{
  protocol: 'sftp',
  host: 'upload.rakuten.ne.jp',
  port: 22,
  encoding: 'UTF-8 with BOM',
  lineEndings: 'CRLF',
  recommendedPath: '/batch'  // For CSV uploads
}
```

## Common Issues & Solutions

### Schedule Upload Failures
**Problem**: 500 errors on scheduled upload execution
**Cause**: File objects lost after page reload (cannot persist in LocalStorage)
**Solution**: Server-side temporary file storage system implemented

### **CRITICAL BUG - Schedule Execution File Not Found (September 2025)**
**Problem**: Scheduled uploads execute successfully but files are not uploaded ("No files found for schedule")
**Root Cause**: File path resolution issue in scheduler service
- Schedules execute and connect to FTP server properly
- Debug logs show "No files found for schedule" even when files exist in `data/uploads/`
- Issue is in `scheduler-service.ts` line 95: source directory path construction

**Symptoms**:
- Schedule executes at correct time
- FTP connection successful
- Log shows "No files found for schedule [name]"
- Files exist in `data/uploads/` directory
- Email notifications may not trigger

**Investigation Results**:
- `data/uploads/` contains multiple CSV files (verified)
- Database schedules are properly configured
- Source directory path resolution needs fixing

**Solution Applied**:
```typescript
// Fixed in scheduler-service.ts line 95-97
const sourceDir = schedule.source_directory === '.' || !schedule.source_directory ? baseDir : path.join(baseDir, schedule.source_directory);
logger.info(`FIXED Debug - Base directory: ${baseDir}, Source directory setting: "${schedule.source_directory}", Final sourceDir: ${sourceDir}`);
```

**Debug Endpoints Added**:
- `GET /api/schedules/debug/:id` - Check schedule configuration and file availability
- Enhanced logging in scheduler service execution

**Status**: Fix implemented, requires container restart to take effect

### Capacity Issues
**Problem**: LocalStorage full, system becoming slow
**Solution**: Use built-in capacity management tools
```javascript
// Manual cleanup
autoCleanupOldTasks()  // Remove 30+ day old tasks
checkStorageCapacity() // Check current usage
showStorageDetails()   // Detailed usage breakdown
```

### Directory Browser Issues
**Problem**: Yellow directory button not responding
**Solutions**:
- Use sidebar directory browser as alternative
- Check `browseServerDirectory()` function implementation
- Verify profile.defaultDirectory persistence

### File Upload Path Issues
**Problem**: Files not appearing in expected server directory
**Solutions**:
- Use `/batch` for Rakuten RMS CSV uploads
- Verify upload verification response (`verified: true`)
- Check profile.defaultDirectory field persistence

### Sidebar Settings Not Persisting
**Problem**: Upload directory settings in sidebar not being reflected in schedules
**Status**: Under investigation - related to schedule creation form not reading sidebar settings
**Next Steps**: Need to investigate how sidebar settings are passed to schedule creation form

## Security Considerations

### Current Implementation Limitations
- Credentials stored in LocalStorage (not production-secure)
- No server-side authentication system
- Basic file type validation only
- Direct credential transmission

### Production Security Requirements
- Implement proper authentication/authorization system
- Encrypt stored credentials or use token-based auth
- Add server-side session management with timeouts
- Implement rate limiting and request validation
- Add comprehensive audit logging and monitoring
- Use HTTPS only in production

## Architectural Improvements Needed

### High Priority
1. **Frontend Modularization**: Break 170KB+ index.html into components
   - Separate JS modules for schedule, profile, upload, capacity management
   - Extract CSS into separate stylesheets
   - Implement proper module bundling (Webpack/Vite)

2. **Database Migration**: Replace JSON file persistence
   - Migrate to SQLite for development, PostgreSQL for production
   - Implement proper schema with migrations
   - Add database connection pooling and error handling

3. **Authentication System**: Replace LocalStorage credential storage
   - Implement JWT-based authentication
   - Add user management and role-based access
   - Secure credential handling with encryption at rest

4. **Testing Framework**: Add comprehensive testing
   - Unit tests for backend APIs (Jest/Mocha)
   - Integration tests for upload flows
   - Frontend testing with Cypress/Playwright
   - Load testing for concurrent uploads

### Medium Priority
1. **State Management**: Frontend state architecture
   - Implement Redux/Zustand for complex state
   - Add proper state persistence beyond LocalStorage
   - Implement state synchronization between client/server

2. **API Documentation**: Comprehensive API documentation
   - OpenAPI/Swagger specification
   - Interactive API explorer
   - SDK generation for different languages

3. **Error Handling**: Robust error management
   - Global error boundaries for frontend
   - Structured error responses from backend
   - Error reporting and monitoring integration

4. **Performance Optimization**: System performance improvements
   - Redis caching layer for frequently accessed data
   - File upload streaming optimization
   - Database query optimization
   - Frontend bundle optimization

### Low Priority
1. **Microservices Architecture**: Service decomposition
   - Split upload service from scheduling service
   - Separate user management service
   - API gateway implementation

2. **Real-time Features**: Enhanced user experience
   - WebSocket implementation for real-time progress
   - Server-sent events for status updates
   - Real-time collaboration features

3. **Internationalization**: Multi-language support
   - i18n implementation for Japanese/English
   - Locale-specific date/time formatting
   - Cultural adaptation for different markets

4. **Advanced Features**: Extended functionality
   - Advanced scheduling (cron expressions, complex patterns)
   - File transformation pipelines
   - Advanced retry policies with exponential backoff
   - Usage analytics and reporting dashboard

## Development Workflow

### Before Making Changes
1. Check existing patterns in codebase before implementing new features
2. Test with both SFTP and FTP protocols
3. Verify LocalStorage capacity impact for frontend changes
4. Test schedule persistence across page reloads

### Testing Checklist
1. Upload functionality with various file sizes and encodings
2. Schedule creation and execution across page reloads
3. Capacity management and cleanup functionality
4. Directory browsing across different server types
5. Error handling and recovery scenarios

### Deployment Considerations
1. Ensure data/ directory permissions for file operations
2. Configure environment variables for production
3. Set up proper logging and monitoring
4. Implement backup strategy for persistent data
5. Configure reverse proxy for production (nginx config included)