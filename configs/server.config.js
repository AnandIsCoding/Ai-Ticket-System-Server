import dotenv from 'dotenv'
dotenv.config()

export const PORT = process.env.PORT || 7000
export const DATABASE_URI = process.env.DATABASE_URI
export const CLIENT_ID = process.env.CLIENT_ID
export const MAIL_HOST = process.env.MAIL_HOST
export const MAIL_USER = process.env.MAIL_USER
export const MAIL_PASS = process.env.MAIL_PASS
export const MAIL_PORT = process.env.MAIL_PORT
export const SECRET_KEY = process.env.SECRET_KEY
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY

