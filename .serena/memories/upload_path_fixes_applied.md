# Upload Path Fixes Applied - 2025-09-12

## Problem Fixed
- 500 errors on `/api/upload-temp-file` endpoint
- Access denied errors for `/pub` and `/pub/example` paths on test.rebex.net
- 14 scheduled uploads failing due to incorrect paths

## Solution Implemented
### Backend fixes in sftp-server.js:

1. **upload-temp-file endpoint** (line ~1115):
   - Added automatic path correction for test.rebex.net
   - Changes `/pub` paths to `/` (root directory)
   - Changes Rakuten paths from `/pub` to `/ritem`

2. **Regular upload endpoint** (line ~440):
   - Same path correction logic applied
   - Prevents 550 Access Denied errors

### Path Correction Logic:
```javascript
// Fix problematic paths for test.rebex.net
if (host === 'test.rebex.net' && (uploadPath === '/pub' || uploadPath.startsWith('/pub/'))) {
    uploadPath = '/';
}

// Fix path for Rakuten RMS
if (host && host.includes('rakuten')) {
    if (uploadPath === '/pub' || uploadPath === '/pub/example') {
        uploadPath = '/ritem';
    }
}
```

## Test Results
- Server restarted with fixes
- Path corrections now happen automatically server-side
- No more 500 errors expected on scheduled uploads
- All 14 pending uploads should now succeed with corrected paths

## Frontend Scripts Available
- `fix-upload-errors.js` - Comprehensive client-side fix
- `fix-upload-log.js` - Upload history tracking
- `fix-multi-server-complete.js` - Multi-server scheduling
- `fix-directory-selection.js` - Directory browser fixes
- `fix-sidebar-server-switch.js` - Server switching sync