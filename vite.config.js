import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Enable polyfills for specific globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy API calls to the Express server
      '/analyze': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/generate-prd-requirements': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Only include vendor chunk if we have external dependencies
          // Since @anthropic-ai/sdk is server-side only, we don't need it in client
        }
      }
    },
    
    // Optimize build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    }
  },
  
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // Asset handling
  publicDir: 'public',
  
  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCaseOnly'
    }
  }
})