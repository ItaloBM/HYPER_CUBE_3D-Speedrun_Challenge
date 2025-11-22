# 🧊 HYPER CUBE 3D - Speedrun Challenge

Um simulador de Cubo Mágico de alta performance desenvolvido com **Three.js**, focado em experiência visual (UX), arquitetura de software limpa e competição.

![Screenshot do Jogo](./image/HYPER%20CUBE%203D-Speedrun%20Challenge.png)

## 📖 Sobre o Projeto

Este projeto foi desenvolvido como parte da avaliação da disciplina de **Desenvolvimento de Jogos Digitais** do curso de **Engenharia de Software**.

**Objetivo:** O jogo desafia o usuário a resolver o cubo no menor tempo possível, aplicando conceitos avançados de computação gráfica e modularização de código.

## ✨ Destaques Técnicos & Funcionalidades

O projeto vai além do básico, implementando uma **arquitetura profissional** e recursos avançados:

- **Arquitetura Modular (ES6):** O código foi desenvolvido e separado em módulos (`Core`, `Entities`, `Utils`) para garantir escalabilidade, facilidade de manutenção e _Separation of Concerns_.
- **Renderização 3D:** Uso de **Three.js** com geometria otimizada.
- **Áudio Sintético (Web Audio API):** Os efeitos sonoros são gerados matematicamente em tempo real (osciladores), eliminando arquivos de áudio pesados.
- **Animações Fluidas:** Integração com **GSAP** para interpolação suave de movimentos.
- **Ranking Local:** Persistência de dados via `localStorage` para salvar recordes.
- **Import Maps:** Utilização de mapas de importação modernos para gerenciamento de dependências sem necessidade de Node.js/NPM.

## 🚀 Tecnologias Utilizadas

- **HTML5 / CSS3** (Design Responsivo e Clean UI)
- **JavaScript (ES6 Modules)**
- **Three.js** (R128)
- **GSAP** (GreenSock Animation Platform)

## 📂 Estrutura do Projeto

O código foi organizado seguindo padrões de engenharia de software:

```text
HYPERCUBE/
│
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

| Tecla / Ação            | Função                                      |
| ----------------------- | ------------------------------------------- |
| `Q`, `W`, `E`           | Selecionam o eixo de rotação (X, Y, Z)      |
| `A`, `S`, `D`           | Rotacionam as fatias (camadas) selecionadas |
| Mouse (arrastar)        | Rotaciona a câmera ao redor do cubo         |
| Botão UI **EMBARALHAR** | Inicia o desafio e o timer                  |

## 🛠 Instalação e Execução

⚠️ Atenção: Como este projeto utiliza Módulos ES6, ele precisa ser executado em um servidor local (devido a políticas de segurança CORS dos navegadores).
Ele não funcionará se você apenas clicar duas vezes no index.html.

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

[Nome do Colega] - [GitHub do Colega]

---

Projeto desenvolvido em Novembro de 2025.
