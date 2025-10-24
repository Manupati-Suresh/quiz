import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config } from 'dotenv';
import router from './router/route.js';

/** import connection file */
import connect from './database/conn.js';

const app = express()

config();

// Add debugging middleware first
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

/** app middlewares */
app.use(morgan('tiny'));
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** application port */
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    try {
        res.json({ message: "Server is running!", timestamp: new Date() })
    } catch (error) {
        res.json(error)
    }
})

/** routes */
app.use('/api', router) /** apis */

/** start server only when we have valid connection */
connect().then(() => {
    try {
        app.listen(port, () => {
            console.log(`Server connected to http://localhost:${port}`)
            console.log(`Test the server at: http://localhost:${port}`)
            console.log(`API endpoints available at: http://localhost:${port}/api`)
        })
    } catch (error) {
        console.log("Cannot connect to the server:", error);
    }
}).catch(error => {
    console.log("Invalid Database Connection:", error);
    // Start server anyway for testing
    app.listen(port, () => {
        console.log(`Server started without database on http://localhost:${port}`)
    })
})