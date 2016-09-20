import UsersModel from './UsersModel'
import mongoose from 'mongoose'

const DB_NAME = 'mksystem'
const DB_PORT = '27017'
const DB_HOST = `mongodb://localhost:${DB_PORT}/${DB_NAME}`

export mongoose.connect(DB_HOST)
