import express, { Express } from "express"
import userRoutes from "./api/routes/userRoutes"
import bodyParser from "body-parser"
import cors from "cors"
import cookieParser from "cookie-parser"
import "dotenv/config"

const app: Express = express()

app.use(cookieParser())
app.use(cors())
app.use(bodyParser.json())

userRoutes(app)

export default app