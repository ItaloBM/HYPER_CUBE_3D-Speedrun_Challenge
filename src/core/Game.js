import * as THREE from 'three';
// Importação correta para o ArcballControls na versão 0.160.0
import { ArcballControls } from 'three/addons/controls/ArcballControls.js'; 
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
        this.isSimulation = false; // Flag para diferenciar jogo real de teste
        this.startTime = 0;
        this.timerInterval = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.startMouse = { x: 0, y: 0 };
        this.intersectedBone = null;

        // Elementos da UI
        this.timerEl = document.getElementById('timer');
        this.winModal = document.getElementById('win-modal');
        this.scoreList = document.getElementById('score-list');
        this.keyLegendEl = document.getElementById('key-legend');

        // Configuração de Teclas por Tamanho do Cubo
        this.keyConfigs = {
            2: { 
                cols: ['q', 'e'], 
                rows: ['a', 'd'],
                labels: { cols: "Q E", rows: "A D" }
            },
            3: { 
                cols: ['q', 'w', 'e'], 
                rows: ['a', 's', 'd'],
                labels: { cols: "Q W E", rows: "A S D" }
            },
            4: { 
                cols: ['q', 'w', 'e', 'r'], 
                rows: ['a', 's', 'd', 'f'],
                labels: { cols: "Q W E R", rows: "A S D F" }
            }
        };
    }

    start() {
        this.initThree();
        this.initCube(3); // Inicia com 3x3 por padrão
        this.initEvents();
        this.initMouseEvents();
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

        // ArcballControls permite girar a câmera em todos os eixos livremente
        this.controls = new ArcballControls(this.camera, this.renderer.domElement, this.scene);
        this.controls.setGizmosVisible(false); 
        this.controls.cursorZoom = true;
        this.controls.enablePan = false; // Desabilita pan para evitar conflito com clique direito
        
        this.scene.add(new THREE.AmbientLight(0xffffff, 1));
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initCube(size) {
        if (this.cube) this.cube.dispose();
        
        this.currentSize = size;
        this.cube = new RubiksCube(this.scene, () => this.checkWin(), size);
        this.cube.onMoveStart = () => this.audio.playClick();
        
        this.createHUD(size);
        this.updateKeyLegend(size);
    }

    getDominantFace() {
        const pos = this.camera.position;
        const absX = Math.abs(pos.x);
        const absY = Math.abs(pos.y);
        const absZ = Math.abs(pos.z);

        if (absY > absX && absY > absZ) return pos.y > 0 ? 'top' : 'bottom';
        if (absX > absY && absX > absZ) return pos.x > 0 ? 'right' : 'left';
        return pos.z > 0 ? 'front' : 'back';
    }

    createHUD(size) {
        const oldOverlay = document.querySelector('.hud-overlay');
        if (oldOverlay) oldOverlay.remove();

        const config = this.keyConfigs[size];
        const allKeys = [...config.cols, ...config.rows];

        const overlay = document.createElement('div');
        overlay.className = 'hud-overlay';
        overlay.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; pointer-events: none; z-index: 10;`;

        allKeys.forEach((k) => {
            const d = document.createElement('div');
            d.className = `key-indicator`;
            d.id = `ind-${k.toUpperCase()}`;
            d.innerText = k.toUpperCase();
            d.style.cssText = `
                position: absolute; width: 30px; height: 30px; 
                background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255,255,255,0.4); 
                color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; 
                font-weight: bold; font-size: 14px; backdrop-filter: blur(2px); transition: 0.1s;
            `;
            
            const isCol = config.cols.includes(k);
            const array = isCol ? config.cols : config.rows;
            const posIndex = array.indexOf(k);
            const total = array.length;
            const percent = 20 + (posIndex * (60 / (total - 1 || 1))); 
            
            if (isCol) {
                d.style.top = '-40px';
                d.style.left = `${percent}%`;
            } else {
                d.style.left = '-40px';
                d.style.top = `${percent}%`;
            }
            
            overlay.appendChild(d);
        });
        document.body.appendChild(overlay);
    }

    updateKeyLegend(size) {
        const config = this.keyConfigs[size];
        this.keyLegendEl.innerHTML = `
            <div>
                ${config.cols.map(k=>`<span>${k.toUpperCase()}</span>`).join('')} Colunas
            </div>
            <div>
                ${config.rows.map(k=>`<span>${k.toUpperCase()}</span>`).join('')} Linhas
            </div>
        `;
    }

    flashKey(k) {
        const el = document.getElementById(`ind-${k.toUpperCase()}`);
        if (el) {
            el.style.background = '#00d2ff';
            el.style.color = '#000';
            el.style.transform = 'scale(1.2)';
            setTimeout(() => {
                el.style.background = 'rgba(255, 255, 255, 0.15)';
                el.style.color = 'white';
                el.style.transform = 'scale(1)';
            }, 150);
        }
    }

    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.cube.isAnimating && this.cube.moveQueue.length > 2) return;
            const k = e.key.toLowerCase();
            const config = this.keyConfigs[this.currentSize];

            if ([...config.cols, ...config.rows].includes(k)) {
                this.flashKey(k);
                this.handleKeyMove(k, config);
            }
        });

        // Botões da Interface
        document.getElementById('btn-scramble').addEventListener('click', () => this.scramble());
        document.getElementById('btn-save').addEventListener('click', () => this.saveScore());
        
        // Novo: Botão Resetar
        const btnReset = document.getElementById('btn-reset');
        if(btnReset) btnReset.addEventListener('click', () => this.resetGame());

        // Novo: Botão Simular
        const btnSimulate = document.getElementById('btn-simulate-win');
        if(btnSimulate) btnSimulate.addEventListener('click', () => this.simulateWin());
        
        // Seletores de Modo
        const modes = [2, 3, 4];
        modes.forEach(size => {
            const btn = document.getElementById(`btn-${size}x${size}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    modes.forEach(s => document.getElementById(`btn-${s}x${s}`).classList.remove('active'));
                    btn.classList.add('active');
                    this.initCube(size);
                    this.resetGame(); // Reseta timer ao trocar de modo
                });
            }
        });
    }

    // Função de RESET (Novo Botão Vermelho)
    resetGame() {
        this.stopTimer();
        this.isGameRunning = false;
        this.isSimulation = false;
        this.timerEl.innerText = "00:00:00";
        this.winModal.classList.add('hidden');
        // Apenas recria o cubo montado (sem lógica de vitória)
        this.initCube(this.currentSize);
    }

    handleKeyMove(key, config) {
        const face = this.getDominantFace();
        let axis, slice, dir;
        
        const getSliceFromIndex = (idx, total) => {
            const offset = (total - 1) / 2;
            return idx - offset;
        };

        if (config.cols.includes(key)) {
            const idx = config.cols.indexOf(key);
            let rawSlice = getSliceFromIndex(idx, this.currentSize);

            if (face === 'top' || face === 'bottom') axis = 'z';
            else if (face === 'front' || face === 'back') axis = 'x';
            else axis = 'z'; 

            let selectedSlice = rawSlice;
            if (face === 'back' || face === 'right' || face === 'bottom') selectedSlice *= -1;
            
            slice = selectedSlice;
            dir = 1; 
            if (face === 'back' || face === 'right' || face === 'bottom') dir = -1;
            
        } else if (config.rows.includes(key)) {
            const idx = config.rows.indexOf(key);
            let rawSlice = getSliceFromIndex(idx, this.currentSize);
             rawSlice *= -1; 

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
                this.controls.enabled = false; // Trava câmera ao interagir com cubo
            }
        };

        const onUp = (e) => {
            this.controls.enabled = true; 
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
                const direction = deltaX > 0 ? -1 : 1;
                if (face === 'top' || face === 'bottom') {
                    this.cube.queueMove('x', Math.round(pos.x * 2)/2, direction);
                } else {
                    this.cube.queueMove('y', Math.round(pos.y * 2)/2, direction);
                }
            } else {
                const direction = deltaY > 0 ? 1 : -1;
                if (face === 'front' || face === 'back') {
                    this.cube.queueMove('x', Math.round(pos.x * 2)/2, direction);
                } else if (face === 'left' || face === 'right') {
                    const zDir = (face === 'left') ? direction : -direction;
                    this.cube.queueMove('z', Math.round(pos.z * 2)/2, zDir);
                } else {
                    this.cube.queueMove('z', Math.round(pos.z * 2)/2, direction);
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
        
        // Garante estado limpo antes de embaralhar
        this.resetGame();

        const axes = ['x', 'y', 'z'];
        const range = (this.currentSize - 1) / 2;
        const possibleSlices = [];
        for(let i = -range; i <= range; i++) possibleSlices.push(i);
        
        const dirs = [1, -1];
        const moves = 20 + (this.currentSize * 5); 

        for (let i = 0; i < moves; i++) {
            const ax = axes[Math.floor(Math.random() * axes.length)];
            const sl = possibleSlices[Math.floor(Math.random() * possibleSlices.length)];
            const di = dirs[Math.floor(Math.random() * dirs.length)];
            this.cube.queueMove(ax, sl, di, 0.05); 
        }
        setTimeout(() => this.startTimer(), moves * 60);
    }

    // Função para Simular Vitória (Botão Debug)
    simulateWin() {
        this.isSimulation = true;
        this.initCube(this.currentSize); // Reseta visual
        
        // Se não tiver tempo corrido, inventa um
        if (this.timerEl.innerText === "00:00:00") {
            this.timerEl.innerText = "00:12:34"; 
        }
        
        this.stopTimer();
        document.getElementById('final-time').innerText = this.timerEl.innerText;
        this.winModal.classList.remove('hidden');
        if (window.confetti) window.confetti();
    }

    checkWin() {
        if (this.isGameRunning && (Date.now() - this.startTime > 2000) && this.cube.checkSolved()) {
            this.stopTimer();
            this.isSimulation = false; // Confirma que é vitória real
            document.getElementById('final-time').innerText = this.timerEl.innerText;
            this.winModal.classList.remove('hidden');
            if (window.confetti) window.confetti();
        }
    }

    saveScore() {
        let name = document.getElementById('player-name').value || "UNK";
        const time = document.getElementById('final-time').innerText;
        
        // Adiciona tag se for simulação
        if (this.isSimulation) {
            name += " (SIMULAÇÃO)";
        }

        StorageManager.saveScore(name, time);
        this.updateRankingUI();
        this.winModal.classList.add('hidden');
        this.isSimulation = false;
    }

    updateRankingUI() {
        const rank = StorageManager.getRank();
        this.scoreList.innerHTML = rank.map((r, i) =>
            `<li><span>#${i + 1} ${r.name}</span><span>${r.time}</span></li>`
        ).join('');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update(); // Atualiza ArcballControls
        this.renderer.render(this.scene, this.camera);
    }
}