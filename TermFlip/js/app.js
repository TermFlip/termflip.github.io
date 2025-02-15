/*
 * TermFlip - A memory match game for learning
 * © 2024 Tarushv Kosgi. All rights reserved.
 */
class TermFlipGame {
    constructor() {
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;

        // DOM elements
        this.inputScreen = document.getElementById('input-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.textArea = document.getElementById('term-input');
        this.startButton = document.getElementById('start-game');
        this.tryExampleButton = document.getElementById('try-example');
        this.restartButton = document.getElementById('restart-game');
        this.gameBoard = document.getElementById('game-board');
        this.moveCount = document.getElementById('move-count');
        this.timeElapsed = document.getElementById('time-elapsed');
        this.completionModal = document.getElementById('completion-modal');
        this.feedbackDiv = document.querySelector('.input-feedback');

        // Theme related elements
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = this.themeToggle.querySelector('.icon');
        
        // Load saved theme
        this.currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.dataset.theme = this.currentTheme;
        this.updateThemeIcon();

        this.bindEvents();
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.parseAndStartGame());
        this.tryExampleButton.addEventListener('click', () => this.loadExample());
        this.restartButton.addEventListener('click', () => this.restartGame());
        this.textArea.addEventListener('input', () => this.validateInput());
        document.getElementById('play-again').addEventListener('click', () => this.restartGame());
        document.getElementById('new-terms').addEventListener('click', () => this.showInputScreen());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        document.getElementById('title').addEventListener('click', () => location.reload()); // Add this line
    }

    validateInput() {
        const input = this.textArea.value.trim();
        if (!input) {
            this.updateFeedback('');
            return false;
        }

        try {
            if (input.startsWith('[')) {
                JSON.parse(input);
                this.updateFeedback('Valid JSON format', true);
                return true;
            } else {
                const lines = input.split('\n').filter(line => line.trim());
                if (lines.length >= 2 && lines.length % 2 === 0) {
                    this.updateFeedback('Valid plain text format', true);
                    return true;
                } else {
                    this.updateFeedback('Plain text must have pairs of lines');
                    return false;
                }
            }
        } catch (e) {
            this.updateFeedback('Invalid format');
            return false;
        }
    }

    updateFeedback(message, isValid = false) {
        this.feedbackDiv.textContent = message;
        this.feedbackDiv.style.color = isValid ? '#2ecc71' : '#e74c3c';
        this.startButton.disabled = !isValid;
    }

    parseInput() {
        const input = this.textArea.value.trim();
        let pairs = [];

        if (input.startsWith('[')) {
            pairs = JSON.parse(input);
        } else {
            const lines = input.split('\n').filter(line => line.trim());
            for (let i = 0; i < lines.length; i += 2) {
                pairs.push({
                    term: lines[i].trim(),
                    definition: lines[i + 1].trim()
                });
            }
        }

        return pairs;
    }

    createCard(content, type, pairId) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.pairId = pairId;
        card.dataset.type = type;
        
        card.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front">${content}</div>
        `;

        card.addEventListener('click', () => this.handleCardClick(card));
        return card;
    }

    handleCardClick(card) {
        if (
            this.flippedCards.length >= 2 ||
            card.classList.contains('flipped') ||
            card.classList.contains('matched')
        ) {
            return;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.moveCount.textContent = this.moves;
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const match = card1.dataset.pairId === card2.dataset.pairId &&
                     card1.dataset.type !== card2.dataset.type;

        if (match) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.flippedCards = [];
            
            if (this.matchedPairs === this.cards.length / 2) {
                this.endGame();
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
            }, 1000);
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            this.timeElapsed.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    parseAndStartGame() {
        if (!this.validateInput()) return;

        const pairs = this.parseInput();
        this.cards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.moveCount.textContent = '0';

        pairs.forEach((pair, index) => {
            this.cards.push(this.createCard(pair.term, 'term', index));
            this.cards.push(this.createCard(pair.definition, 'definition', index));
        });

        this.shuffleArray(this.cards);
        this.startGame();
    }

    startGame() {
        this.inputScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.gameBoard.innerHTML = '';
        this.cards.forEach(card => this.gameBoard.appendChild(card));
        this.startTimer();
    }

    endGame() {
        this.stopTimer();
        const stats = document.querySelector('.modal .stats');
        stats.innerHTML = `
            <p>Moves: ${this.moves}</p>
            <p>Time: ${this.timeElapsed.textContent}</p>
        `;
        this.completionModal.classList.add('visible');
    }

    restartGame() {
        this.completionModal.classList.remove('visible');
        this.shuffleArray(this.cards);
        this.matchedPairs = 0;
        this.moves = 0;
        this.moveCount.textContent = '0';
        this.flippedCards = [];
        this.startGame();
    }

    showInputScreen() {
        this.completionModal.classList.remove('visible');
        this.gameScreen.classList.remove('active');
        this.inputScreen.classList.add('active');
        this.stopTimer();
    }

    loadExample() {
        const example = [
            {
                term: "Photosynthesis",
                definition: "Process by which plants convert light energy into chemical energy"
            },
            {
                term: "Mitosis",
                definition: "Cell division resulting in two identical daughter cells"
            },
            {
                term: "Osmosis",
                definition: "Movement of water molecules across a semi-permeable membrane"
            }
        ];
        this.textArea.value = JSON.stringify(example, null, 2);
        this.validateInput();
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = this.currentTheme;
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        this.themeIcon.textContent = this.currentTheme === 'light' ? '🌞' : '🌙';
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    new TermFlipGame();
});