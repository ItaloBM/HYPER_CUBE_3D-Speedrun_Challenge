// Importações limpas via Import Map
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
        
        this.isGameRunning = false;
        this.startTime = 0;
        this.timerInterval = null;

        // UI Elements
        this.timerEl = document.getElementById('timer');
        this.winModal = document.getElementById('win-modal');
        this.btnScramble = document.getElementById('btn-scramble');
        this.btnSave = document.getElementById('btn-save');
        this.scoreList = document.getElementById('score-list');
    }

    start() {
        this.initThree();
        this.initCube();
        this.initEvents();
        this.updateRankingUI();
        this.animate();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f13);
        this.scene.fog = new THREE.FogExp2(0x0f0f13, 0.035);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(8, 8, 12);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;

        // Luzes
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        
        const spotLight = new THREE.SpotLight(0xffffff, 1.5);
        spotLight.position.set(10, 20, 10);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
        
        const backLight = new THREE.PointLight(0x00d2ff, 1);
        backLight.position.set(-10, -5, -10);
        this.scene.add(backLight);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initCube() {
        this.cube = new RubiksCube(this.scene, () => this.checkWin());
        this.cube.onMoveStart = () => this.audio.playClick();
    }

    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.cube.isAnimating && this.cube.moveQueue.length > 2) return;
            const k = e.key.toLowerCase();
            if (k === 'q') this.cube.queueMove('x', -1, 1);
            if (k === 'w') this.cube.queueMove('y', 1, -1);
            if (k === 'e') this.cube.queueMove('x', 1, -1);
            if (k === 'a') this.cube.queueMove('z', 1, -1);
            if (k === 's') this.cube.queueMove('y', -1, -1);
            if (k === 'd') this.cube.queueMove('z', -1, 1);
        });

        this.btnScramble.addEventListener('click', () => this.scramble());
        this.btnSave.addEventListener('click', () => this.saveScore());
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
        const slices = [-1, 0, 1];
        const dirs = [1, -1];

        for (let i = 0; i < 20; i++) {
            const ax = axes[Math.floor(Math.random() * axes.length)];
            const sl = slices[Math.floor(Math.random() * slices.length)];
            const di = dirs[Math.floor(Math.random() * dirs.length)];
            this.cube.queueMove(ax, sl, di, 0.05);
        }

        setTimeout(() => this.startTimer(), 20 * 60);
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