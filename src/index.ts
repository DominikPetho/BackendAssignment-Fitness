import http from 'http'
import express from 'express'
import * as bodyParser from 'body-parser'

import { sequelize } from './db'
import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'
import AuthRouter from './routes/auth'
import UserRouter from './routes/users'
import UserProfileRouter from './routes/userProfile'

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Global middleware to set Content-Type header
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json')
    next()
})

// Global JSON serializer to remove null values
app.set('json replacer', (key: string, value: any) => {
    return value === null ? undefined : value
})

// Public routes (no authentication required)
app.use('/auth', AuthRouter())

// Protected routes (authentication required)
app.use('/programs', ProgramRouter())
app.use('/exercises', ExerciseRouter())
app.use('/users', UserRouter())
app.use('/user', UserProfileRouter())

const httpServer = http.createServer(app)

sequelize.sync()

console.log('Sync database', process.env.DATABASE_URL)

httpServer.listen(8000).on('listening', () => console.log(`Server started at port ${8000}`))

export default httpServer
