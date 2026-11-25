import { defineConfig } from 'vite'

// Relative base so one build works under `vite preview` and GitHub project Pages.
// Study PNGs stay at the repository root; Vite only copies them into the build output.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
})
