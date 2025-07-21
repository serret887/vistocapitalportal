# 🐛 Full-Stack Debugging Guide

## VS Code Debug Configurations

Your project now includes comprehensive debugging configurations for Next.js + Supabase development.

### 🎯 **Available Debug Configurations**

#### **1. 🚀 Debug Next.js (Client + Server)**
- **Purpose**: Debug both client and server-side code
- **Port**: 3001 (configured to avoid conflicts)
- **Best for**: API routes, server components, SSR debugging
- **Auto-opens**: Browser when server is ready

#### **2. 🌐 Debug Next.js Client-Side**
- **Purpose**: Debug React components, client-side logic
- **Browser**: Chrome with source maps
- **Best for**: Component logic, hooks, client-side state management
- **Features**: React DevTools compatible

#### **3. 🔧 Debug Next.js Server-Side Only**
- **Purpose**: Focus only on server-side debugging
- **Best for**: API routes, middleware, server components
- **Performance**: Lighter than full-stack debugging

#### **4. 🗄️ Debug Supabase Functions**
- **Purpose**: Debug Supabase Edge Functions
- **Environment**: Local Supabase with proper env vars
- **Best for**: Database functions, auth logic, custom endpoints

#### **5. 🧪 Debug Jest Tests**
- **Purpose**: Debug unit and integration tests
- **Features**: Run tests in debug mode with breakpoints
- **Coverage**: Disabled for better debugging experience

#### **6. 🔍 Debug Specific Test File**
- **Purpose**: Debug a single test file
- **Usage**: Open test file, then run this configuration
- **Best for**: Isolated test debugging

#### **7. 📱 Debug Mobile (Chrome DevTools)**
- **Purpose**: Debug mobile responsive behavior
- **Features**: Chrome mobile simulation with debugging
- **Best for**: Mobile-specific issues, responsive design

### 🔥 **Compound Configurations** (Multiple debuggers at once)

#### **🎯 Debug Full-Stack (Client + Server)**
- Runs: Next.js Server + Chrome Client debugging
- **Best for**: End-to-end debugging of user flows

#### **🔥 Debug Complete Stack (Next.js + Supabase)**
- Runs: Next.js Server + Supabase Functions
- **Best for**: Full backend debugging including database operations

## 🛠️ **How to Use**

### **Step 1: Start Supabase (if needed)**
```bash
npx supabase start
```

### **Step 2: Choose Debug Configuration**
1. Open VS Code Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "Debug: Select and Start Debugging"
3. Choose your configuration
4. Or use the Debug panel (F5)

### **Step 3: Set Breakpoints**
- Click in the gutter next to line numbers
- Or use `F9` to toggle breakpoints
- Breakpoints work in:
  - Server-side code (API routes, components)
  - Client-side code (React components, hooks)
  - Tests (Jest test files)
  - Supabase functions

### **Step 4: Debug**
- **F5**: Start debugging
- **F10**: Step over
- **F11**: Step into
- **Shift+F11**: Step out
- **F6**: Pause
- **Shift+F5**: Stop debugging

## 🎯 **Debugging Specific Scenarios**

### **🔍 Debugging Onboarding Flow**
1. Use **"🎯 Debug Full-Stack"** configuration
2. Set breakpoints in:
   - `src/components/steps/Step*.tsx` (client-side)
   - `src/contexts/OnboardingContext.tsx` (state management)
   - `src/lib/auth.ts` (authentication logic)
3. Test signup flow at `http://localhost:3001/signup`

### **🗄️ Debugging Database Operations**
1. Use **"🗄️ Debug Supabase Functions"** configuration
2. Set breakpoints in:
   - `src/lib/auth.ts` (auth functions)
   - `src/lib/supabase.ts` (database client)
3. Check Supabase Studio at `http://127.0.0.1:54323`

### **🎨 Debugging UI Components**
1. Use **"🌐 Debug Next.js Client-Side"** configuration
2. Set breakpoints in:
   - Component render methods
   - Event handlers
   - useEffect hooks
   - State updates
3. Use React DevTools in Chrome

### **📱 Debugging Mobile Experience**
1. Use **"📱 Debug Mobile"** configuration
2. Chrome will open in mobile simulation mode
3. Test responsive design and touch interactions

### **🧪 Debugging Tests**
1. Open test file in VS Code
2. Use **"🔍 Debug Specific Test File"** for single file
3. Or **"🧪 Debug Jest Tests"** for all tests
4. Set breakpoints in test code and implementation

## 🔧 **Debugging Configuration Details**

### **Environment Variables**
- All configurations use your `.env.local` file
- Supabase configs include local development URLs
- NODE_ENV set to "development" for proper debugging

### **Source Maps**
- TypeScript source maps enabled
- React component debugging supported
- Server-side debugging with full stack traces

### **Performance Optimizations**
- Node modules excluded from debugging
- Source map resolution optimized
- Skip files configured for cleaner debugging

### **Browser Settings**
- Chrome security disabled for local development
- Custom user data directory for debugging
- Remote debugging port configured

## 📋 **Troubleshooting**

### **Port Conflicts**
- Next.js configured for port 3001 (avoiding 3000 conflicts)
- Supabase uses standard ports (54321, 54322, 54323)
- Chrome debugging uses port 9222

### **Source Maps Not Working**
1. Ensure TypeScript is configured correctly
2. Check that `.next` folder is regenerated
3. Clear browser cache and restart debugging

### **Breakpoints Not Hitting**
1. Verify you're in the correct debugging configuration
2. Check that files are properly saved
3. Ensure source maps are generated

### **Supabase Connection Issues**
1. Verify Supabase is running: `npx supabase status`
2. Check `.env.local` has correct URLs
3. Ensure database is migrated: `npx supabase db reset`

## 🏆 **Pro Tips**

### **Multiple Debug Sessions**
- You can run multiple configurations simultaneously
- Use compound configurations for complex debugging scenarios
- Each debugger has its own console and variables panel

### **Debug Console**
- Use the Debug Console to execute JavaScript expressions
- Access to all variables in current scope
- Can modify variables during debugging

### **Conditional Breakpoints**
- Right-click on breakpoint → Add Condition
- Only breaks when condition is true
- Great for debugging loops or specific scenarios

### **Call Stack Navigation**
- Click on any frame in call stack to navigate
- See variable values at each frame level
- Understand execution flow through your app

### **Variable Inspection**
- Hover over variables to see values
- Use Variables panel for detailed inspection
- Watch expressions for monitoring specific values

## 🎉 **Happy Debugging!**

This setup provides comprehensive debugging capabilities for your Next.js + Supabase application. You can now debug:
- Frontend React components and logic
- Backend API routes and server components
- Database operations and Supabase functions
- Authentication flows
- Mobile responsive behavior
- Unit and integration tests

Choose the appropriate configuration based on what you're debugging, and leverage VS Code's powerful debugging features to build your application more efficiently! 