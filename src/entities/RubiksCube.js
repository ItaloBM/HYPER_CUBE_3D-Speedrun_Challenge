import * as THREE from 'three';
import { gsap } from 'https://unpkg.com/gsap@3.9.1/index.js';

export class RubiksCube {
    constructor(scene, onMoveComplete) {
        this.scene = scene;
        this.cubes = [];
        this.isAnimating = false;
        this.moveQueue = [];
        this.pivot = new THREE.Object3D();
        this.onMoveComplete = onMoveComplete;
        
        this.scene.add(this.pivot);
        this.init();
    }

    init() {
        // Geometria Padrão (BoxGeometry)
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const colors = [0xb90000, 0xff5900, 0xffffff, 0xffff00, 0x009b48, 0x0045ad]; // R, L, U, D, F, B

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const materials = [];
                    materials.push(new THREE.MeshStandardMaterial({ color: x === 1 ? colors[0] : 0x111111, roughness: 0.4 }));
                    materials.push(new THREE.MeshStandardMaterial({ color: x === -1 ? colors[1] : 0x111111, roughness: 0.4 }));
                    materials.push(new THREE.MeshStandardMaterial({ color: y === 1 ? colors[2] : 0x111111, roughness: 0.4 }));
                    materials.push(new THREE.MeshStandardMaterial({ color: y === -1 ? colors[3] : 0x111111, roughness: 0.4 }));
                    materials.push(new THREE.MeshStandardMaterial({ color: z === 1 ? colors[4] : 0x111111, roughness: 0.4 }));
                    materials.push(new THREE.MeshStandardMaterial({ color: z === -1 ? colors[5] : 0x111111, roughness: 0.4 }));

                    const mesh = new THREE.Mesh(geometry, materials);
                    mesh.position.set(x, y, z);
                    mesh.userData = { initialPos: new THREE.Vector3(x, y, z) };
                    this.scene.add(mesh);
                    this.cubes.push(mesh);
                }
            }
        }
    }

    queueMove(axis, slice, dir, duration = 0.3) {
        this.moveQueue.push({ axis, slice, dir, duration });
        this.processQueue();
    }

    processQueue() {
        if (this.isAnimating || this.moveQueue.length === 0) return;

        const move = this.moveQueue.shift();
        this.isAnimating = true;

        if (this.onMoveStart) this.onMoveStart();

        const activeCubes = this.cubes.filter(c => Math.round(c.position[move.axis]) === move.slice);

        this.pivot.rotation.set(0, 0, 0);
        this.pivot.position.set(0, 0, 0);
        activeCubes.forEach(c => this.pivot.attach(c));

        gsap.to(this.pivot.rotation, {
            [move.axis]: (Math.PI / 2) * move.dir,
            duration: move.duration,
            onComplete: () => {
                this.pivot.updateMatrixWorld();
                activeCubes.forEach(c => {
                    this.scene.attach(c);
                    c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
                    c.rotation.set(
                        Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2),
                        Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2),
                        Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2)
                    );
                    c.updateMatrix();
                });
                this.isAnimating = false;
                this.processQueue();
                if (this.moveQueue.length === 0) this.onMoveComplete();
            }
        });
    }

    checkSolved() {
        let solved = true;
        this.cubes.forEach(c => {
            if (Math.round(c.position.x) !== c.userData.initialPos.x ||
                Math.round(c.position.y) !== c.userData.initialPos.y ||
                Math.round(c.position.z) !== c.userData.initialPos.z) solved = false;
        });
        return solved;
    }
}