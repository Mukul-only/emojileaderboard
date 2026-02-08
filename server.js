require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files differently based on environment
// In Netlify, static files are served from the root by the CDN
if (!process.env.NETLIFY) {
    app.use(express.static(path.join(__dirname, 'public')));
}

let db;
let client;

// Connect to MongoDB
async function connectDB() {
    // If we already have a connection, use it (crucial for serverless re-use)
    if (db && client) return db;

    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is missing in environment variables');
            return null;
        }
        
        client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        db = client.db('emoji');
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Don't exit process in serverless, just throw
        throw error;
    }
}

// API endpoint to get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (!db) await connectDB();
        
        // Check if db is still null (e.g. config error)
        if (!db) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        // Use aggregation to lookup member details from users collection
        const leaderboard = await db.collection('leaderboards')
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'members',
                        foreignField: '_id',
                        as: 'memberDetails'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        teamName: 1,
                        name: 1,
                        score: 1,
                        members: {
                            $map: {
                                input: '$memberDetails',
                                as: 'member',
                                in: {
                                    name: '$$member.name',
                                    rollNumber: '$$member.rollNumber'
                                }
                            }
                        }
                    }
                },
                {
                    $sort: { score: -1 }
                }
            ])
            .toArray();
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// For local development only: Serve index.html on root if not found
if (!process.env.NETLIFY) {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Export for Netlify Functions
module.exports.handler = serverless(app);

// Start server locally (if not imported as a module or in serverless env)
if (!process.env.NETLIFY && require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    });
}
