import * as THREE from 'three';
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
        this.isScrambled = false; // Flag crucial para evitar vitória antes de começar
        this.startTime = 0;
        this.timerInterval = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.startMouse = { x: 0, y: 0 };
        this.intersectedBone = null;

        // UI Elements
        this.timerEl = document.getElementById('timer');
        this.winModal = document.getElementById('win-modal');
        this.scoreList = document.getElementById('score-list');
        this.keyLegendEl = document.getElementById('key-legend');

        this.keyConfigs = {
            2: { cols: ['q', 'e'], rows: ['a', 'd'] },
            3: { cols: ['q', 'w', 'e'], rows: ['a', 's', 'd'] },
            4: { cols: ['q', 'w', 'e', 'r'], rows: ['a', 's', 'd', 'f'] }
        };
    }

    start() {
        this.initThree();
        this.initCube(3); // Inicia padrão 3x3
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

        this.controls = new ArcballControls(this.camera, this.renderer.domElement, this.scene);
        this.controls.setGizmosVisible(false); 
        this.controls.cursorZoom = true;
        this.controls.enablePan = false;
        
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
        // Passamos checkWin como callback para ser chamado após cada movimento
        this.cube = new RubiksCube(this.scene, () => this.checkWin(), size);
        this.cube.onMoveStart = () => this.audio.playClick();
        
        this.createHUD(size);
        this.updateKeyLegend(size);
    }

    getVisualAlignment() {
        // Lógica de alinhamento visual para controles adaptativos
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

        const axes = [
            { name: 'x', vec: new THREE.Vector3(1, 0, 0) },
            { name: 'y', vec: new THREE.Vector3(0, 1, 0) },
            { name: 'z', vec: new THREE.Vector3(0, 0, 1) }
        ];

        let bestHorizontalAxis = 'y', maxDotUp = -1, hSign = 1;
        let bestVerticalAxis = 'y', maxDotRight = -1, vSign = 1;

        axes.forEach(axis => {
            const dotUp = axis.vec.dot(camUp);
            if (Math.abs(dotUp) > maxDotUp) {
                maxDotUp = Math.abs(dotUp);
                bestHorizontalAxis = axis.name;
                hSign = Math.sign(dotUp) || 1;
            }

            const dotRight = axis.vec.dot(camRight);
            if (Math.abs(dotRight) > maxDotRight) {
                maxDotRight = Math.abs(dotRight);
                bestVerticalAxis = axis.name;
                vSign = Math.sign(dotRight) || 1;
            }
        });

        return { hAxis: bestHorizontalAxis, hSign, vAxis: bestVerticalAxis, vSign, camRight, camUp };
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
            <div>${config.cols.map(k=>`<span>${k.toUpperCase()}</span>`).join('')} Colunas</div>
            <div>${config.rows.map(k=>`<span>${k.toUpperCase()}</span>`).join('')} Linhas</div>
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
            if (e.key === 'Escape' && !this.winModal.classList.contains('hidden')) {
                this.closeModal();
                return;
            }

            if (this.cube.isAnimating && this.cube.moveQueue.length > 2) return;
            const k = e.key.toLowerCase();
            const config = this.keyConfigs[this.currentSize];

            if ([...config.cols, ...config.rows].includes(k)) {
                this.flashKey(k);
                this.handleKeyMove(k, config);
            }
        });

        this.winModal.addEventListener('click', (e) => {
            if (e.target === this.winModal) {
                this.closeModal();
            }
        });

        // --- CORREÇÃO AQUI: Verificamos se o botão existe antes de adicionar o evento ---

        // Botão Embaralhar
        const btnScramble = document.getElementById('btn-scramble');
        if (btnScramble) {
            btnScramble.addEventListener('click', () => this.scramble());
        }

        // Botão Reset
        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => this.resetGame());
        }

        // Botão Simular Vitória (Debug) - Este era o provável causador do erro
        const btnSimulate = document.getElementById('btn-simulate-win');
        if (btnSimulate) {
            btnSimulate.addEventListener('click', () => this.debugWin());
        }

        // Botão Salvar Rank
        const btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', () => this.saveScore());
        }

        // Botão Abrir Rank (se existir)
        const btnOpenRank = document.getElementById('btn-open-rank');
        if (btnOpenRank) {
            btnOpenRank.addEventListener('click', () => this.openModal());
        }

        // Seletores de Modo (2x2, 3x3, 4x4)
        const modes = [2, 3, 4];
        modes.forEach(size => {
            const btn = document.getElementById(`btn-${size}x${size}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    modes.forEach(s => document.getElementById(`btn-${s}x${s}`).classList.remove('active'));
                    btn.classList.add('active');
                    this.initCube(size);
                    this.resetGame();
                });
            }
        });
    }

    resetGame() {
        this.stopTimer();
        this.isGameRunning = false;
        this.isScrambled = false;
        this.timerEl.innerText = "00:00:00";
        this.winModal.classList.add('hidden');
        this.initCube(this.currentSize);
    }

    // Função de Debug para testar a vitória
    debugWin() {
        this.stopTimer();
        this.timerEl.innerText = "00:59:99"; // Tempo falso
        document.getElementById('final-time').innerText = this.timerEl.innerText;
        this.winModal.classList.remove('hidden');
        if (window.confetti) window.confetti();
    }

    handleKeyMove(key, config) {
        const align = this.getVisualAlignment();
        let axis, slice, dir;
        const total = this.currentSize;
        const getSliceIndex = (idx, t) => idx - (t - 1) / 2;

        if (config.cols.includes(key)) {
            const idx = config.cols.indexOf(key);
            let rawSlice = getSliceIndex(idx, total);
            axis = align.vAxis;
            dir = align.vSign; 
            const axisVec = new THREE.Vector3();
            axisVec[axis] = 1;
            if (axisVec.dot(align.camRight) < 0) rawSlice *= -1;
            slice = rawSlice;
        } 
        else if (config.rows.includes(key)) {
            const idx = config.rows.indexOf(key);
            let rawSlice = getSliceIndex(idx, total);
            rawSlice *= -1; 
            axis = align.hAxis;
            dir = align.hSign;
            const axisVec = new THREE.Vector3();
            axisVec[axis] = 1;
            if (axisVec.dot(align.camUp) < 0) rawSlice *= -1;
            slice = rawSlice;
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
                this.controls.enabled = false;
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
                this.isDragging = false; return;
            }
            const pos = this.intersectedBone.position;
            const align = this.getVisualAlignment();
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                const visualDir = deltaX > 0 ? 1 : -1;
                const finalDir = visualDir * align.hSign;
                this.cube.queueMove(align.hAxis, Math.round(pos[align.hAxis]), finalDir);
            } else {
                const visualDir = deltaY > 0 ? 1 : -1;
                const finalDir = visualDir * align.vSign;
                this.cube.queueMove(align.vAxis, Math.round(pos[align.vAxis]), finalDir);
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
        // Reseta qualquer estado anterior
        this.resetGame();
        
        const axes = ['x', 'y', 'z'];
        const range = (this.currentSize - 1) / 2;
        const possibleSlices = [];
        
        // Corrige bug de fatias para cubos pares/ímpares
        if (this.currentSize % 2 === 0) {
            for(let i = -range; i <= range; i+=1) possibleSlices.push(i);
        } else {
            for(let i = -range; i <= range; i++) possibleSlices.push(i);
        }
        
        const dirs = [1, -1];
        // Quantidade de movimentos de embaralhamento
        const moves = 20 + (this.currentSize * 5); 

        for (let i = 0; i < moves; i++) {
            const ax = axes[Math.floor(Math.random() * axes.length)];
            const sl = possibleSlices[Math.floor(Math.random() * possibleSlices.length)];
            const di = dirs[Math.floor(Math.random() * dirs.length)];
            // Movimento super rápido (0.05s)
            this.cube.queueMove(ax, sl, di, 0.05); 
        }

        // Só inicia o timer e marca como "Embaralhado" APÓS a animação terminar
        setTimeout(() => {
            this.isScrambled = true; // Agora o checkWin vai começar a funcionar
            this.startTimer();
        }, moves * 60); // 60ms é um pouco maior que 50ms (duration) para dar folga
    }

    // Verifica vitória automaticamente
    checkWin() {
        // Só checa se o jogo estiver rodando E o cubo tiver sido embaralhado
        // Adicionamos um delay mínimo de 1000ms para evitar win instantâneo no start
        if (this.isGameRunning && this.isScrambled && (Date.now() - this.startTime > 1000)) {
            if (this.cube.checkSolved()) {
                this.stopTimer();
                this.isScrambled = false; // Impede múltiplos disparos
                
                // Atualiza UI
                document.getElementById('final-time').innerText = this.timerEl.innerText;
                
                // Mostra Modal e Confetes
                this.winModal.classList.remove('hidden');
                if (window.confetti) window.confetti();
            }
        }
    }

    saveScore() {
        let name = document.getElementById('player-name').value || "UNK";
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