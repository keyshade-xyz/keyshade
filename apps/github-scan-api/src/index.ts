import { createServer } from './app'

createServer().listen(8080, () => {
  console.log('Server is running on http://localhost:8080')
})
