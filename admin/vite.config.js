import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const adminDirectory = fileURLToPath(new URL('.', import.meta.url))
const repositoryDirectory = resolve(adminDirectory, '..')

export default defineConfig({
  base: '/oro-admin/',
  build: {
    emptyOutDir: true,
    outDir: resolve(repositoryDirectory, 'dist-admin'),
  },
  envDir: repositoryDirectory,
  plugins: [react()],
  root: adminDirectory,
})
