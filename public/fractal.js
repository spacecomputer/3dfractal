/**
 * FractalRenderer - Creates and manages the 3D fractal visualization
 * Uses Three.js and custom shaders for GPU-accelerated ray marching
 */

class FractalRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.fractalMesh = null;
        this.uniforms = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.time = 0;

        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.canvas.clientWidth / this.canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 3;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shader uniforms - these control the fractal's appearance
        this.uniforms = {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(this.canvas.clientWidth, this.canvas.clientHeight) },
            mouse: { value: new THREE.Vector2(0.5, 0.5) },
            complexity: { value: 8.0 },  // Iterations - grows with pets
            power: { value: 8.0 },        // Mandelbulb power
            scale: { value: 1.0 },        // Scale factor
            colorShift: { value: 0.0 },   // Color rotation
            glow: { value: 0.0 }          // Glow intensity (for pet effect)
        };

        // Create fractal material with custom shader
        const fractalMaterial = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
            side: THREE.DoubleSide
        });

        // Create fullscreen quad for ray marching
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.fractalMesh = new THREE.Mesh(geometry, fractalMaterial);
        this.scene.add(this.fractalMesh);

        // Mouse tracking for camera control
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });

        // Handle window resize
        window.addEventListener('resize', () => this.onResize());

        // Start animation loop
        this.animate();
    }

    getVertexShader() {
        return `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;
    }

    getFragmentShader() {
        return `
            uniform float time;
            uniform vec2 resolution;
            uniform vec2 mouse;
            uniform float complexity;
            uniform float power;
            uniform float scale;
            uniform float colorShift;
            uniform float glow;

            varying vec2 vUv;

            const int MAX_STEPS = 100;
            const float MIN_DIST = 0.001;
            const float MAX_DIST = 100.0;

            // Mandelbulb distance estimator
            float mandelbulb(vec3 pos) {
                vec3 z = pos;
                float dr = 1.0;
                float r = 0.0;
                int iterations = int(complexity);

                for (int i = 0; i < 16; i++) {
                    if (i >= iterations) break;

                    r = length(z);
                    if (r > 2.0) break;

                    // Convert to polar coordinates
                    float theta = acos(z.z / r);
                    float phi = atan(z.y, z.x);
                    dr = pow(r, power - 1.0) * power * dr + 1.0;

                    // Scale and rotate the point
                    float zr = pow(r, power);
                    theta = theta * power;
                    phi = phi * power;

                    // Convert back to cartesian coordinates
                    z = zr * vec3(
                        sin(theta) * cos(phi),
                        sin(phi) * sin(theta),
                        cos(theta)
                    );
                    z += pos;
                }

                return 0.5 * log(r) * r / dr;
            }

            // Ray marching
            float trace(vec3 origin, vec3 direction) {
                float totalDist = 0.0;

                for (int i = 0; i < MAX_STEPS; i++) {
                    vec3 pos = origin + direction * totalDist;
                    float dist = mandelbulb(pos * scale);
                    totalDist += dist;

                    if (dist < MIN_DIST || totalDist > MAX_DIST) break;
                }

                return totalDist;
            }

            // Calculate normal for lighting
            vec3 calcNormal(vec3 pos) {
                vec2 e = vec2(0.001, 0.0);
                return normalize(vec3(
                    mandelbulb(pos * scale + e.xyy) - mandelbulb(pos * scale - e.xyy),
                    mandelbulb(pos * scale + e.yxy) - mandelbulb(pos * scale - e.yxy),
                    mandelbulb(pos * scale + e.yyx) - mandelbulb(pos * scale - e.yyx)
                ));
            }

            // Color palette
            vec3 palette(float t) {
                vec3 a = vec3(0.5, 0.5, 0.5);
                vec3 b = vec3(0.5, 0.5, 0.5);
                vec3 c = vec3(1.0, 1.0, 1.0);
                vec3 d = vec3(0.263, 0.416, 0.557) + colorShift;
                return a + b * cos(6.28318 * (c * t + d));
            }

            void main() {
                // Setup camera
                vec2 uv = (vUv - 0.5) * 2.0;
                uv.x *= resolution.x / resolution.y;

                // Camera rotation based on time and mouse
                float rotY = time * 0.1 + mouse.x * 2.0;
                float rotX = mouse.y * 0.5;

                vec3 origin = vec3(
                    sin(rotY) * 3.0,
                    rotX * 2.0,
                    cos(rotY) * 3.0
                );

                vec3 target = vec3(0.0);
                vec3 forward = normalize(target - origin);
                vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
                vec3 up = cross(forward, right);

                vec3 direction = normalize(forward + uv.x * right + uv.y * up);

                // Ray march
                float dist = trace(origin, direction);

                // Color based on distance and angle
                vec3 color = vec3(0.0);

                if (dist < MAX_DIST) {
                    vec3 pos = origin + direction * dist;
                    vec3 normal = calcNormal(pos);

                    // Lighting
                    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                    float diffuse = max(dot(normal, lightDir), 0.0);
                    float specular = pow(max(dot(reflect(-lightDir, normal), -direction), 0.0), 32.0);

                    // Ambient occlusion approximation
                    float ao = 1.0 - float(MAX_STEPS) / float(MAX_STEPS);

                    // Color based on complexity and position
                    vec3 baseColor = palette(complexity / 16.0 + length(pos) * 0.1);

                    color = baseColor * (diffuse * 0.8 + 0.2) * ao + specular * 0.5;

                    // Add glow effect when pet
                    color += vec3(1.0, 0.8, 1.0) * glow * 0.5;
                } else {
                    // Background with subtle gradient
                    color = mix(vec3(0.02, 0.01, 0.03), vec3(0.05, 0.03, 0.08), uv.y * 0.5 + 0.5);
                }

                // Vignette
                float vignette = smoothstep(0.8, 0.2, length(vUv - 0.5));
                color *= vignette;

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    // Update fractal parameters based on game state
    updateFractal(state) {
        if (!state) return;

        // Map total pets to complexity (iterations)
        // Start at 4, max at 16
        const maxIterations = 16;
        const minIterations = 4;
        const iterationsPerPet = 0.01;
        this.uniforms.complexity.value = Math.min(
            maxIterations,
            minIterations + state.totalPets * iterationsPerPet
        );

        // Map daily cycle to color shift
        const hourOfDay = new Date().getHours();
        this.uniforms.colorShift.value = (hourOfDay / 24.0) * 0.5;

        // Map age to scale
        this.uniforms.scale.value = 1.0 + (state.age * 0.01);
    }

    // Trigger pet effect
    triggerPetEffect() {
        // Create glow pulse
        this.uniforms.glow.value = 1.0;

        // Animate glow fade
        const fadeGlow = () => {
            this.uniforms.glow.value *= 0.9;
            if (this.uniforms.glow.value > 0.01) {
                requestAnimationFrame(fadeGlow);
            } else {
                this.uniforms.glow.value = 0;
            }
        };
        fadeGlow();
    }

    onResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.uniforms.resolution.value.set(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.01;
        this.uniforms.time.value = this.time;

        // Smooth mouse tracking
        this.uniforms.mouse.value.x += (this.mouseX - this.uniforms.mouse.value.x) * 0.05;
        this.uniforms.mouse.value.y += (this.mouseY - this.uniforms.mouse.value.y) * 0.05;

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.renderer.dispose();
        this.scene.clear();
    }
}
