import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import { config } from 'dotenv';
import router from './router/route.js';

/** import connection files */
import connect from './database/conn.js';
import { connectRedis, redisClient } from './database/redis.js';
import RedisStore from 'connect-redis';

const app = express()

config();

/** app middlewares */
app.use(morgan('tiny'));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

/** Session configuration (will use Redis if available) */
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
};

// Add Redis store if available
try {
    if (redisClient) {
        sessionConfig.store = new RedisStore({ client: redisClient });
        console.log('Using Redis for session storage');
    }
} catch (error) {
    console.log('Using memory store for sessions (Redis not available)');
}

app.use(session(sessionConfig));


/** appliation port */
const port = process.env.PORT || 8080;


/** routes */
app.use('/api', router) /** apis */


app.get('/', (req, res) => {
    try {
        res.json("Get Request")
    } catch (error) {
        res.json(error)
    }
})



/** start server with MongoDB (Redis is optional) */
connect().then(() => {
    // Try to connect to Redis, but don't fail if it's not available
    connectRedis().catch(err => {
        console.log('Redis connection failed, continuing without Redis:', err.message);
    });

    try {
        app.listen(port, () => {
            console.log(`Server connected to http://localhost:${port}`)
            console.log('MongoDB connection established')
        })
    } catch (error) {
        console.log("Cannot connect to the server");
    }
}).catch(error => {
    console.log("MongoDB connection error:", error);
    console.log("Cannot start server without MongoDB");
})




