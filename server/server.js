const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// In-memory state (backed by file)
let fractalState = {
    totalPets: 0,
    todayPets: 0,
    complexity: 4,
    age: 0,
    lastPetTime: null,
    createdAt: new Date().toISOString(),
    lastDayReset: new Date().toISOString(),
    petHistory: [], // Store recent pets for analytics
    milestones: []
};

// Load state from file on startup
async function loadState() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        fractalState = JSON.parse(data);
        console.log('✅ Loaded fractal state from file');

        // Check if we need to do daily reset
        checkDailyReset();
    } catch (error) {
        console.log('📝 No existing state found, starting fresh');
        await saveState();
    }
}

// Save state to file
async function saveState() {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(fractalState, null, 2));
    } catch (error) {
        console.error('❌ Error saving state:', error);
    }
}

// Check if we need to reset daily counters
function checkDailyReset() {
    const now = new Date();
    const lastReset = new Date(fractalState.lastDayReset);

    // Check if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
        console.log('🌅 New day detected! Aging fractal...');

        // Calculate days passed
        const daysPassed = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
        fractalState.age += daysPassed;

        // Reset today's counter
        fractalState.todayPets = 0;
        fractalState.lastDayReset = now.toISOString();

        // Record milestone
        fractalState.milestones.push({
            type: 'day_completed',
            age: fractalState.age,
            totalPets: fractalState.totalPets,
            timestamp: now.toISOString()
        });

        saveState();
    }
}

// Calculate complexity based on total pets
function calculateComplexity(totalPets) {
    const minComplexity = 4;
    const maxComplexity = 16;
    const petsPerLevel = 50; // 50 pets to increase complexity by 1

    const complexity = minComplexity + Math.floor(totalPets / petsPerLevel);
    return Math.min(maxComplexity, complexity);
}

// Check for milestones
function checkMilestones(totalPets) {
    const milestones = [10, 50, 100, 500, 1000, 5000, 10000];
    const lastMilestone = fractalState.milestones
        .filter(m => m.type === 'pet_milestone')
        .map(m => m.count)
        .sort((a, b) => b - a)[0] || 0;

    for (const milestone of milestones) {
        if (totalPets >= milestone && lastMilestone < milestone) {
            fractalState.milestones.push({
                type: 'pet_milestone',
                count: milestone,
                timestamp: new Date().toISOString()
            });
            console.log(`🎉 Milestone reached: ${milestone} total pets!`);
        }
    }
}

// API Routes

// GET /api/fractal - Get current fractal state
app.get('/api/fractal', (req, res) => {
    checkDailyReset();

    res.json({
        totalPets: fractalState.totalPets,
        todayPets: fractalState.todayPets,
        complexity: fractalState.complexity,
        age: fractalState.age,
        lastPetTime: fractalState.lastPetTime,
        createdAt: fractalState.createdAt
    });
});

// POST /api/pet - Register a pet interaction
app.post('/api/pet', async (req, res) => {
    checkDailyReset();

    const { x, y, timestamp } = req.body;

    // Update state
    fractalState.totalPets++;
    fractalState.todayPets++;
    fractalState.lastPetTime = new Date().toISOString();
    fractalState.complexity = calculateComplexity(fractalState.totalPets);

    // Record in history (keep last 100)
    fractalState.petHistory.push({
        x, y, timestamp,
        time: fractalState.lastPetTime
    });
    if (fractalState.petHistory.length > 100) {
        fractalState.petHistory.shift();
    }

    // Check for milestones
    checkMilestones(fractalState.totalPets);

    // Save to disk
    await saveState();

    console.log(`🐾 Pet registered! Total: ${fractalState.totalPets}, Today: ${fractalState.todayPets}`);

    res.json({
        success: true,
        state: {
            totalPets: fractalState.totalPets,
            todayPets: fractalState.todayPets,
            complexity: fractalState.complexity,
            age: fractalState.age,
            lastPetTime: fractalState.lastPetTime,
            createdAt: fractalState.createdAt
        }
    });
});

// GET /api/stats - Get detailed statistics
app.get('/api/stats', (req, res) => {
    checkDailyReset();

    res.json({
        totalPets: fractalState.totalPets,
        todayPets: fractalState.todayPets,
        complexity: fractalState.complexity,
        age: fractalState.age,
        createdAt: fractalState.createdAt,
        milestones: fractalState.milestones,
        averagePetsPerDay: fractalState.age > 0 ?
            Math.floor(fractalState.totalPets / fractalState.age) :
            fractalState.totalPets
    });
});

// GET /api/milestones - Get milestone history
app.get('/api/milestones', (req, res) => {
    res.json({
        milestones: fractalState.milestones
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Daily reset check (runs every hour)
setInterval(() => {
    checkDailyReset();
}, 60 * 60 * 1000);

// Periodic auto-save (every 5 minutes)
setInterval(async () => {
    await saveState();
    console.log('💾 Auto-saved fractal state');
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, saving state...');
    await saveState();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, saving state...');
    await saveState();
    process.exit(0);
});

// Start server
async function start() {
    await loadState();

    app.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║     🌀 FractalPet Server Running 🌀      ║
║                                          ║
║     Port: ${PORT}                       ║
║     Total Pets: ${fractalState.totalPets.toString().padStart(10)}              ║
║     Age: ${fractalState.age.toString().padStart(4)} days                      ║
║     Complexity: ${fractalState.complexity.toString().padStart(2)}                       ║
║                                          ║
╚══════════════════════════════════════════╝
        `);
        console.log(`🌐 Open http://localhost:${PORT} in your browser`);
    });
}

start();
