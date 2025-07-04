const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("container").appendChild(renderer.domElement);

// Clock for animation
const clock = new THREE.Clock();

// Planet data with realistic properties
const planetData = {
  mercury: {
    name: "Mercury",
    radius: 1.4,
    distance: 8,
    speed: 4.74,
    color: 0x8c7853,
  },
  venus: {
    name: "Venus",
    radius: 1.9,
    distance: 12,
    speed: 3.5,
    color: 0xffc649,
  },
  earth: {
    name: "Earth",
    radius: 2,
    distance: 16,
    speed: 2.98,
    color: 0x6b93d6,
  },
  mars: {
    name: "Mars",
    radius: 1.5,
    distance: 20,
    speed: 2.41,
    color: 0xcd5c5c,
  },
  jupiter: {
    name: "Jupiter",
    radius: 3.5,
    distance: 28,
    speed: 1.31,
    color: 0xd8ca9d,
  },
  saturn: {
    name: "Saturn",
    radius: 3.1,
    distance: 36,
    speed: 0.97,
    color: 0xfad5a5,
  },
  uranus: {
    name: "Uranus",
    radius: 2.5,
    distance: 44,
    speed: 0.68,
    color: 0x4fd0e7,
  },
  neptune: {
    name: "Neptune",
    radius: 2.4,
    distance: 52,
    speed: 0.54,
    color: 0x4b70dd,
  },
};

// Create stars background
function createStarField() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 2000;
    starPositions[i + 1] = (Math.random() - 0.5) * 2000;
    starPositions[i + 2] = (Math.random() - 0.5) * 2000;

    // Add some color variation to stars
    const brightness = Math.random() * 0.5 + 0.5;
    starColors[i] = brightness;
    starColors[i + 1] = brightness;
    starColors[i + 2] = brightness;
  }

  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3)
  );
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    sizeAttenuation: false,
    vertexColors: true,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  return stars;
}

// Create realistic planet texture
function createPlanetTexture(color, name) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Create gradient for planet surface
  const gradient = ctx.createLinearGradient(0, 0, 512, 256);
  const baseColor = new THREE.Color(color);

  // Add some variation to the color
  gradient.addColorStop(0, `hsl(${baseColor.getHSL({}).h * 360}, 70%, 30%)`);
  gradient.addColorStop(0.5, `hsl(${baseColor.getHSL({}).h * 360}, 80%, 50%)`);
  gradient.addColorStop(1, `hsl(${baseColor.getHSL({}).h * 360}, 60%, 20%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);

  // Add surface details
  ctx.globalCompositeOperation = "overlay";
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const size = Math.random() * 20 + 5;
    const opacity = Math.random() * 0.3 + 0.1;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Create sun
function createSun() {
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32);

  // Create sun texture
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(256, 128, 0, 256, 128, 256);
  gradient.addColorStop(0, "#ffff00");
  gradient.addColorStop(0.3, "#ffaa00");
  gradient.addColorStop(0.6, "#ff6600");
  gradient.addColorStop(1, "#ff0000");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);

  const sunTexture = new THREE.CanvasTexture(canvas);

  const sunMaterial = new THREE.MeshBasicMaterial({
    map: sunTexture,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3,
  });

  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.userData = { name: "Sun", type: "sun" };
  scene.add(sun);

  // Sun light
  const sunLight = new THREE.PointLight(0xffffff, 2, 0);
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);

  return sun;
}

// Create Saturn's rings
function createSaturnRings() {
  const ringGeometry = new THREE.RingGeometry(2.5, 4, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  });
  const rings = new THREE.Mesh(ringGeometry, ringMaterial);
  rings.rotation.x = Math.PI / 2;
  return rings;
}

// Create planets
const planets = {};
const planetSpeeds = {};

function createPlanets() {
  Object.keys(planetData).forEach((planetKey) => {
    const data = planetData[planetKey];
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const texture = createPlanetTexture(data.color, data.name);

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 30,
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.position.x = data.distance;
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.userData = { name: data.name, type: "planet" };

    // Create orbit group
    const orbitGroup = new THREE.Group();
    orbitGroup.add(planet);

    // Add rings to Saturn
    if (planetKey === "saturn") {
      const rings = createSaturnRings();
      planet.add(rings);
    }

    scene.add(orbitGroup);
    planets[planetKey] = {
      mesh: planet,
      orbitGroup: orbitGroup,
      data: data,
    };

    planetSpeeds[planetKey] = data.speed;
  });
}

// Create control panel
function createControls() {
  const controlsDiv = document.getElementById("planetControls");

  Object.keys(planetData).forEach((planetKey) => {
    const data = planetData[planetKey];
    const controlGroup = document.createElement("div");
    controlGroup.className = "planet-control";

    const label = document.createElement("div");
    label.className = "planet-label";
    label.textContent = data.name;
    label.style.color = `#${data.color.toString(16).padStart(6, "0")}`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "10";
    slider.step = "0.1";
    slider.value = data.speed;
    slider.className = "speed-slider";

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "speed-value";
    valueDisplay.textContent = data.speed.toFixed(1);

    slider.addEventListener("input", (e) => {
      const newSpeed = parseFloat(e.target.value);
      planetSpeeds[planetKey] = newSpeed;
      valueDisplay.textContent = newSpeed.toFixed(1);
    });

    controlGroup.appendChild(label);
    controlGroup.appendChild(slider);
    controlGroup.appendChild(valueDisplay);
    controlsDiv.appendChild(controlGroup);
  });
}

// Mouse interaction
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let cameraAngleX = 0;
let cameraAngleY = 0;
let cameraDistance = 80;

function setupMouseControls() {
  renderer.domElement.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  renderer.domElement.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;

    const deltaX = e.clientX - mouseX;
    const deltaY = e.clientY - mouseY;

    cameraAngleY += deltaX * 0.01;
    cameraAngleX += deltaY * 0.01;

    cameraAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraAngleX));

    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  renderer.domElement.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  renderer.domElement.addEventListener("wheel", (e) => {
    cameraDistance += e.deltaY * 0.1;
    cameraDistance = Math.max(20, Math.min(200, cameraDistance));
  });
}

// Tooltip functionality
const tooltip = document.getElementById("tooltip");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function setupTooltip() {
  renderer.domElement.addEventListener("mousemove", (e) => {
    if (isMouseDown) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.name) {
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 10 + "px";
        tooltip.style.top = e.clientY - 30 + "px";
        tooltip.textContent = obj.userData.name;
      }
    } else {
      tooltip.style.display = "none";
    }
  });
}

// Animation controls
let isPaused = false;
let isLightTheme = false;
let stars;

document.getElementById("pauseBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").textContent = isPaused
    ? "Resume"
    : "Pause";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  // Reset all planet positions
  Object.keys(planets).forEach((planetKey) => {
    planets[planetKey].orbitGroup.rotation.y = 0;
    planetSpeeds[planetKey] = planetData[planetKey].speed;
  });

  // Reset sliders
  document.querySelectorAll(".speed-slider").forEach((slider, index) => {
    const planetKey = Object.keys(planetData)[index];
    slider.value = planetData[planetKey].speed;
    slider.nextElementSibling.textContent =
      planetData[planetKey].speed.toFixed(1);
  });
});

// Theme toggle functionality
document.getElementById("themeToggle").addEventListener("click", () => {
  isLightTheme = !isLightTheme;
  const body = document.body;
  const themeBtn = document.getElementById("themeToggle");

  if (isLightTheme) {
    body.classList.add("light-theme");
    themeBtn.textContent = "☀️ Light Mode";

    // Change renderer clear color for light theme
    renderer.setClearColor(0x87ceeb, 1.0);

    // Adjust star brightness for light theme
    if (stars) {
      stars.material.opacity = 0.9;
      stars.material.transparent = true;
    }
  } else {
    body.classList.remove("light-theme");
    themeBtn.textContent = "🌙 Dark Mode";

    // Change renderer clear color back to dark
    renderer.setClearColor(0x000000, 1.0);

    // Restore star brightness for dark theme
    if (stars) {
      stars.material.opacity = 1.0;
      stars.material.transparent = false;
    }
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  if (!isPaused) {
    // Rotate planets around sun
    Object.keys(planets).forEach((planetKey) => {
      const planet = planets[planetKey];
      const speed = planetSpeeds[planetKey];
      planet.orbitGroup.rotation.y += speed * deltaTime * 0.1;

      // Rotate planet on its axis
      planet.mesh.rotation.y += deltaTime * 2;
    });

    // Rotate sun
    scene.children.forEach((child) => {
      if (child.userData && child.userData.type === "sun") {
        child.rotation.y += deltaTime * 0.5;
      }
    });
  }

  // Update camera position
  camera.position.x =
    Math.cos(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
  camera.position.y = Math.sin(cameraAngleX) * cameraDistance;
  camera.position.z =
    Math.sin(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize everything
function init() {
  stars = createStarField();
  createSun();
  createPlanets();
  createControls();
  setupMouseControls();
  setupTooltip();

  // Set initial camera position
  camera.position.set(0, 30, 80);
  camera.lookAt(0, 0, 0);

  // Set initial renderer clear color
  renderer.setClearColor(0x000000, 1.0);

  animate();
}

init();
