import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js';

import { RubiksCube } from '../entities/RubiksCube.js';
import { AudioManager } from '../utils/Audio.js';
import { StorageManager } from '../utils/Storage.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.audio = new AudioManager();
        
        this.currentSize = 3;
        this.isGameRunning = false;
        this.startTime = 0;
        this.timerInterval = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.startMouse = { x: 0, y: 0 };
        this.intersectedBone = null;

        this.timerEl = document.getElementById('timer');
        this.winModal = document.getElementById('win-modal');
        this.btnScramble = document.getElementById('btn-scramble');
        this.btnSave = document.getElementById('btn-save');
        this.scoreList = document.getElementById('score-list');
    }

    start() {
        this.initThree();
        this.initCube(3);
        this.initEvents();
        this.initMouseEvents();
        this.createHUD();
        this.updateRankingUI();
        this.animate();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f13);
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(8, 8, 12);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: null 
        };

        this.scene.add(new THREE.AmbientLight(0xffffff, 1));
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initCube(size = 3) {
        if (this.cube) this.cube.dispose();
        
        this.currentSize = size;
        this.cube = new RubiksCube(this.scene, () => this.checkWin(), size);
        this.cube.onMoveStart = () => this.audio.playClick();
        
        this.updateHUD(size);
    }

    getDominantFace() {
        const pos = this.camera.position;
        const absX = Math.abs(pos.x);
        const absY = Math.abs(pos.y);
        const absZ = Math.abs(pos.z);

        if (absY > absX && absY > absZ) {
            return pos.y > 0 ? 'top' : 'bottom';
        } else if (absX > absY && absX > absZ) {
            return pos.x > 0 ? 'right' : 'left';
        } else {
            return pos.z > 0 ? 'front' : 'back';
        }
    }

    createHUD() {
        const style = document.createElement('style');
        style.id = 'hud-style';
        style.innerHTML = `
            .hud-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; pointer-events: none; z-index: 10; }
            .key-indicator { position: absolute; width: 35px; height: 35px; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255,255,255,0.4); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; backdrop-filter: blur(2px); transition: 0.1s; }
            .key-indicator.active { background: #00d2ff; border-color: #fff; transform: scale(1.1); box-shadow: 0 0 10px #00d2ff; color: #000; }
            .key-q { top: -40px; left: 20%; transform: translateX(-50%); }
            .key-w { top: -40px; left: 50%; transform: translateX(-50%); }
            .key-e { top: -40px; left: 80%; transform: translateX(-50%); }
            .key-a { left: -40px; top: 20%; transform: translateY(-50%); } 
            .key-s { left: -40px; top: 50%; transform: translateY(-50%); }
            .key-d { left: -40px; top: 80%; transform: translateY(-50%); }
            .hidden-key { display: none; } 
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.className = 'hud-overlay';
        const keys = ['Q','W','E','A','S','D'];
        keys.forEach(k => {
            const d = document.createElement('div');
            d.className = `key-indicator key-${k.toLowerCase()}`;
            d.id = `ind-${k}`;
            d.innerText = k;
            overlay.appendChild(d);
        });
        document.body.appendChild(overlay);
    }

    updateHUD(size) {
        const w = document.getElementById('ind-W');
        const s = document.getElementById('ind-S');
        if (w && s) {
            if (size === 2) {
                w.classList.add('hidden-key');
                s.classList.add('hidden-key');
            } else {
                w.classList.remove('hidden-key');
                s.classList.remove('hidden-key');
            }
        }
    }

    flashKey(k) {
        const el = document.getElementById(`ind-${k.toUpperCase()}`);
        if (el && !el.classList.contains('hidden-key')) {
            el.classList.add('active');
            setTimeout(() => el.classList.remove('active'), 150);
        }
    }

    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.cube.isAnimating && this.cube.moveQueue.length > 2) return;
            const k = e.key.toLowerCase();
            if(['q','w','e','a','s','d'].includes(k)) this.flashKey(k);

            const face = this.getDominantFace();
            let axis, slice, dir;
            const range = (this.currentSize - 1) / 2; 

            // 1. TECLAS VERTICAIS (Q/W/E) - COLUNAS
            if (['q', 'w', 'e'].includes(k)) {
                if (this.currentSize === 2 && k === 'w') return;
                
                let rawSlice = 0;
                if (k === 'q') rawSlice = -range; // Esquerda
                if (k === 'w') rawSlice = 0;      // Meio
                if (k === 'e') rawSlice = range;  // Direita

                if (face === 'top' || face === 'bottom') {
                    axis = 'z';
                } else if (face === 'front' || face === 'back') {
                    axis = 'x';
                } else {
                    axis = 'z'; 
                }

                let selectedSlice = rawSlice;
                if (face === 'back' || face === 'right' || face === 'bottom') selectedSlice *= -1;
                
                slice = selectedSlice;
                
                dir = 1; 
                if (face === 'back' || face === 'right') dir = -1;
                if (face === 'bottom') dir = -1;
            }

            // 2. TECLAS HORIZONTAIS (A/S/D) - LINHAS
            else if (['a', 's', 'd'].includes(k)) {
                if (this.currentSize === 2 && k === 's') return;

                let rawSlice = 0;
                if (k === 'a') rawSlice = range;  // Topo
                if (k === 's') rawSlice = 0;      // Meio
                if (k === 'd') rawSlice = -range; // Baixo

                if (face === 'top' || face === 'bottom') {
                    axis = 'x';
                    
                    slice = rawSlice;
                    if (face === 'bottom') slice *= -1; 
                    
                    dir = (face === 'top') ? 1 : -1; 
                } else {
                    axis = 'y';
                    slice = rawSlice;
                    dir = 1;
                    if (face === 'back' || face === 'left') dir = -1;
                }
            }

            if (axis) {
                this.cube.queueMove(axis, slice, dir);
            }
        });

        this.btnScramble.addEventListener('click', () => this.scramble());
        this.btnSave.addEventListener('click', () => this.saveScore());
        
        const btn2 = document.getElementById('btn-2x2');
        const btn3 = document.getElementById('btn-3x3');
        
        btn2.addEventListener('click', () => {
            this.initCube(2);
            btn2.classList.add('active');
            btn3.classList.remove('active');
        });
        
        btn3.addEventListener('click', () => {
            this.initCube(3);
            btn3.classList.add('active');
            btn2.classList.remove('active');
        });
    }

    initMouseEvents() {
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        const onDown = (e) => {
            if (e.target.closest('button') || e.target.closest('input')) return;
            
            if (e.button !== 2) return;

            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const intersects = this.raycaster.intersectObjects(this.cube.group.children, false);
            if (intersects.length > 0) {
                this.isDragging = true;
                this.intersectedBone = intersects[0].object;
                this.startMouse = { x: e.clientX, y: e.clientY };
            }
        };

        const onUp = (e) => {
            if (e.button !== 2) return; 

            if (!this.isDragging || !this.intersectedBone) {
                this.isDragging = false;
                return;
            }

            const deltaX = e.clientX - this.startMouse.x;
            const deltaY = e.clientY - this.startMouse.y;
            
            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                this.isDragging = false;
                return;
            }

            const pos = this.intersectedBone.position;
            const face = this.getDominantFace();
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // --- MOVIMENTO HORIZONTAL DO MOUSE ---
                const direction = deltaX > 0 ? -1 : 1;
                
                if (face === 'top' || face === 'bottom') {
                    this.cube.queueMove('x', Math.round(pos.x * 2)/2, direction);
                } else {
                    this.cube.queueMove('y', Math.round(pos.y * 2)/2, direction);
                }
            } else {
                const direction = deltaY > 0 ? 1 : -1;

                if (face === 'top' || face === 'bottom') {
                    // Arrastar verticalmente no topo deve girar o eixo Z (fatias laterais na tela)
                    this.cube.queueMove('z', Math.round(pos.z * 2)/2, direction);
                } else if (face === 'front' || face === 'back') {
                    this.cube.queueMove('x', Math.round(pos.x * 2)/2, direction);
                } else {
                    const zDir = (face === 'left') ? direction : -direction;
                    this.cube.queueMove('z', Math.round(pos.z * 2)/2, zDir);
                }
            }

            this.isDragging = false;
            this.intersectedBone = null;
        };

        window.addEventListener('mousedown', onDown);
        window.addEventListener('mouseup', onUp);
    }

    startTimer() {
        if (this.isGameRunning) return;
        this.startTime = Date.now();
        this.isGameRunning = true;
        this.timerInterval = setInterval(() => {
            const delta = Date.now() - this.startTime;
            const d = new Date(delta);
            this.timerEl.innerText = d.toISOString().substr(14, 8);
        }, 50);
    }

    stopTimer() {
        this.isGameRunning = false;
        clearInterval(this.timerInterval);
    }

    scramble() {
        if (this.cube.isAnimating) return;
        this.stopTimer();
        this.timerEl.innerText = "00:00:00";
        this.winModal.classList.add('hidden');

        const axes = ['x', 'y', 'z'];
        const possibleSlices = [];
        if (this.currentSize === 2) possibleSlices.push(-0.5, 0.5);
        else possibleSlices.push(-1, 0, 1);
        
        const dirs = [1, -1];

        for (let i = 0; i < 20; i++) {
            const ax = axes[Math.floor(Math.random() * axes.length)];
            const sl = possibleSlices[Math.floor(Math.random() * possibleSlices.length)];
            const di = dirs[Math.floor(Math.random() * dirs.length)];
            this.cube.queueMove(ax, sl, di, 0.05);
        }
        setTimeout(() => this.startTimer(), 1200);
    }

    checkWin() {
        if (this.isGameRunning && (Date.now() - this.startTime > 2000) && this.cube.checkSolved()) {
            this.stopTimer();
            document.getElementById('final-time').innerText = this.timerEl.innerText;
            this.winModal.classList.remove('hidden');
            if (window.confetti) window.confetti();
        }
    }

    saveScore() {
        const name = document.getElementById('player-name').value || "UNK";
        const time = document.getElementById('final-time').innerText;
        StorageManager.saveScore(name, time);
        this.updateRankingUI();
        this.winModal.classList.add('hidden');
    }

    updateRankingUI() {
        const rank = StorageManager.getRank();
        this.scoreList.innerHTML = rank.map((r, i) =>
            `<li><span>#${i + 1} ${r.name}</span><span>${r.time}</span></li>`
        ).join('');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}