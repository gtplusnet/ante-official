# API Integration Guide

## 🔗 API Integration

### Authentication
- Custom token-based (40-character hex strings)
- Header: `token: YOUR_TOKEN_HERE`
- Test credentials: `guillermotabligan` / `water123`

### Frontend Setup
Add this header to all API requests:
```javascript
axios.defaults.headers.common['X-Source'] = 'frontend-main';
```

**That's it!** Frontend access is controlled by RLS policies, backend has full access.

### 🔄 Supabase Realtime Integration
For proper realtime notifications with session persistence, see detailed implementation guide in `/frontends/frontend-main/CLAUDE.md` under "Supabase Realtime Integration" section. Key requirements:
- Auth boot file for session restoration on page refresh
- X-Source header for RLS policy identification
- Proper boot sequence in Quasar configuration

### Test API Call
```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"guillermotabligan","password":"water123"}'
```

## 🚨 API Response Formats - CRITICAL FOR FRONTEND DEVELOPMENT

### Two Response Patterns (MUST UNDERSTAND)

#### 1. Direct Response (95% of endpoints - STANDARD)
```javascript
// Backend uses: utilityService.responseHandler()
// Response: { employeeCode: "GT3337", name: "John", ... }

// ✅ CORRECT Frontend:
const response = await api.get('/endpoint');
return response.data; // Direct access

// ❌ WRONG - Returns undefined:
return response.data.data; // No nested data!
```

#### 2. Wrapped Response (Rare - CMS, some creates)
```javascript
// Backend uses: utilityService.handleResponse()
// Response: { message: "Success", data: { id: 1, ... } }

// ✅ CORRECT Frontend:
const response = await api.post('/cms/endpoint', data);
return response.data.data; // Access nested data

// ❌ WRONG - Returns wrapper object:
return response.data; // Returns { message, data }
```

### Quick Check: Which Pattern?
1. Test with curl to see actual response
2. Check controller for `responseHandler` vs `handleResponse`
3. Most GET requests use direct pattern

## Related Documentation
- **Full API Response Patterns**: `/documentation/standards/api-response-patterns.md`
- **API Details**: `/backend/postman/` or `/backend/test/api/README.md`
- **Frontend Auth Patterns**: `/documentation/standards/frontend-auth-patterns.md`