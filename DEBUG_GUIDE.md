# 🚀 Full-Stack Debugging Guide

### Visto Capital Partner Portal - VS Code Debug Configurations

## 🎯 **Quick Start**

### **1. Simple Full-Stack Debugging**

Press `F5` and select **"🚀 Debug Next.js (Full-Stack)"** to start debugging your entire application.

### **2. Advanced Debugging Options**

Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) → "Debug: Select and Start Debugging" to choose from all available configurations.

---

## 🛠️ **Available Debug Configurations**

### **🚀 Debug Next.js (Full-Stack)**

- **Purpose**: Complete Next.js application debugging
- **Port**: 3001 (avoiding conflicts)
- **Features**:
  - Server-side React components
  - API routes debugging
  - Environment variables loaded
  - Auto-opens browser when ready
- **Use Case**: General development and debugging

### **🌐 Debug Next.js Client-Side**

- **Purpose**: Browser-based React component debugging
- **Features**:
  - Chrome DevTools integration
  - React component state inspection
  - Client-side JavaScript debugging
  - Source map support
- **Use Case**: Frontend components, hooks, client-side logic

### **🛠️ Debug Next.js Server-Side**

- **Purpose**: Dedicated server-side debugging
- **Features**:
  - API routes debugging
  - Server components
  - Database operations
  - Supabase integration debugging
- **Use Case**: Backend API development, server-side rendering

### **🗄️ Debug Supabase Functions**

- **Purpose**: Debug Supabase Edge Functions
- **Features**:
  - Local Supabase function debugging
  - Database trigger debugging
  - Edge function development
- **Use Case**: Custom Supabase functions, webhooks

### **🧪 Debug Jest Tests**

- **Purpose**: Unit and integration test debugging
- **Features**:
  - Breakpoints in test files
  - Component testing debugging
  - API testing
- **Use Case**: Test-driven development

### **📱 Debug Mobile (Chrome DevTools)**

- **Purpose**: Mobile viewport debugging
- **Features**:
  - iPhone user agent simulation
  - Mobile-responsive debugging
  - Touch event debugging
- **Use Case**: Mobile UI development

---

## 🎯 **Compound Configurations** (Multiple Debuggers)

### **🎯 Debug Full-Stack (Client + Server)**

**Starts**: Next.js Full-Stack + Client-Side Chrome debugger
**Best for**: Complete application debugging with browser inspection

### **🔥 Debug Complete Stack (Next.js + Supabase)**

**Starts**: Next.js Full-Stack + Supabase Functions
**Best for**: Full backend debugging including custom functions

### **🧪 Debug with Tests**

**Starts**: Next.js Full-Stack + Jest Tests
**Best for**: Test-driven development workflow

---

## 📋 **How to Use Each Configuration**

### **🚀 For General Development**

1. Press `F5`
2. Select "🚀 Debug Next.js (Full-Stack)"
3. Set breakpoints in any `.tsx`, `.ts`, or API route files
4. Application opens automatically at http://localhost:3001

### **🌐 For Frontend Component Debugging**

1. Start "🚀 Debug Next.js (Full-Stack)" first
2. Then start "🌐 Debug Next.js Client-Side"
3. Set breakpoints in React components
4. Use Chrome DevTools for state inspection

### **🛠️ For API/Backend Debugging**

1. Use "🛠️ Debug Next.js Server-Side"
2. Set breakpoints in:
   - `src/app/api/*/route.ts` files
   - `src/lib/auth.ts`
   - `src/lib/supabase.ts`
   - Any server-side utilities

### **🗄️ For Database/Supabase Debugging**

1. Use "🗄️ Debug Supabase Functions"
2. Create functions in `supabase/functions/`
3. Set breakpoints in edge functions
4. Debug database triggers and webhooks

### **📱 For Mobile Development**

1. Use "📱 Debug Mobile (Chrome DevTools)"
2. Test responsive design
3. Debug touch interactions
4. Validate mobile-specific features

---

## 🎯 **Debugging Specific Components**

### **Authentication Flow**

```typescript
// Set breakpoints in:
src/components/signup-form.tsx       // Signup form submission
src/components/login-form.tsx        // Login form submission
src/lib/auth.ts                      // Auth utility functions
src/app/api/auth/*/route.ts          // Auth API routes (if any)
```

### **Onboarding Flow**

```typescript
// Set breakpoints in:
src/contexts/OnboardingContext.tsx   // Form state management
src/components/steps/*.tsx           // Individual step components
src/app/onboarding/page.tsx         // Main onboarding page
```

### **Database Operations**

```typescript
// Set breakpoints in:
src / lib / supabase.ts; // Supabase client
src / lib / auth.ts; // Profile operations
src / app / api / health / route.ts; // Database connectivity
```

### **UI Components**

```typescript
// Set breakpoints in:
src / components / ui;
/*.tsx             // Shadcn/UI components
src/components/*.tsx                // Custom components
src/app/*/ page.tsx; // Page components
```

---

## 🔧 **Advanced Debugging Tips**

### **1. Environment Variables**

- All configurations automatically load `.env.local`
- Check values in debugger: `process.env.NEXT_PUBLIC_SUPABASE_URL`

### **2. Network Requests**

- Use Chrome DevTools Network tab during client-side debugging
- Monitor Supabase API calls
- Inspect request/response headers

### **3. Database Debugging**

- Use Supabase Studio: http://127.0.0.1:54323
- Set breakpoints in auth utility functions
- Monitor SQL queries in Supabase logs

### **4. React State Debugging**

- Use React DevTools browser extension
- Set breakpoints in `useState` and `useEffect`
- Inspect component props and state

### **5. Form Debugging**

- Set breakpoints in form submission handlers
- Use browser DevTools to inspect form data
- Debug validation logic step by step

---

## ⚡ **Quick Debugging Shortcuts**

### **VS Code Shortcuts**

- `F5` - Start debugging
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Ctrl+Shift+F5` - Restart debugger

### **Chrome DevTools Shortcuts**

- `F12` - Open DevTools
- `Ctrl+Shift+C` - Inspect element
- `Ctrl+Shift+J` - Open Console
- `Ctrl+Shift+I` - Open DevTools

---

## 🚨 **Troubleshooting**

### **Port Conflicts**

If port 3001 is busy:

1. Change port in launch configurations
2. Update health check URL
3. Restart debugging

### **Breakpoints Not Working**

1. Ensure source maps are enabled
2. Check file paths in configurations
3. Restart debugger with `Ctrl+Shift+F5`

### **Environment Variables Not Loading**

1. Verify `.env.local` exists
2. Check `envFile` path in launch configuration
3. Restart VS Code

### **Supabase Connection Issues**

1. Ensure Supabase is running: `npx supabase status`
2. Check health endpoint: http://localhost:3001/api/health
3. Verify environment variables

---

## 🎯 **Best Practices**

### **1. Start Simple**

- Begin with "🚀 Debug Next.js (Full-Stack)"
- Add client-side debugging when needed
- Use compound configurations for complex scenarios

### **2. Strategic Breakpoints**

- Set breakpoints at function entry points
- Debug API routes before client-side code
- Use conditional breakpoints for specific scenarios

### **3. Development Workflow**

1. Start debugging configuration
2. Set breakpoints in relevant files
3. Trigger the functionality (click button, submit form)
4. Step through code to understand flow
5. Use Console for quick variable inspection

### **4. Performance Debugging**

- Use Chrome DevTools Performance tab
- Monitor React re-renders
- Check network request timing
- Profile component load times

---

## 🏆 **Ready to Debug!**

Your Visto Capital Partner Portal now has:

- ✅ **6 specialized debug configurations**
- ✅ **3 compound debugging setups**
- ✅ **Optimized VS Code settings**
- ✅ **Full source map support**
- ✅ **Environment variable integration**
- ✅ **Chrome DevTools integration**

### **🚀 Start Debugging:**

1. Press `F5` to begin
2. Choose your debugging configuration
3. Set breakpoints where needed
4. Happy debugging! 🐛➡️✨

---

_Need help? Check the health endpoint at http://localhost:3001/api/health to verify all systems are working correctly._
