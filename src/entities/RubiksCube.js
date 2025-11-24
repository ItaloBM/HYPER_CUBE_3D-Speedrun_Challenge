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
        // Cores: Direita, Esquerda, Cima, Baixo, Frente, Trás
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

                    // A ordem dos materiais no Three.js BoxGeometry é: 
                    // 0:Right(+x), 1:Left(-x), 2:Top(+y), 3:Bottom(-y), 4:Front(+z), 5:Back(-z)
                    materials.push(adjustedX === offset ? new THREE.MeshBasicMaterial({ color: colors[0] }) : blackMat);
                    materials.push(adjustedX === -offset ? new THREE.MeshBasicMaterial({ color: colors[1] }) : blackMat);
                    materials.push(adjustedY === offset ? new THREE.MeshBasicMaterial({ color: colors[2] }) : blackMat);
                    materials.push(adjustedY === -offset ? new THREE.MeshBasicMaterial({ color: colors[3] }) : blackMat);
                    materials.push(adjustedZ === offset ? new THREE.MeshBasicMaterial({ color: colors[4] }) : blackMat);
                    materials.push(adjustedZ === -offset ? new THREE.MeshBasicMaterial({ color: colors[5] }) : blackMat);

                    const mesh = new THREE.Mesh(geometry, materials);
                    mesh.position.set(adjustedX, adjustedY, adjustedZ);
                    
                    // Salvamos quais índices de material são coloridos para conferência posterior
                    mesh.userData = { 
                        initialPos: new THREE.Vector3(adjustedX, adjustedY, adjustedZ),
                        isCore: (Math.abs(adjustedX) < offset && Math.abs(adjustedY) < offset && Math.abs(adjustedZ) < offset)
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
                
                // Dispara o evento de movimento completo para o Game.js verificar a vitória
                if (this.moveQueue.length === 0 && this.onMoveComplete) {
                    this.onMoveComplete();
                }
                
                this.processQueue();
            }
        });
    }

    // Verifica se está resolvido baseado na uniformidade das cores das faces
    // Isso permite que o cubo esteja resolvido em qualquer orientação (ex: Branco na frente)
    checkSolved() {
        const offset = (this.size - 1) / 2;
        const epsilon = 0.1;

        // Definição das 6 faces do mundo: Eixo, Valor (+/- offset), e índice do material local esperado
        // 0:Right, 1:Left, 2:Top, 3:Bottom, 4:Front, 5:Back
        const faces = [
            { axis: 'x', val: offset, name: 'Right' },
            { axis: 'x', val: -offset, name: 'Left' },
            { axis: 'y', val: offset, name: 'Top' },
            { axis: 'y', val: -offset, name: 'Bottom' },
            { axis: 'z', val: offset, name: 'Front' },
            { axis: 'z', val: -offset, name: 'Back' }
        ];

        // Vetores locais correspondentes aos índices de materiais do BoxGeometry
        const localNormals = [
            { vec: new THREE.Vector3(1, 0, 0), matIdx: 0 },  // Right
            { vec: new THREE.Vector3(-1, 0, 0), matIdx: 1 }, // Left
            { vec: new THREE.Vector3(0, 1, 0), matIdx: 2 },  // Top
            { vec: new THREE.Vector3(0, -1, 0), matIdx: 3 }, // Bottom
            { vec: new THREE.Vector3(0, 0, 1), matIdx: 4 },  // Front
            { vec: new THREE.Vector3(0, 0, -1), matIdx: 5 }  // Back
        ];

        for (let face of faces) {
            // 1. Pega todos os cubos que estão fisicamente nesta face do mundo
            const faceCubies = this.cubes.filter(c => 
                Math.abs(c.position[face.axis] - face.val) < epsilon
            );

            // Se não houver cubos (bug), retorna false
            if (faceCubies.length === 0) return false;

            // 2. Cria o vetor de direção do mundo para esta face (ex: 1,0,0)
            const worldDir = new THREE.Vector3();
            worldDir[face.axis] = Math.sign(face.val);

            // Função auxiliar para descobrir a cor que este cubo está mostrando para worldDir
            const getFaceColorHex = (cubie) => {
                for (let ln of localNormals) {
                    // Transforma a normal local do cubo para o espaço do mundo
                    const worldNormal = ln.vec.clone().applyQuaternion(cubie.quaternion);
                    // Se a normal aponta na mesma direção da face do mundo
                    if (worldNormal.dot(worldDir) > 0.9) {
                        return cubie.material[ln.matIdx].color.getHex();
                    }
                }
                return null;
            };

            // 3. Pega a cor do primeiro cubo como referência
            const referenceColor = getFaceColorHex(faceCubies[0]);
            if (referenceColor === null) return false; // Algo errado com rotação

            // 4. Verifica se TODOS os outros cubos nesta face têm a mesma cor
            for (let i = 1; i < faceCubies.length; i++) {
                const color = getFaceColorHex(faceCubies[i]);
                if (color !== referenceColor) {
                    return false; // Cores misturadas nesta face
                }
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