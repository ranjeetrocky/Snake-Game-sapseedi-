document.addEventListener("DOMContentLoaded", () => {
    // Game configuration
    const config = {
        boardSize: 20, // 20x20 grid
        cellSize: 20, // 20px per cell
        initialSpeed: 200, // ms per move
        speedIncrease: 5, // ms faster per food
        useRequestAnimationFrame: true, // Use requestAnimationFrame for smooth 60fps
        fps: 60, // Target FPS
    };

    // Array of food options (emojis of animals that snakes eat)
    const foodEmojis = [
        { emoji: "🐁", name: "mouse" },
        { emoji: "🐀", name: "rat" },
        { emoji: "🐇", name: "rabbit" },
        { emoji: "🐸", name: "frog" },
        { emoji: "🦎", name: "lizard" },
        { emoji: "🐦", name: "bird" },
        { emoji: "🐣", name: "chick" },
        { emoji: "🦗", name: "cricket" },
        { emoji: "🐞", name: "beetle" },
        { emoji: "🦟", name: "mosquito" },
        { emoji: "🕷️", name: "spider" },
        { emoji: "🐜", name: "ant" },
        { emoji: "🐌", name: "snail" },
        { emoji: "🦔", name: "hedgehog" },
        { emoji: "🐹", name: "hamster" },
    ];

    // Track the current food emoji to avoid repeating
    let currentFoodIndex = -1;

    // Game state
    let gameState = {
        snake: [{ x: 10, y: 10 }], // Start with head only
        direction: "right",
        nextDirection: "right",
        food: { x: 15, y: 10, type: getNextFoodType() },
        score: 0,
        gameOver: false,
        paused: true,
        speed: config.initialSpeed,
        lastUpdateTime: 0,
        updateInterval: 1000 / config.fps, // Time between animation frames
        moveAccumulator: 0, // Accumulator for movement timing
    };

    // Get next food type, avoiding repetition
    function getNextFoodType() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * foodEmojis.length);
        } while (newIndex === currentFoodIndex && foodEmojis.length > 1);

        currentFoodIndex = newIndex;
        return foodEmojis[newIndex];
    }

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
    let snakeEyes = [];
    let snakePatterns = [];
    let snakeConnectors = [];
    let foodElement = null;
    let animationFrameId = null;

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
        if (!gameState.paused && config.useRequestAnimationFrame) {
            // Restart the animation loop if using requestAnimationFrame
            cancelAnimationFrame(animationFrameId);
            gameLoop(performance.now());
        } else if (!gameState.paused) {
            gameLoopSetTimeout();
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
            lastUpdateTime: 0,
            updateInterval: 1000 / config.fps,
            moveAccumulator: 0,
        };

        // Clear game board
        gameBoard.innerHTML = "";
        snakeElements = [];
        snakeEyes = [];
        snakePatterns = [];
        snakeConnectors = [];

        // Create initial snake
        createSnakeElements();

        // Create food
        createFoodElement();

        // Update score display
        updateScore();

        // Start the game loop
        startButton.textContent = "Restart Game";

        if (config.useRequestAnimationFrame) {
            // Cancel any existing animation frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            // Start the animation loop
            gameLoop(performance.now());
        } else {
            gameLoopSetTimeout();
        }
    }

    // Game loop using requestAnimationFrame for smooth 60fps animation
    function gameLoop(timestamp) {
        if (gameState.gameOver || gameState.paused) return;

        // Calculate time delta
        const deltaTime = timestamp - gameState.lastUpdateTime;
        gameState.lastUpdateTime = timestamp;

        // Accumulate time for movement update
        gameState.moveAccumulator += deltaTime;

        // Update visual positions smoothly every frame
        if (snakeElements.length > 0) {
            updateSnakeVisuals(deltaTime / gameState.speed);
        }

        // Only update game logic at the specified speed
        if (gameState.moveAccumulator >= gameState.speed) {
            // Reset accumulator, potentially keeping remainder for smoother timing
            gameState.moveAccumulator =
                gameState.moveAccumulator % gameState.speed;

            // Update game state
            moveSnake();
            checkCollisions();

            if (gameState.gameOver) {
                showGameOver();
                return;
            }

            // Update snake elements if needed (new segments)
            updateSnakeElements();
        }

        // Request next frame
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Traditional game loop with setTimeout for fallback
    function gameLoopSetTimeout() {
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
        setTimeout(gameLoopSetTimeout, gameState.speed);
    }

    // Create visual elements for snake
    function createSnakeElements() {
        // Clear existing elements
        snakeElements = [];
        snakeEyes = [];
        snakePatterns = [];
        snakeConnectors = [];

        // Create new elements for each segment
        gameState.snake.forEach((segment, index) => {
            // Create segment
            const element = document.createElement("div");
            element.className = "snake-segment";

            if (index === 0) {
                element.classList.add("snake-head");

                // Add eyes to head
                const eyeRight = document.createElement("div");
                eyeRight.className = "snake-eye snake-eye-right";
                element.appendChild(eyeRight);
                snakeEyes.push(eyeRight);

                const eyeLeft = document.createElement("div");
                eyeLeft.className = "snake-eye snake-eye-left";
                element.appendChild(eyeLeft);
                snakeEyes.push(eyeLeft);
            } else {
                // Add pattern to body segments
                const pattern = document.createElement("div");
                pattern.className = "snake-pattern";
                element.appendChild(pattern);
                snakePatterns.push(pattern);
            }

            element.style.left = `${segment.x * config.cellSize}px`;
            element.style.top = `${segment.y * config.cellSize}px`;

            // Add to DOM and track
            gameBoard.appendChild(element);
            snakeElements.push(element);

            // Create connector for segments (except the last one)
            if (
                index < gameState.snake.length - 1 &&
                gameState.snake.length > 1
            ) {
                createSnakeConnector(
                    segment,
                    gameState.snake[index + 1],
                    index
                );
            }

            // Animate entry with GSAP
            gsap.from(element, {
                scale: 0,
                duration: 0.3,
                ease: "back.out(1.7)",
            });
        });

        // Update head rotation based on direction
        updateHeadRotation();
    }

    // Create connector between snake segments
    function createSnakeConnector(segment1, segment2, index) {
        const connector = document.createElement("div");
        connector.className = "snake-body-connector";

        // Position connector based on the two segments it connects
        positionConnector(connector, segment1, segment2);

        gameBoard.appendChild(connector);
        snakeConnectors.push(connector);
    }

    // Position connector between two snake segments
    function positionConnector(connector, segment1, segment2) {
        // Calculate center position and angle
        let left, top, width, height;

        if (segment1.x === segment2.x) {
            // Vertical connector
            left = segment1.x * config.cellSize + 5; // Center horizontally
            top =
                Math.min(segment1.y, segment2.y) * config.cellSize +
                config.cellSize -
                1;
            width = 8;
            height = config.cellSize - 2;
        } else {
            // Horizontal connector
            left =
                Math.min(segment1.x, segment2.x) * config.cellSize +
                config.cellSize -
                1;
            top = segment1.y * config.cellSize + 5; // Center vertically
            width = config.cellSize - 2;
            height = 8;
        }

        connector.style.left = `${left}px`;
        connector.style.top = `${top}px`;
        connector.style.width = `${width}px`;
        connector.style.height = `${height}px`;
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

        // Add emoji to display food type
        foodElement.textContent = gameState.food.type.emoji;
        foodElement.setAttribute("aria-label", gameState.food.type.name);
        foodElement.title = gameState.food.type.name;

        // Style for emoji display
        foodElement.style.display = "flex";
        foodElement.style.justifyContent = "center";
        foodElement.style.alignItems = "center";
        foodElement.style.fontSize = "14px";
        foodElement.style.textAlign = "center";

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

            // Add pattern to body segments
            const pattern = document.createElement("div");
            pattern.className = "snake-pattern";
            newSegment.appendChild(pattern);
            snakePatterns.push(pattern);

            gameBoard.appendChild(newSegment);
            snakeElements.push(newSegment);

            // Create new connector for the new segment
            if (snakeElements.length > 1) {
                createSnakeConnector(
                    gameState.snake[snakeElements.length - 2],
                    gameState.snake[snakeElements.length - 1],
                    snakeElements.length - 2
                );
            }

            // Animate new segment
            gsap.from(newSegment, {
                scale: 0,
                duration: 0.3,
                ease: "back.out(1.7)",
            });
        }

        // Update classes
        gameState.snake.forEach((segment, index) => {
            const element = snakeElements[index];

            // Update class (head or body)
            if (index === 0) {
                element.classList.add("snake-head");

                // If this was previously a body segment, add eyes
                if (element.getElementsByClassName("snake-eye").length === 0) {
                    const eyeRight = document.createElement("div");
                    eyeRight.className = "snake-eye snake-eye-right";
                    element.appendChild(eyeRight);
                    snakeEyes.push(eyeRight);

                    const eyeLeft = document.createElement("div");
                    eyeLeft.className = "snake-eye snake-eye-left";
                    element.appendChild(eyeLeft);
                    snakeEyes.push(eyeLeft);

                    // Remove any pattern if it exists
                    const pattern =
                        element.getElementsByClassName("snake-pattern")[0];
                    if (pattern) {
                        element.removeChild(pattern);
                    }
                }
            } else {
                element.classList.remove("snake-head");

                // If this was previously a head, remove eyes and add pattern
                if (element.getElementsByClassName("snake-eye").length > 0) {
                    Array.from(
                        element.getElementsByClassName("snake-eye")
                    ).forEach((eye) => {
                        element.removeChild(eye);
                    });

                    const pattern = document.createElement("div");
                    pattern.className = "snake-pattern";
                    element.appendChild(pattern);
                    snakePatterns.push(pattern);
                }
            }
        });

        // Update head rotation
        updateHeadRotation();

        // Update all connector positions
        if (snakeConnectors.length > 0) {
            for (let i = 0; i < gameState.snake.length - 1; i++) {
                if (i < snakeConnectors.length) {
                    positionConnector(
                        snakeConnectors[i],
                        gameState.snake[i],
                        gameState.snake[i + 1]
                    );
                }
            }
        }
    }

    // Update head rotation based on direction
    function updateHeadRotation() {
        if (snakeElements.length === 0) return;

        const head = snakeElements[0];

        // Set rotation based on direction
        switch (gameState.direction) {
            case "up":
                head.style.transform = "rotate(-90deg)";
                break;
            case "down":
                head.style.transform = "rotate(90deg)";
                break;
            case "left":
                head.style.transform = "rotate(180deg)";
                break;
            case "right":
                head.style.transform = "rotate(0)";
                break;
        }
    }

    // Update snake visuals smoothly for interpolation between grid positions
    function updateSnakeVisuals(interpolationFactor) {
        // Only update if we have segments
        if (snakeElements.length === 0) return;

        // Cap interpolation factor to prevent visual glitches
        interpolationFactor = Math.min(interpolationFactor, 1);

        // Update head position with smooth interpolation
        gameState.snake.forEach((segment, index) => {
            if (index < snakeElements.length) {
                const element = snakeElements[index];

                // Calculate next position for interpolation
                let nextX = segment.x;
                let nextY = segment.y;

                // For the head, we can predict where it's going
                if (index === 0) {
                    switch (gameState.direction) {
                        case "up":
                            nextY = segment.y - 1;
                            break;
                        case "down":
                            nextY = segment.y + 1;
                            break;
                        case "left":
                            nextX = segment.x - 1;
                            break;
                        case "right":
                            nextX = segment.x + 1;
                            break;
                    }
                }
                // For body segments, follow the segment ahead of them
                else if (index < gameState.snake.length) {
                    nextX = gameState.snake[index - 1].x;
                    nextY = gameState.snake[index - 1].y;
                }

                // Calculate interpolated position
                const currentX = segment.x * config.cellSize;
                const currentY = segment.y * config.cellSize;
                const targetX = nextX * config.cellSize;
                const targetY = nextY * config.cellSize;

                // Only interpolate if moving
                if (
                    index === 0 ||
                    gameState.snake[index - 1].x !== segment.x ||
                    gameState.snake[index - 1].y !== segment.y
                ) {
                    const interpolatedX =
                        currentX + (targetX - currentX) * interpolationFactor;
                    const interpolatedY =
                        currentY + (targetY - currentY) * interpolationFactor;

                    // Apply position with GPU-accelerated transform for smoother animation
                    element.style.transform = `translate(${
                        interpolatedX - currentX
                    }px, ${interpolatedY - currentY}px) ${
                        index === 0 ? getRotationTransform() : ""
                    }`;
                    element.style.left = `${currentX}px`;
                    element.style.top = `${currentY}px`;
                }
            }
        });

        // Update connectors for smooth animation
        snakeConnectors.forEach((connector, index) => {
            if (index < gameState.snake.length - 1) {
                const segment1 = gameState.snake[index];
                const segment2 = gameState.snake[index + 1];

                // Calculate target positions for segments with interpolation
                const nextSeg1X =
                    index === 0
                        ? calculateNextHeadX()
                        : gameState.snake[index - 1].x;
                const nextSeg1Y =
                    index === 0
                        ? calculateNextHeadY()
                        : gameState.snake[index - 1].y;
                const nextSeg2X = segment1.x;
                const nextSeg2Y = segment1.y;

                // Interpolate connector position and size
                const seg1X =
                    segment1.x + (nextSeg1X - segment1.x) * interpolationFactor;
                const seg1Y =
                    segment1.y + (nextSeg1Y - segment1.y) * interpolationFactor;
                const seg2X =
                    segment2.x + (nextSeg2X - segment2.x) * interpolationFactor;
                const seg2Y =
                    segment2.y + (nextSeg2Y - segment2.y) * interpolationFactor;

                // Calculate interpolated connector properties
                let left, top, width, height;

                if (Math.abs(seg1X - seg2X) < 0.1) {
                    // Vertical connector
                    left = seg1X * config.cellSize + 5; // Center horizontally
                    top =
                        Math.min(seg1Y, seg2Y) * config.cellSize +
                        config.cellSize -
                        1;
                    width = 8;
                    height = Math.abs(seg1Y - seg2Y) * config.cellSize - 2;
                } else {
                    // Horizontal connector
                    left =
                        Math.min(seg1X, seg2X) * config.cellSize +
                        config.cellSize -
                        1;
                    top = seg1Y * config.cellSize + 5; // Center vertically
                    width = Math.abs(seg1X - seg2X) * config.cellSize - 2;
                    height = 8;
                }

                connector.style.left = `${left}px`;
                connector.style.top = `${top}px`;
                connector.style.width = `${width}px`;
                connector.style.height = `${height}px`;
            }
        });
    }

    // Helper function to calculate next head position X
    function calculateNextHeadX() {
        const head = gameState.snake[0];
        switch (gameState.direction) {
            case "left":
                return head.x - 1;
            case "right":
                return head.x + 1;
            default:
                return head.x;
        }
    }

    // Helper function to calculate next head position Y
    function calculateNextHeadY() {
        const head = gameState.snake[0];
        switch (gameState.direction) {
            case "up":
                return head.y - 1;
            case "down":
                return head.y + 1;
            default:
                return head.y;
        }
    }

    // Helper function to get rotation transform for head
    function getRotationTransform() {
        switch (gameState.direction) {
            case "up":
                return "rotate(-90deg)";
            case "down":
                return "rotate(90deg)";
            case "left":
                return "rotate(180deg)";
            case "right":
                return "rotate(0)";
        }
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

            // Remove excess connectors if needed
            if (snakeConnectors.length >= gameState.snake.length) {
                const excessConnector = snakeConnectors.pop();
                if (excessConnector) {
                    gameBoard.removeChild(excessConnector);
                }
            }
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
                type: getNextFoodType(),
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

        // Cancel any running animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

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

        // Animate connectors disappearing
        snakeConnectors.forEach((connector, index) => {
            gsap.to(connector, {
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
