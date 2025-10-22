/**
 * Main Application Logic
 * Handles API communication, user interaction, and UI updates
 */

class FractalApp {
    constructor() {
        this.renderer = null;
        this.state = null;
        this.apiBase = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : '/api';
        this.updateInterval = null;
        this.canPet = true;
        this.petCooldown = 1000; // 1 second between pets

        this.init();
    }

    async init() {
        // Initialize fractal renderer
        this.renderer = new FractalRenderer('fractal-canvas');

        // Load initial state
        await this.loadState();

        // Set up event listeners
        this.setupEventListeners();

        // Start periodic state updates
        this.startPeriodicUpdates();

        // Update UI
        this.updateUI();

        this.setStatus('Ready! Click the fractal to pet it.', 'success');
    }

    setupEventListeners() {
        const canvas = document.getElementById('fractal-canvas');

        // Click to pet
        canvas.addEventListener('click', async (e) => {
            if (!this.canPet) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            await this.petFractal(x, y);
        });

        // Touch support for mobile
        canvas.addEventListener('touchend', async (e) => {
            if (!this.canPet) return;
            e.preventDefault();

            const rect = canvas.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            await this.petFractal(x, y);
        });
    }

    async loadState() {
        try {
            const response = await fetch(`${this.apiBase}/fractal`);
            if (!response.ok) throw new Error('Failed to load fractal state');

            this.state = await response.json();
            this.renderer.updateFractal(this.state);

            return this.state;
        } catch (error) {
            console.error('Error loading state:', error);
            this.setStatus('Failed to connect to server. Using offline mode.', 'error');

            // Fallback state
            this.state = {
                totalPets: 0,
                todayPets: 0,
                age: 0,
                complexity: 4,
                lastPetTime: null,
                createdAt: new Date().toISOString()
            };
        }
    }

    async petFractal(x, y) {
        if (!this.canPet) return;

        // Disable petting temporarily
        this.canPet = false;
        setTimeout(() => { this.canPet = true; }, this.petCooldown);

        // Visual feedback
        this.renderer.triggerPetEffect();
        this.createPetEffect(x, y);
        this.playPetSound();

        // Send to server
        try {
            const response = await fetch(`${this.apiBase}/pet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, timestamp: Date.now() })
            });

            if (!response.ok) throw new Error('Failed to register pet');

            const result = await response.json();
            this.state = result.state;

            // Update everything
            this.renderer.updateFractal(this.state);
            this.updateUI();

            // Show message
            const messages = [
                'The fractal purrs contentedly 🌀',
                'It grows a little bit! ✨',
                'The fractal feels your care 💫',
                'New patterns emerge! 🎨',
                'The mathematics dance! 🌟',
                'Complexity increases! 📈'
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            this.setStatus(randomMessage, 'success');

            this.addActivity(`Someone pet the fractal! (+1)`);

        } catch (error) {
            console.error('Error petting fractal:', error);
            this.setStatus('Pet failed to register. Try again!', 'error');
        }
    }

    createPetEffect(x, y) {
        const canvas = document.getElementById('fractal-canvas');
        const container = document.getElementById('canvas-container');

        const effect = document.createElement('div');
        effect.className = 'pet-effect';
        effect.textContent = ['✨', '💫', '⭐', '🌟', '💖'][Math.floor(Math.random() * 5)];
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';

        container.appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    playPetSound() {
        // Create a pleasant chime sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Pleasant frequency (C major chord notes)
            const frequencies = [523.25, 659.25, 783.99]; // C, E, G
            const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];

            oscillator.frequency.value = randomFreq;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Silently fail if audio doesn't work
            console.log('Audio not available');
        }
    }

    updateUI() {
        if (!this.state) return;

        // Update stats
        document.getElementById('today-pets').textContent = this.state.todayPets.toLocaleString();
        document.getElementById('total-pets').textContent = this.state.totalPets.toLocaleString();
        document.getElementById('complexity').textContent = Math.floor(this.state.complexity);
        document.getElementById('age').textContent = `${this.state.age} days`;

        // Update contributor count
        // Estimate unique contributors (rough approximation)
        const estimatedContributors = Math.max(1, Math.floor(this.state.totalPets / 10));
        document.getElementById('contributor-count').textContent = estimatedContributors.toLocaleString();
    }

    setStatus(message, type = 'info') {
        const statusEl = document.getElementById('status-message');
        statusEl.textContent = message;
        statusEl.style.borderLeftColor = type === 'success' ? '#4facfe' :
                                         type === 'error' ? '#ff6ec4' :
                                         '#7873f5';
    }

    addActivity(message) {
        const activityEl = document.getElementById('recent-activity');
        const item = document.createElement('div');
        item.className = 'activity-item';

        const time = new Date().toLocaleTimeString();
        item.textContent = `[${time}] ${message}`;

        activityEl.insertBefore(item, activityEl.firstChild);

        // Keep only last 5 activities
        while (activityEl.children.length > 5) {
            activityEl.removeChild(activityEl.lastChild);
        }
    }

    startPeriodicUpdates() {
        // Update state every 5 seconds
        this.updateInterval = setInterval(async () => {
            const oldTotalPets = this.state?.totalPets || 0;

            await this.loadState();
            this.updateUI();

            // Show activity if someone else pet the fractal
            const newTotalPets = this.state?.totalPets || 0;
            const petDiff = newTotalPets - oldTotalPets;

            if (petDiff > 0) {
                this.addActivity(`${petDiff} new pet${petDiff > 1 ? 's' : ''} from the community!`);
            }
        }, 5000);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.renderer) {
            this.renderer.destroy();
        }
    }
}

// Initialize app when page loads
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new FractalApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) app.destroy();
});
