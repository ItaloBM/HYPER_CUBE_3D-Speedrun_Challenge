# 🧊 HYPER CUBE 3D - Speedrun Challenge

Um simulador de Cubo Mágico de alta performance desenvolvido com Three.js, focado em experiência visual (UX/UI Cyberpunk), arquitetura de software limpa e competição (Speedrun).

![Screenshot do Jogo](./image/HYPER_CUBE_3D-Speedrun_Challenge.png)

## 🎮 Demo em: https://hypercube3d.netlify.app/

## 📖 Sobre o Projeto

Este projeto foi desenvolvido como parte da avaliação da disciplina de **Desenvolvimento de Jogos Digitais** do curso de **Engenharia de Software**.

**Objetivo:** O jogo desafia o usuário a resolver puzzles de diferentes dificuldades (2x2, 3x3 e 4x4) no menor tempo possível, aplicando conceitos avançados de computação gráfica, álgebra linear (quaternions/matrizes) e modularização de código.

## ✨ Destaques Técnicos & Funcionalidades

O projeto vai além do básico, implementando uma **arquitetura profissional** e recursos avançados:

- **Múltiplos Puzzles:** Suporte completo para cubos 2x2, 3x3 e 4x4 com lógica de embaralhamento proporcional.
- **Câmera Livre (Arcball):** Sistema de câmera 360° sem "Gimbal Lock", permitindo visualização de qualquer ângulo.
- **Controles Inteligentes:** O sistema detecta a face dominante da câmera para adaptar os comandos do teclado (Cima/Baixo/Esquerda/Direita) intuitivamente.
- **Modo Simulação (Debug):** Ferramenta para desenvolvedores testarem o sistema de Ranking sem precisar resolver o cubo manualmente.
- **Arquitetura Modular (ES6):** Código separado em módulos (Core, Entities, Utils) garantindo Separation of Concerns.
- **Áudio Sintético (Web Audio API):** Efeitos sonoros gerados matematicamente em tempo real (osciladores), sem arquivos de áudio pesados.
- **Ranking Local:** Persistência de recordes via localStorage.

## 🚀 Tecnologias Utilizadas

- **HTML5 / CSS3** - (Design Responsivo, Animações CSS e Estilo Neon)
- **JavaScript (ES6 Modules)**
- **Three.js (r160)** - Versão atualizada para suporte a ArcballControls
- **GSAP (GreenSock Animation Platform)** - Para animações fluidas de rotação
- **Canvas Confetti** - Efeitos de partículas na vitória

## 📂 Estrutura do Projeto

O código foi organizado seguindo padrões de engenharia de software:

```text
HYPERCUBE/
│── image/
│   └── favicon.svg          
│   └── HYPER CUBE 3D-Speedrun Challenge.png
├── src/                     # Código Fonte Modularizado
│   ├── core/                # Núcleo do Jogo
│   │   └── Game.js          # Gerenciador de Cena, Loop e Renderização
│   │
│   ├── entities/            # Objetos do Jogo
│   │   └── RubiksCube.js    # Lógica Matemática e Geométrica do Cubo
│   │
│   ├── utils/               # Utilitários
│   │   ├── Audio.js         # Gerador de Sons (Web Audio API)
│   │   └── Storage.js       # Gerenciamento de Ranking (LocalStorage)
│   │
│   └── main.js              # Ponto de Entrada (Entry Point)
│
├── css/
│   └── style.css            # Estilos Visuais
│
├── index.html               # Estrutura Base e Import Maps
└── README.md                # Documentação
```

## 🎮 Comandos e Controles
O jogo suporta interação híbrida (Mouse e Teclado).

## 🖱️ Mouse

|       Ação     |                      Função                                                      |
|----------------|----------------------------------------------------------------------------------|
| Botão Esquerdo | Rotaciona a Câmera livremente ao redor do cubo (360°).                           |
| Botão Direito  | Interage com o Cubo. Clique e arraste uma peça para girar a face correspondente. |
| Scroll         | Zoom In / Zoom Out.                                                              |

## ⌨️ Teclado (Atalhos de Rotação)
As teclas mudam dinamicamente dependendo do tamanho do cubo escolhido. O HUD na tela mostra as teclas ativas.

|       Tamanho  |       Colunas (Verticais)    |           Linhas (Horizontais)
|----------------|----------------------------------------------------------------------------------|
|       2x2      |              Q, E            |               A, D                                |
|       3x3      |             Q, W, E          |              A, S, D                              |
|       4x4      |           Q, W, E, R         |             A, S, D, F                            |

Nota: As rotações do teclado são relativas ao ângulo da câmera. O "Topo" do cubo é sempre a face voltada para cima na sua visão atual.

## 🖥️ Interface e Ferramentas
Na barra inferior de controles, você encontrará três funções principais:

1. 🟦 EMBARALHAR (🔀): Inicia o jogo. Aplica algoritmos de embaralhamento aleatório e inicia o cronômetro.

2. 🟥 RESETAR (↩️): Para o cronômetro imediatamente e restaura o cubo ao estado resolvido. Útil para desistir de uma tentativa ou reiniciar.


## 🛠 Instalação e Execução

⚠️ Atenção: Como este projeto utiliza Módulos ES6 e Import Maps, ele precisa ser executado em um servidor local (devido a políticas de segurança CORS dos navegadores). Ele não funcionará se você apenas clicar duas vezes no index.html.

### Opção 1: VS Code (Recomendado)

1. Instale a extensão "Live Server" no VS Code.
2. Abra a pasta do projeto (File → Open Folder).
3. Abra o arquivo `index.html` no editor.
4. Clique com o botão direito dentro do arquivo e selecione **Open with Live Server** — ou clique em **Go Live** na barra de status.
5. Se preferir, abra o Command Palette (Ctrl/Cmd+Shift+P) e execute **Live Server: Open with Live Server**.
6. O projeto será servido em http://127.0.0.1:5500 (ou em outra porta indicada). Atualizações salvas no editor recarregam automaticamente.

Dicas rápidas:

- Se usar WSL/Remote, ative a opção "Use Local IP" nas configurações do Live Server.
- Verifique o console do navegador se algum recurso não carregar.

### Opção 2: Python (Terminal)

Caso não use VS Code, você pode abrir um servidor via terminal na pasta do projeto:

```bash
# Python 3
python -m http.server
# Acesse no navegador: http://localhost:8000
```

Ou com Python 2 (se aplicável):

```bash
python -m SimpleHTTPServer 8000
```

Depois, navegue até `http://localhost:8000` no seu navegador.

### 👥 Autores

Italo Butinholi Mendes - https://github.com/ItaloBM

João Vitor Amorim Lopes - https://github.com/jvvlopes

---

Projeto desenvolvido em Novembro de 2025.
