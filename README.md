# 🌀 FractalPet - The Living Mathematical Lifeform

A beautiful, community-driven 3D fractal that evolves and grows each day through collective interaction. Pet the fractal, watch it evolve, and be part of a shared digital life form.

## ✨ Concept

**FractalPet** is a shared, persistent 3D fractal visualization that:
- **Lives forever** - The fractal's state is preserved across all visits
- **Grows through care** - Every "pet" (click) increases its complexity
- **Ages daily** - Each new day adds to its age and triggers evolution
- **Belongs to everyone** - A single global fractal shared by all users
- **Responds to touch** - Beautiful visual and audio feedback on interaction

Think of it as a collective digital pet - a Tamagotchi for the mathematical world, where everyone shares responsibility for a single, evolving creature made of pure mathematics.

## 🎮 How It Works

### User Experience
1. **Visit** the website
2. **Click** anywhere on the fractal to pet it
3. **Watch** it glow and respond to your touch
4. **See** the stats update in real-time
5. **Return** daily to see how it has evolved

### Growth Mechanics
- **Petting**: Each click increases the total pet count
- **Complexity**: Every ~50 pets increases the fractal's iteration depth (4 → 16 max)
- **Daily Aging**: The fractal ages each day, becoming more mature
- **Color Shift**: Appearance changes based on time of day
- **Milestones**: Special events at 10, 50, 100, 500, 1K, 5K, 10K+ pets

## 🛠️ Tech Stack

### Frontend
- **Three.js** - 3D rendering engine
- **WebGL** - GPU-accelerated graphics
- **Custom Shaders** - GLSL fragment shaders for Mandelbulb ray marching
- **Vanilla JavaScript** - No frameworks, pure performance
- **CSS3** - Modern animations and glassmorphism effects

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server and API
- **JSON File Storage** - Simple, portable persistence

### Rendering Technique
The fractal is rendered using **ray marching**, a technique that:
1. Casts rays from the camera through each pixel
2. Marches along each ray, testing distance to the fractal surface
3. Uses a **Mandelbulb** distance estimator for 3D fractal geometry
4. Calculates lighting, shadows, and colors in real-time
5. Runs entirely on the GPU for smooth 60fps rendering

## 📁 Project Structure

```
3dfractal/
├── public/               # Frontend static files
│   ├── index.html       # Main HTML page
│   ├── styles.css       # Styling and animations
│   ├── app.js           # Main application logic
│   └── fractal.js       # Three.js fractal renderer
├── server/              # Backend
│   ├── server.js        # Express API server
│   └── data.json        # Persistent fractal state
├── package.json         # Dependencies
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ installed
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 3dfractal
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

4. **Open your browser**
```
http://localhost:3000
```

### Development Mode

For auto-restart on file changes:
```bash
npm run dev
```

## 🎨 Features

### Current Features ✅
- ✨ Beautiful 3D Mandelbulb fractal rendering
- 👆 Click/tap to pet with visual feedback
- 🎵 Pleasant audio chimes on interaction
- 📊 Real-time statistics display
- 💾 Persistent state across sessions
- 📅 Daily growth and aging system
- 🌈 Dynamic color shifting based on time of day
- 🎯 Milestone tracking (10, 50, 100+ pets)
- 📱 Mobile-responsive touch controls
- 🔄 Auto-sync with server every 5 seconds
- 🎭 Smooth animations and effects

### Planned Enhancements 🚧
- 🌍 Visitor map showing where pets come from
- 📸 Daily snapshot gallery
- 🎁 Achievement badges
- 💬 Community message board
- 📈 Historical growth charts
- 🎨 Unlockable color palettes
- 🔊 Generative ambient music
- 📤 Export as STL for 3D printing
- 🌟 Seasonal special events
- 🏆 Leaderboard for top contributors

## 🎛️ API Endpoints

### GET `/api/fractal`
Returns current fractal state
```json
{
  "totalPets": 1247,
  "todayPets": 42,
  "complexity": 8,
  "age": 5,
  "lastPetTime": "2025-10-22T14:30:00.000Z",
  "createdAt": "2025-10-17T00:00:00.000Z"
}
```

### POST `/api/pet`
Register a pet interaction
```json
// Request
{ "x": 245, "y": 389, "timestamp": 1698765432000 }

// Response
{
  "success": true,
  "state": { /* updated state */ }
}
```

### GET `/api/stats`
Get detailed statistics including milestones

### GET `/api/milestones`
Get milestone history

## 🎨 Customization

### Adjusting Fractal Parameters

Edit `public/fractal.js`:

```javascript
// Change fractal type
power: { value: 8.0 }  // 8 = Mandelbulb, try 2-12

// Adjust color palette
vec3 d = vec3(0.263, 0.416, 0.557); // RGB color weights

// Change camera distance
this.camera.position.z = 3; // Try 2-5
```

### Modifying Growth Rate

Edit `server/server.js`:

```javascript
const petsPerLevel = 50; // Change to 25 for faster growth
```

### Styling

Edit `public/styles.css` to customize colors, fonts, and animations.

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)

### Data Persistence
Fractal state is saved to `server/data.json` and auto-saves:
- On every pet interaction
- Every 5 minutes (auto-save)
- On server shutdown (graceful)

## 📊 How Complexity Works

| Total Pets | Complexity (Iterations) | Visual Effect |
|------------|------------------------|---------------|
| 0-49       | 4                      | Simple form   |
| 50-99      | 5                      | More detail   |
| 100-149    | 6                      | Clear structure |
| ...        | ...                    | ...           |
| 600+       | 16 (max)              | Maximum detail |

Higher complexity = more GPU intensive but more beautiful!

## 🐛 Troubleshooting

### Fractal not rendering
- Check browser console for WebGL errors
- Ensure your GPU supports WebGL 2.0
- Try a different browser

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js is version 14+
- Run `npm install` again

### Pets not saving
- Check file permissions on `server/data.json`
- Look for errors in server console

## 🤝 Contributing

Ideas for contributions:
1. Add new fractal types (Julia sets, Mandelbrot, etc.)
2. Implement user accounts for personal fractals
3. Create social features (comments, sharing)
4. Add mobile app versions
5. Optimize shader performance
6. Create artistic visualizations of growth data

## 📜 License

MIT License - Feel free to use, modify, and distribute!

## 🙏 Acknowledgments

- Inspired by Tamagotchi virtual pets
- Mathematical beauty of Mandelbulb fractals
- The amazing Three.js community
- Everyone who pets the fractal ❤️

## 🌟 Philosophy

This project explores the intersection of:
- **Mathematics** - The elegant complexity of fractals
- **Community** - Collective care for a shared digital entity
- **Art** - Finding beauty in algorithmic generation
- **Persistence** - Creating something that outlives individual sessions

Every pet matters. Every click adds to something larger than yourself. The fractal remembers.

---

**Made with ✨ and mathematics**

*"The fractal exists because people care."*
