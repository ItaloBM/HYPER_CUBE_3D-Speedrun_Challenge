import * as THREE from 'three';
import { gsap } from 'https://unpkg.com/gsap@3.9.1/index.js';

export class RubiksCube {
    constructor(scene, onMoveComplete, size = 3) {
        this.scene = scene;
        this.size = size; 
        this.cubes = [];
        this.isAnimating = false;
        this.moveQueue = [];
        this.pivot = new THREE.Object3D();
        this.onMoveComplete = onMoveComplete;
        
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.group.add(this.pivot);
        
        this.init();
    }

    init() {
        const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
        const colors = [0xb90000, 0xff5900, 0xffffff, 0xffff00, 0x009b48, 0x0045ad];
        const offset = (this.size - 1) / 2;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const adjustedX = x - offset;
                    const adjustedY = y - offset;
                    const adjustedZ = z - offset;
                    const materials = [];
                    const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

                    materials.push(adjustedX === offset ? new THREE.MeshBasicMaterial({ color: colors[0] }) : blackMat);
                    materials.push(adjustedX === -offset ? new THREE.MeshBasicMaterial({ color: colors[1] }) : blackMat);
                    materials.push(adjustedY === offset ? new THREE.MeshBasicMaterial({ color: colors[2] }) : blackMat);
                    materials.push(adjustedY === -offset ? new THREE.MeshBasicMaterial({ color: colors[3] }) : blackMat);
                    materials.push(adjustedZ === offset ? new THREE.MeshBasicMaterial({ color: colors[4] }) : blackMat);
                    materials.push(adjustedZ === -offset ? new THREE.MeshBasicMaterial({ color: colors[5] }) : blackMat);

                    const mesh = new THREE.Mesh(geometry, materials);
                    mesh.position.set(adjustedX, adjustedY, adjustedZ);
                    mesh.userData = { 
                        initialPos: new THREE.Vector3(adjustedX, adjustedY, adjustedZ)
                    };
                    
                    this.group.add(mesh);
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

        const epsilon = 0.1;
        const activeCubes = this.cubes.filter(c => Math.abs(c.position[move.axis] - move.slice) < epsilon);

        this.pivot.rotation.set(0, 0, 0);
        this.pivot.position.set(0, 0, 0);
        activeCubes.forEach(c => this.pivot.attach(c));

        gsap.to(this.pivot.rotation, {
            [move.axis]: (Math.PI / 2) * move.dir,
            duration: move.duration,
            ease: "power2.inOut",
            onComplete: () => {
                this.pivot.updateMatrixWorld();
                activeCubes.forEach(c => {
                    this.group.attach(c);
                    c.position.set(
                        Math.round(c.position.x * 2) / 2,
                        Math.round(c.position.y * 2) / 2,
                        Math.round(c.position.z * 2) / 2
                    );
                    c.rotation.set(
                        Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2),
                        Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2),
                        Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2)
                    );
                    c.updateMatrix();
                });
                this.isAnimating = false;
                this.processQueue();
                
                if (this.moveQueue.length === 0 && this.onMoveComplete) {
                    this.onMoveComplete();
                }
            }
        });
    }

    checkSolved() {
        const epsilon = 1.5; 
        const identity = new THREE.Quaternion();

        for (let c of this.cubes) {
            if (c.position.distanceTo(c.userData.initialPos) > epsilon) {
                return false;
            }

            if (c.quaternion.angleTo(identity) > epsilon) {
                return false;
            }
        }
        return true;
    }
    
    dispose() {
        this.scene.remove(this.group);
        this.cubes.forEach(c => {
            c.geometry.dispose();
            if (Array.isArray(c.material)) {
                c.material.forEach(m => m.dispose());
            } else {
                c.material.dispose();
            }
        });
        this.cubes = [];
    }
}