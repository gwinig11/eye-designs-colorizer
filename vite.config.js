import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import generateHandler from './api/generate.js'

const normalizeEnvValue = (value) => (
  value && value !== 'undefined' && value !== 'null' ? value : undefined
)

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = ''

  req.on('data', (chunk) => {
    body += chunk
  })

  req.on('end', () => {
    if (!body) {
      resolve({})
      return
    }

    try {
      resolve(JSON.parse(body))
    } catch (error) {
      reject(error)
    }
  })

  req.on('error', reject)
})

const createVercelLikeResponse = (res) => {
  res.status = (statusCode) => {
    res.statusCode = statusCode
    return res
  }

  res.json = (payload) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json')
    }

    res.end(JSON.stringify(payload))
  }

  return res
}

const localApiPlugin = () => ({
  name: 'local-api-generate',
  configureServer(server) {
    server.middlewares.use('/api/generate', async (req, res) => {
      try {
        req.body = await readJsonBody(req)
        await generateHandler(req, createVercelLikeResponse(res))
      } catch (error) {
        res.statusCode = error instanceof SyntaxError ? 400 : 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: error instanceof SyntaxError ? 'Invalid JSON body.' : 'Local API handler failed.' }))
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.OPENAI_API_KEY = normalizeEnvValue(process.env.OPENAI_API_KEY) || normalizeEnvValue(env.OPENAI_API_KEY) || normalizeEnvValue(env.VITE_OPENAI_API_KEY)
  process.env.VITE_OPENAI_API_KEY = normalizeEnvValue(process.env.VITE_OPENAI_API_KEY) || normalizeEnvValue(env.VITE_OPENAI_API_KEY)

  return {
    plugins: [react(), localApiPlugin()],
    server: {
      proxy: {
        '/v1': {
          target: 'https://api.openai.com',
          changeOrigin: true,
        }
      }
    }
  }
})
