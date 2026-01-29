// ============================================================================
// CONFIGURATION ET CONSTANTES
// ============================================================================
const CONFIG = {
  canvasWidth: 700,
  canvasHeight: 700,
  gridSize: 7,           // 7x7 = 49 dessins
  drawingSize: 70,
  minDrawingSize: 28,
  speed: 0.5,              // pixels par frame
  canvasId: 'gameCanvas',
  targetNameId: 'targetName',
  scoreId: 'score',
  errorsId: 'errors',
  feedbackId: 'feedback'
};

const SVG_NAMES = [
  "Alan Garner.svg",
  "Albus Perceval Wulfric Brian Dumbledore.svg",
  "Alric the Champion.svg",
  "Beherit.svg",
  "Benji.svg",
  "Bill Overbeck.svg",
  "Brock.svg",
  "Chevaucheur de cochon.svg",
  "Diva Plavalaguna.svg",
  "Django Unchained.svg",
  "Dustin Henderson.svg",
  "Ezio Auditore da Firenze.svg",
  "Gajeel Redfox.svg",
  "Garen.svg",
  "Garcons de Guerre.svg",
  "Marla Singer.svg",
  "Itachi Uchiwa.svg",
  "J. Robert Oppenheimer.svg",
  "Jack Skellington.svg",
  "Jack Sparrow.svg",
  "Jean Pierre Polnareff.svg",
  "Jinx.svg",
  "Jules Winnfield.svg",
  "L'aubergiste.svg",
  "Lara Croft.svg",
  "Leonidas Georges Kestekides.svg",
  "Link.svg",
  "Leon.svg",
  "Markus.svg",
  "Matt.svg",
  "Mister T. (Barracuda).svg",
  "Morpheus.svg",
  "Olorin (Gandalf).svg",
  "Pierre, le guerissologue.svg",
  "Ratchet.svg",
  "Raze.svg",
  "Reiner Braun.svg",
  "Rick Sanchez.svg",
  "Riuk.svg",
  "Saitama.svg",
  "Shorty Meeks.svg",
  "Sorciere.svg",
  "Thor.svg",
  "Thorkell le Grand.svg",
  "Trevor Philips.svg",
  "Walter White.svg",
  "Yoda.svg",
  "Yoshi.svg"
];

// ============================================================================
// CLASSE Drawing : Représente un dessin avec comportement physique
// ============================================================================
class Drawing {
  constructor(id, name, col, row) {
    this.id = id;
    this.name = name;
    this.col = col;
    this.row = row;
    // Position centrée dans chaque cellule de grille (sera recalculée au resize)
    this.x = col * (CONFIG.canvasWidth / CONFIG.gridSize) + 
             (CONFIG.canvasWidth / CONFIG.gridSize - CONFIG.drawingSize) / 2;
    this.y = row * (CONFIG.canvasHeight / CONFIG.gridSize) + 
             (CONFIG.canvasHeight / CONFIG.gridSize - CONFIG.drawingSize) / 2;
    // Vitesse aléatoire mais lissée
    this.vx = (Math.random() - 0.5) * CONFIG.speed * 2;
    this.vy = (Math.random() - 0.5) * CONFIG.speed * 2;
    // Chargement de l'image SVG
    this.image = new Image();
    this.image.src = `Assets/SVG/${name}`;
    this.loaded = false;
    this.image.onload = () => { this.loaded = true; };
  }

  /**
   * Met à jour la position avec rebondissement aux bords
   */
  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Rebondissement aux bords du canvas (logique DVD)
    if (this.x < 0 || this.x + CONFIG.drawingSize > CONFIG.canvasWidth) {
      this.vx *= -1;
      this.x = Math.max(0, Math.min(CONFIG.canvasWidth - CONFIG.drawingSize, this.x));
    }
    if (this.y < 0 || this.y + CONFIG.drawingSize > CONFIG.canvasHeight) {
      this.vy *= -1;
      this.y = Math.max(0, Math.min(CONFIG.canvasHeight - CONFIG.drawingSize, this.y));
    }
  }

  /**
   * Dessine le dessin sur le contexte 2D du canvas
   */
  draw(ctx) {
    if (this.loaded) {
      ctx.drawImage(this.image, this.x, this.y, CONFIG.drawingSize, CONFIG.drawingSize);
    }
    // Optionnellement, dessiner un placeholder si pas chargé
  }

  /**
   * Détecte si un point (px, py) est à l'intérieur du dessin (hitbox 70x70 centrée)
   */
  contains(px, py) {
    const centerX = this.x + CONFIG.drawingSize / 2;
    const centerY = this.y + CONFIG.drawingSize / 2;
    const halfHitbox = CONFIG.drawingSize / 2;
    return px >= centerX - halfHitbox && px <= centerX + halfHitbox &&
           py >= centerY - halfHitbox && py <= centerY + halfHitbox;
  }
}

// Helper: redimensionne le canvas en fonction du conteneur et du devicePixelRatio
function resizeCanvasToDisplaySize(canvas, manager) {
  const dpr = window.devicePixelRatio || 1;
  const parentRect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : canvas.getBoundingClientRect();
  // Utilise une taille carrée qui ne dépasse jamais les dimensions du support
  const maxSize = Math.floor(Math.min(parentRect.width, parentRect.height || parentRect.width));
  const displaySize = Math.max(100, maxSize);
  if (canvas.width !== Math.floor(displaySize * dpr) || canvas.height !== Math.floor(displaySize * dpr)) {
    canvas.width = Math.floor(displaySize * dpr);
    canvas.height = Math.floor(displaySize * dpr);
    canvas.style.width = displaySize + 'px';
    canvas.style.height = displaySize + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Update logical sizes (en CSS pixels)
    CONFIG.canvasWidth = displaySize;
    CONFIG.canvasHeight = displaySize;
    CONFIG.drawingSize = Math.max(CONFIG.minDrawingSize, Math.round(displaySize / CONFIG.gridSize * 0.85));
    if (manager && typeof manager._repositionDrawings === 'function') manager._repositionDrawings();
  }
}

// ============================================================================
// CLASSE GameManager : Gère la logique du jeu
// ============================================================================
class GameManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.drawings = [];
    this.score = 0;
    this.errors = 0;
    this.currentTarget = null;
    this.feedbackMessage = '';
    this.feedbackTime = 0;
    this.audioPlayed = false;

    // Initialiser l'audio
    this.audio = new Audio('Assets/wanted-minigame.mp3'); 
    this.audio.loop = true;

    // Responsive setup
    this._applyResponsiveSizing();

    this._initializeDrawings();
    this._repositionDrawings();
    this._selectRandomTarget();
    this._setupEventListeners();
    this._startGameLoop();
  }

  /**
   * Crée 49 dessins (7x7) avec noms uniques
   */
  _initializeDrawings() {
    for (let i = 0; i < SVG_NAMES.length; i++) {
      const name = SVG_NAMES[i];
      const row = Math.floor(i / CONFIG.gridSize);
      const col = i % CONFIG.gridSize;
      this.drawings.push(new Drawing(i, name, col, row));
    }
  }

  /**
   * Choisit un dessin aléatoire comme cible et l'affiche
   */
  _selectRandomTarget() {
    const randomIndex = Math.floor(Math.random() * this.drawings.length);
    this.currentTarget = this.drawings[randomIndex];
    const targetElement = document.getElementById(CONFIG.targetNameId);
    if (targetElement) {
      targetElement.textContent = this.currentTarget.name.replace('.svg', '');
    }
  }

  /**
   * Configure les écouteurs d'événements
   */
  _setupEventListeners() {
    this.canvas.addEventListener('click', (e) => this._handleCanvasClick(e));
  }

  _applyResponsiveSizing() {
    // initial resize
    resizeCanvasToDisplaySize(this.canvas, this);
    // Debounced resize handler
    let timeout;
    window.addEventListener('resize', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => resizeCanvasToDisplaySize(this.canvas, this), 150);
    });
  }

  _repositionDrawings() {
    for (let drawing of this.drawings) {
      const col = drawing.col;
      const row = drawing.row;
      drawing.x = col * (CONFIG.canvasWidth / CONFIG.gridSize) + (CONFIG.canvasWidth / CONFIG.gridSize - CONFIG.drawingSize) / 2;
      drawing.y = row * (CONFIG.canvasHeight / CONFIG.gridSize) + (CONFIG.canvasHeight / CONFIG.gridSize - CONFIG.drawingSize) / 2;
    }
  }

  /**
   * Gère les clics sur le canvas
   */
  _handleCanvasClick(e) {
    // Jouer l'audio au premier clic
    if (!this.audioPlayed) {
      this.audio.play().catch(err => console.log('Audio play failed:', err));
      this.audioPlayed = true;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Vérifie d'abord si le clic est sur la cible (priorité car elle est visuellement au-dessus)
    if (this.currentTarget && this.currentTarget.contains(x, y)) {
      this._onCorrectClick();
      return;
    }

    // Sinon, vérifie les autres dessins
    for (let drawing of this.drawings) {
      if (drawing !== this.currentTarget && drawing.contains(x, y)) {
        this._onIncorrectClick();
        return;
      }
    }
  }

  /**
   * Callback : clic sur le bon dessin
   */
  _onCorrectClick() {
    this.score++;
    const scoreElement = document.getElementById(CONFIG.scoreId);
    if (scoreElement) {
      scoreElement.textContent = this.score;
    }
    this.canvas.classList.add('correct-shadow');
    setTimeout(() => this.canvas.classList.remove('correct-shadow'), 800);
    this._selectRandomTarget();
  }

  /**
   * Callback : clic sur un mauvais dessin
   */
  _onIncorrectClick() {
    this.errors++;
    const errorsElement = document.getElementById(CONFIG.errorsId);
    if (errorsElement) {
      errorsElement.textContent = this.errors;
    }
    this.canvas.classList.add('incorrect-shadow');
    setTimeout(() => this.canvas.classList.remove('incorrect-shadow'), 600);
  }

  /**
   * Affiche un message de feedback temporaire
   */
  _showFeedback(message, duration) {
    const feedbackEl = document.getElementById(CONFIG.feedbackId);
    if (feedbackEl) {
      feedbackEl.textContent = message;
      setTimeout(() => {
        feedbackEl.textContent = '';
      }, duration);
    }
  }

  /**
   * Met à jour toutes les positions des dessins
   */
  _update() {
    for (let drawing of this.drawings) {
      drawing.update();
    }
  }

  /**
   * Redessine tous les dessins et la surbrillance de la cible
   */
  _draw() {
    this.ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Dessine tous les dessins sauf la cible
    for (let drawing of this.drawings) {
      if (drawing !== this.currentTarget) {
        drawing.draw(this.ctx);
      }
    }

    // Dessine la cible en dernier pour qu'elle soit au-dessus
    if (this.currentTarget) {
      this.currentTarget.draw(this.ctx);

      // Surbrille le dessin cible avec une bordure dorée
      this.ctx.strokeStyle = '#ffd90000';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(
        this.currentTarget.x - 2,
        this.currentTarget.y - 2,
        CONFIG.drawingSize + 4,
        CONFIG.drawingSize + 4
      );
    }
  }

  /**
   * Lance la boucle de jeu avec requestAnimationFrame
   */
  _startGameLoop() {
    const loop = () => {
      this._update();
      this._draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// ============================================================================
// INITIALISATION
// ============================================================================
/**
 * Démarre le jeu une fois le DOM chargé
 */
function initializeGame() {
  const canvas = document.getElementById(CONFIG.canvasId);
  if (!canvas) {
    console.error(`Canvas avec l'ID "${CONFIG.canvasId}" non trouvé dans le DOM`);
    return;
  }
  new GameManager(canvas);
}

// Attend le chargement du DOM avant de démarrer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}