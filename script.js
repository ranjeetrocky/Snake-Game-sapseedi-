document.addEventListener("DOMContentLoaded", () => {
    // Game configuration
    const config = {
        boardSize: 20, // 20x20 grid
        cellSize: 20, // 20px per cell
        initialSpeed: 200, // ms per move
        speedIncrease: 5, // ms faster per food
    };

    // Game state
    let gameState = {
        snake: [{ x: 10, y: 10 }], // Start with head only
        direction: "right",
        nextDirection: "right",
        food: { x: 15, y: 10 },
        score: 0,
        gameOver: false,
        paused: true,
        speed: config.initialSpeed,
    };

    // DOM Elements
    const gameBoard = document.getElementById("game-board");
    const scoreElement = document.getElementById("score");
    const startButton = document.getElementById("start-btn");

    // Set game board dimensions
    gameBoard.style.width = `${config.boardSize * config.cellSize}px`;
    gameBoard.style.height = `${config.boardSize * config.cellSize}px`;

    // Event listeners
    startButton.addEventListener("click", startGame);
    document.addEventListener("keydown", handleKeyPress);

    // Initialize empty arrays for snake segments and food element
    let snakeElements = [];
    let foodElement = null;

    // Handle keyboard controls
    function handleKeyPress(e) {
        if (gameState.gameOver) return;

        switch (e.key) {
            case "ArrowUp":
                if (gameState.direction !== "down") {
                    gameState.nextDirection = "up";
                }
                break;
            case "ArrowDown":
                if (gameState.direction !== "up") {
                    gameState.nextDirection = "down";
                }
                break;
            case "ArrowLeft":
                if (gameState.direction !== "right") {
                    gameState.nextDirection = "left";
                }
                break;
            case "ArrowRight":
                if (gameState.direction !== "left") {
                    gameState.nextDirection = "right";
                }
                break;
            case " ": // Space bar to pause/unpause
                togglePause();
                break;
        }
    }

    function togglePause() {
        if (gameState.gameOver) return;
        gameState.paused = !gameState.paused;
        if (!gameState.paused) {
            gameLoop();
        }
    }

    // Start a new game
    function startGame() {
        // Reset game state
        gameState = {
            snake: [{ x: 10, y: 10 }],
            direction: "right",
            nextDirection: "right",
            food: generateFoodPosition(),
            score: 0,
            gameOver: false,
            paused: false,
            speed: config.initialSpeed,
        };

        // Clear game board
        gameBoard.innerHTML = "";
        snakeElements = [];

        // Create initial snake
        createSnakeElements();

        // Create food
        createFoodElement();

        // Update score display
        updateScore();

        // Start the game loop
        startButton.textContent = "Restart Game";
        gameLoop();
    }

    // Game loop - controls the flow of the game
    function gameLoop() {
        if (gameState.gameOver || gameState.paused) return;

        // Update game state
        moveSnake();
        checkCollisions();

        if (gameState.gameOver) {
            showGameOver();
            return;
        }

        // Update visual elements
        updateSnakeElements();

        // Schedule next frame
        setTimeout(gameLoop, gameState.speed);
    }

    // Create visual elements for snake
    function createSnakeElements() {
        // Clear existing elements
        snakeElements = [];

        // Create new elements for each segment
        gameState.snake.forEach((segment, index) => {
            const element = document.createElement("div");
            element.className = "snake-segment";

            if (index === 0) {
                element.classList.add("snake-head");
            }

            element.style.left = `${segment.x * config.cellSize}px`;
            element.style.top = `${segment.y * config.cellSize}px`;

            // Add to DOM and track
            gameBoard.appendChild(element);
            snakeElements.push(element);

            // Animate entry with GSAP
            gsap.from(element, {
                scale: 0,
                duration: 0.3,
                ease: "back.out(1.7)",
            });
        });
    }

    // Create visual element for food
    function createFoodElement() {
        if (foodElement) {
            gameBoard.removeChild(foodElement);
        }

        foodElement = document.createElement("div");
        foodElement.className = "food";
        foodElement.style.left = `${gameState.food.x * config.cellSize}px`;
        foodElement.style.top = `${gameState.food.y * config.cellSize}px`;

        gameBoard.appendChild(foodElement);

        // Animate food with GSAP
        gsap.from(foodElement, {
            scale: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
        });

        // Pulsing animation
        gsap.to(foodElement, {
            scale: 1.2,
            duration: 0.8,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
        });
    }

    // Update snake visual elements to match game state
    function updateSnakeElements() {
        // If we need more elements (snake grew)
        while (snakeElements.length < gameState.snake.length) {
            const newSegment = document.createElement("div");
            newSegment.className = "snake-segment";
            gameBoard.appendChild(newSegment);
            snakeElements.push(newSegment);

            // Animate new segment
            gsap.from(newSegment, {
                scale: 0,
                duration: 0.3,
                ease: "back.out(1.7)",
            });
        }

        // Update positions
        gameState.snake.forEach((segment, index) => {
            const element = snakeElements[index];

            // Update class (head or body)
            if (index === 0) {
                element.classList.add("snake-head");
            } else {
                element.classList.remove("snake-head");
            }

            // Animate to new position
            gsap.to(element, {
                left: `${segment.x * config.cellSize}px`,
                top: `${segment.y * config.cellSize}px`,
                duration: 0.1,
                ease: "power1.out",
            });
        });
    }

    // Move the snake based on current direction
    function moveSnake() {
        // Update direction from next direction
        gameState.direction = gameState.nextDirection;

        // Get current head position
        const head = { ...gameState.snake[0] };

        // Calculate new head position
        switch (gameState.direction) {
            case "up":
                head.y -= 1;
                break;
            case "down":
                head.y += 1;
                break;
            case "left":
                head.x -= 1;
                break;
            case "right":
                head.x += 1;
                break;
        }

        // Add new head to beginning of snake array
        gameState.snake.unshift(head);

        // Check if snake ate food
        if (head.x === gameState.food.x && head.y === gameState.food.y) {
            // Generate new food
            gameState.food = generateFoodPosition();
            createFoodElement();

            // Increase score
            gameState.score += 10;
            updateScore();

            // Speed up the game slightly
            gameState.speed = Math.max(
                50,
                gameState.speed - config.speedIncrease
            );
        } else {
            // Remove tail if no food was eaten
            gameState.snake.pop();
        }
    }

    // Check for collisions with walls or self
    function checkCollisions() {
        const head = gameState.snake[0];

        // Check wall collisions
        if (
            head.x < 0 ||
            head.x >= config.boardSize ||
            head.y < 0 ||
            head.y >= config.boardSize
        ) {
            gameState.gameOver = true;
            return;
        }

        // Check self collision (start from index 1 to avoid comparing head with itself)
        for (let i = 1; i < gameState.snake.length; i++) {
            if (
                head.x === gameState.snake[i].x &&
                head.y === gameState.snake[i].y
            ) {
                gameState.gameOver = true;
                return;
            }
        }
    }

    // Generate a random position for food that isn't occupied by the snake
    function generateFoodPosition() {
        let position;
        let overlapping;

        do {
            overlapping = false;
            position = {
                x: Math.floor(Math.random() * config.boardSize),
                y: Math.floor(Math.random() * config.boardSize),
            };

            // Check if position overlaps with snake
            for (const segment of gameState.snake) {
                if (segment.x === position.x && segment.y === position.y) {
                    overlapping = true;
                    break;
                }
            }
        } while (overlapping);

        return position;
    }

    // Update score display
    function updateScore() {
        scoreElement.textContent = gameState.score;

        // Animate score change
        gsap.from(scoreElement, {
            scale: 1.5,
            duration: 0.3,
            ease: "back.out",
        });
    }

    // Show game over state
    function showGameOver() {
        startButton.textContent = "Play Again";

        // Animate snake death
        snakeElements.forEach((element, index) => {
            gsap.to(element, {
                scale: 0,
                opacity: 0,
                delay: index * 0.05,
                duration: 0.3,
                ease: "back.in",
            });
        });

        // Create game over message
        const gameOverMsg = document.createElement("div");
        gameOverMsg.textContent = "Game Over";
        gameOverMsg.style.position = "absolute";
        gameOverMsg.style.top = "50%";
        gameOverMsg.style.left = "50%";
        gameOverMsg.style.transform = "translate(-50%, -50%)";
        gameOverMsg.style.fontSize = "2rem";
        gameOverMsg.style.fontWeight = "bold";
        gameOverMsg.style.color = "#5c6bc0";
        gameOverMsg.style.textShadow = "0 2px 10px rgba(0,0,0,0.1)";

        gameBoard.appendChild(gameOverMsg);

        // Animate game over message
        gsap.from(gameOverMsg, {
            scale: 0,
            rotation: 10,
            opacity: 0,
            duration: 0.5,
            ease: "back.out(1.7)",
        });
    }

    // Initial setup
    updateScore();
});
