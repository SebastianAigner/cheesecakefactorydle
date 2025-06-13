// Game variables
let menuData = null;
let currentItem = null;
let guessCount = 0;
const MAX_GUESSES = 6;
let gameActive = true;

// Game mode variables
let currentGameMode = 'classic'; // 'classic' or 'discaloried'

// Discaloried game variables
let discaloriedItemsData = [];
let discaloriedGuesses = 5;
let discaloriedGameActive = false;
let lockedItems = new Set();

// Congratulatory titles
const congratulatoryTitles = [
    "Calorie Counting Champion!",
    "Nutrition Ninja!",
    "Diet Detective Extraordinaire!",
    "Portion Size Pro!",
    "Macro Master!",
    "Food Fact Wizard!",
    "Cheesecake Factory Expert!",
    "Dietary Data Genius!",
    "Caloric Content Connoisseur!",
    "Menu Maestro!"
];

// DOM elements
const foodImage = document.getElementById('food-image');
const foodName = document.getElementById('food-name');
const foodDescription = document.getElementById('food-description');
const calorieGuess = document.getElementById('calorie-guess');
const submitGuess = document.getElementById('submit-guess');
const feedback = document.getElementById('feedback');
const guessesList = document.getElementById('guesses-list');
const resultMessage = document.getElementById('result-message');

// Game mode DOM elements
const classicModeBtn = document.getElementById('classic-mode-btn');
const discaloriedModeBtn = document.getElementById('discaloried-mode-btn');
const classicGame = document.getElementById('classic-game');
const discaloriedGame = document.getElementById('discaloried-game');

// Discaloried DOM elements
const discaloriedItems = document.getElementById('discaloried-items');
const discaloriedGuessBtn = document.getElementById('discaloried-guess-btn');
const discaloriedFeedback = document.getElementById('discaloried-feedback');
const discaloriedResult = document.getElementById('discaloried-result');
const discaloriedGuessesSpan = document.getElementById('discaloried-guesses');

// Initialize the game
async function initGame() {
    try {
        // Load menu data
        const response = await fetch('menu.json');
        menuData = await response.json();

        // Select a random item
        selectRandomItem();

        // Set up event listeners
        submitGuess.addEventListener('click', handleGuess);
        calorieGuess.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleGuess();
            }
        });

        // Set up game mode switching
        classicModeBtn.addEventListener('click', () => switchGameMode('classic'));
        discaloriedModeBtn.addEventListener('click', () => switchGameMode('discaloried'));
        
        // Set up Discaloried game listeners
        discaloriedGuessBtn.addEventListener('click', handleDiscaloriedGuess);
    } catch (error) {
        console.error('Error initializing game:', error);
        feedback.textContent = 'Error loading menu data. Please refresh the page.';
    }
}

// Select a random food item from the menu
function selectRandomItem() {
    // Flatten all products from all categories
    const allProducts = menuData.categories.reduce((products, category) => {
        if (category.products && Array.isArray(category.products)) {
            return products.concat(category.products);
        }
        return products;
    }, []);

    // Filter products to only include those with calories and images
    const validProducts = allProducts.filter(product => 
        product.basecalories && 
        product.imagefilename && 
        product.name
    );

    // Select a random product
    const randomIndex = Math.floor(Math.random() * validProducts.length);
    currentItem = validProducts[randomIndex];

    // Display the item
    displayItem(currentItem);
}

// Display the current food item
function displayItem(item) {
    // Set the image URL using the imagepath from menu.json
    const imageUrl = `${menuData.imagepath}${item.imagefilename}`;
    foodImage.src = imageUrl;

    // Set the food name and description
    foodName.textContent = item.name;
    foodDescription.textContent = item.description || '';

    // Reset game state
    guessCount = 0;
    gameActive = true;
    guessesList.innerHTML = '';
    feedback.textContent = '';
    resultMessage.textContent = '';
    resultMessage.className = 'result-message';
    calorieGuess.value = '';
    calorieGuess.focus();
}

// Handle a user guess
function handleGuess() {
    if (!gameActive) return;

    const guess = parseInt(calorieGuess.value.trim());

    // Validate input
    if (isNaN(guess) || guess < 0) {
        feedback.textContent = 'Please enter a valid number of calories.';
        return;
    }

    // Increment guess count
    guessCount++;

    // Get actual calories
    const actualCalories = parseInt(currentItem.basecalories);

    // Calculate percentage difference
    const difference = Math.abs(guess - actualCalories);
    const percentDifference = (difference / actualCalories) * 100;

    // Calculate allowed margin (10% of actual calories, capped at 100)
    const allowedMargin = Math.max(Math.min(actualCalories * 0.1, 100), 10);

    // Check if guess is correct (within the allowed margin)
    const isCorrect = difference <= allowedMargin;

    // Add to previous guesses list
    addGuessToList(guess, actualCalories);

    // Clear input field
    calorieGuess.value = '';
    calorieGuess.focus();

    // Check game state
    if (isCorrect) {
        handleCorrectGuess(actualCalories);
    } else if (guessCount >= MAX_GUESSES) {
        handleGameOver(actualCalories);
    } else {
        // Game continues
        feedback.textContent = `Not quite! ${guessCount}/${MAX_GUESSES} guesses used.`;
    }
}

// Add a guess to the previous guesses list
function addGuessToList(guess, actualCalories) {
    const listItem = document.createElement('li');

    // Determine if guess is higher or lower
    const comparison = guess > actualCalories 
        ? '⬇️ Too high'
        : guess < actualCalories 
            ? '⬆️ Too low'
            : '✅ Correct!';

    // Create guess text
    listItem.innerHTML = `
        <span>Guess #${guessCount}: ${guess} calories</span>
        <span>${comparison}</span>
    `;

    // Add to list
    guessesList.prepend(listItem);
}

// Handle a correct guess
function handleCorrectGuess(actualCalories) {
    gameActive = false;

    // Select a random congratulatory title
    const randomTitle = congratulatoryTitles[Math.floor(Math.random() * congratulatoryTitles.length)];

    // Clear the result message
    resultMessage.innerHTML = '';

    // Create and add the celebration image
    const celebrationImage = document.createElement('img');
    celebrationImage.src = 'Sebi_cheesecake.png';
    celebrationImage.alt = 'Celebration Image';
    celebrationImage.classList.add('celebration-image');
    resultMessage.appendChild(celebrationImage);

    // Add a line break
    resultMessage.appendChild(document.createElement('br'));

    // Add the success message
    const successMessage = document.createElement('p');
    successMessage.textContent = `🎉 ${randomTitle} The actual calorie count is ${actualCalories}.`;
    resultMessage.appendChild(successMessage);

    // Add the celebrate class
    resultMessage.classList.add('celebrate');

    // Add button to play again
    addPlayAgainButton();
}

// Handle game over (too many guesses)
function handleGameOver(actualCalories) {
    gameActive = false;

    // Display game over message
    resultMessage.textContent = `😢 Better luck next time! The actual calorie count is ${actualCalories}.`;
    resultMessage.classList.add('game-over');

    // Add button to play again
    addPlayAgainButton();
}

// Add a play again button
function addPlayAgainButton() {
    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.classList.add('play-again');
    playAgainButton.addEventListener('click', selectRandomItem);

    resultMessage.appendChild(document.createElement('br'));
    resultMessage.appendChild(playAgainButton);
}

// Game mode switching
function switchGameMode(mode) {
    currentGameMode = mode;
    
    // Update button states
    classicModeBtn.classList.toggle('active', mode === 'classic');
    discaloriedModeBtn.classList.toggle('active', mode === 'discaloried');
    
    // Show/hide game containers
    classicGame.classList.toggle('hidden', mode !== 'classic');
    discaloriedGame.classList.toggle('hidden', mode !== 'discaloried');
    
    if (mode === 'discaloried') {
        initDiscaloriedGame();
    }
}

// Initialize Discaloried game
function initDiscaloriedGame() {
    // Reset game state
    discaloriedGuesses = 5;
    discaloriedGameActive = true;
    lockedItems.clear();
    discaloriedFeedback.textContent = '';
    discaloriedResult.textContent = '';
    discaloriedResult.className = 'result-message';
    discaloriedGuessesSpan.textContent = discaloriedGuesses;
    discaloriedGuessBtn.disabled = false;
    
    // Select 5 random items
    selectDiscaloriedItems();
    
    // Display items
    displayDiscaloriedItems();
}

// Select 5 random items for Discaloried game
function selectDiscaloriedItems() {
    // Flatten all products from all categories
    const allProducts = menuData.categories.reduce((products, category) => {
        if (category.products && Array.isArray(category.products)) {
            return products.concat(category.products);
        }
        return products;
    }, []);

    // Filter products to only include those with calories and images
    const validProducts = allProducts.filter(product => 
        product.basecalories && 
        product.imagefilename && 
        product.name &&
        parseInt(product.basecalories) > 0
    );

    // Select 5 random products
    const selectedItems = [];
    const usedIndices = new Set();
    
    while (selectedItems.length < 5 && selectedItems.length < validProducts.length) {
        const randomIndex = Math.floor(Math.random() * validProducts.length);
        if (!usedIndices.has(randomIndex)) {
            usedIndices.add(randomIndex);
            selectedItems.push(validProducts[randomIndex]);
        }
    }
    
    // Sort by calories (descending) to get correct order
    const correctOrder = [...selectedItems].sort((a, b) => 
        parseInt(b.basecalories) - parseInt(a.basecalories)
    );
    
    // Shuffle for display
    const shuffledItems = [...selectedItems];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }
    
    // Store both arrays
    discaloriedItemsData = shuffledItems;
    discaloriedItemsData.correctOrder = correctOrder;
}

// Display Discaloried items
function displayDiscaloriedItems() {
    // Clear all boxes
    const boxes = document.querySelectorAll('.discaloried-box');
    boxes.forEach(box => {
        box.innerHTML = '';
        box.classList.remove('locked');
    });
    
    // Place items in boxes
    discaloriedItemsData.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'discaloried-item';
        itemElement.draggable = true;
        itemElement.dataset.itemId = item.id;
        
        const imageUrl = `${menuData.imagepath}${item.imagefilename}`;
        
        itemElement.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}">
            <div class="discaloried-item-info">
                <div class="discaloried-item-name">
                    <span class="item-name-text">${item.name}</span>
                    <span class="discaloried-item-calories" style="display: none;">${item.basecalories} cal</span>
                </div>
                <div class="discaloried-item-description">${item.description || ''}</div>
            </div>
        `;
        
        // Add drag and drop event listeners
        itemElement.addEventListener('dragstart', handleDragStart);
        itemElement.addEventListener('dragend', handleDragEnd);
        
        // Place item in corresponding box
        const box = boxes[index];
        box.appendChild(itemElement);
    });
    
    // Add drag and drop listeners to boxes
    boxes.forEach(box => {
        box.addEventListener('dragover', handleDragOver);
        box.addEventListener('drop', handleDrop);
        box.addEventListener('dragenter', handleDragEnter);
        box.addEventListener('dragleave', handleDragLeave);
    });
}

// Drag and drop handlers
function handleDragStart(e) {
    if (lockedItems.has(e.target.dataset.itemId)) {
        e.preventDefault();
        return;
    }
    
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.itemId);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    const box = e.target.closest('.discaloried-box');
    if (box && !box.classList.contains('locked')) {
        box.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    const box = e.target.closest('.discaloried-box');
    if (box) {
        box.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedElement = document.querySelector(`[data-item-id="${draggedId}"]`);
    const dropBox = e.target.closest('.discaloried-box');
    
    // Remove drag-over class
    dropBox.classList.remove('drag-over');
    
    if (draggedElement && dropBox) {
        // Don't allow dropping on locked boxes
        if (dropBox.classList.contains('locked')) {
            return;
        }
        
        const sourceBox = draggedElement.closest('.discaloried-box');
        const existingItem = dropBox.querySelector('.discaloried-item');
        
        if (existingItem && existingItem !== draggedElement) {
            // Animate swap between boxes
            animateSwap(draggedElement, existingItem, sourceBox, dropBox);
        } else {
            // Animate move to empty box
            animateMove(draggedElement, dropBox);
        }
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    // Remove any remaining drag-over classes
    document.querySelectorAll('.discaloried-box').forEach(box => {
        box.classList.remove('drag-over');
    });
}

// Animation functions for smooth swapping
function animateSwap(draggedElement, existingItem, sourceBox, dropBox) {
    // Get initial positions
    const draggedRect = draggedElement.getBoundingClientRect();
    const existingRect = existingItem.getBoundingClientRect();
    
    // Calculate the distance to move
    const draggedDeltaX = existingRect.left - draggedRect.left;
    const draggedDeltaY = existingRect.top - draggedRect.top;
    const existingDeltaX = draggedRect.left - existingRect.left;
    const existingDeltaY = draggedRect.top - existingRect.top;
    
    // Add animating class to prevent interactions
    draggedElement.classList.add('animating');
    existingItem.classList.add('animating');
    
    // Apply initial transform to move items to their target positions
    draggedElement.style.transform = `translate(${draggedDeltaX}px, ${draggedDeltaY}px)`;
    existingItem.style.transform = `translate(${existingDeltaX}px, ${existingDeltaY}px)`;
    
    // After animation completes, actually move the DOM elements
    setTimeout(() => {
        // Move elements in DOM
        sourceBox.appendChild(existingItem);
        dropBox.appendChild(draggedElement);
        
        // Reset transforms and remove animating class
        draggedElement.style.transform = '';
        existingItem.style.transform = '';
        draggedElement.classList.remove('animating');
        existingItem.classList.remove('animating');
    }, 500); // Match the CSS transition duration
}

function animateMove(draggedElement, dropBox) {
    // Get initial position
    const draggedRect = draggedElement.getBoundingClientRect();
    
    // Temporarily place element in target box to get target position
    const tempPlaceholder = document.createElement('div');
    tempPlaceholder.style.height = draggedElement.offsetHeight + 'px';
    tempPlaceholder.style.visibility = 'hidden';
    dropBox.appendChild(tempPlaceholder);
    
    const targetRect = tempPlaceholder.getBoundingClientRect();
    dropBox.removeChild(tempPlaceholder);
    
    // Calculate the distance to move
    const deltaX = targetRect.left - draggedRect.left;
    const deltaY = targetRect.top - draggedRect.top;
    
    // Add animating class
    draggedElement.classList.add('animating');
    
    // Apply transform to move to target position
    draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // After animation completes, actually move the DOM element
    setTimeout(() => {
        // Move element in DOM
        dropBox.appendChild(draggedElement);
        
        // Reset transform and remove animating class
        draggedElement.style.transform = '';
        draggedElement.classList.remove('animating');
    }, 500); // Match the CSS transition duration
}

// Handle Discaloried guess
function handleDiscaloriedGuess() {
    if (!discaloriedGameActive) return;
    
    const boxes = document.querySelectorAll('.discaloried-box');
    const correctOrder = discaloriedItemsData.correctOrder;
    
    let correctCount = 0;
    const newlyLocked = [];
    
    // Check each box
    boxes.forEach((box, index) => {
        const item = box.querySelector('.discaloried-item');
        if (!item) return;
        
        const itemId = item.dataset.itemId;
        const currentItem = discaloriedItemsData.find(item => item.id === itemId);
        const correctItem = correctOrder[index];
        
        if (currentItem.id === correctItem.id) {
            if (!lockedItems.has(itemId)) {
                // Newly correct item
                lockedItems.add(itemId);
                box.classList.add('locked');
                item.classList.add('locked');
                item.draggable = false;
                newlyLocked.push(item);
                correctCount++;
            }
        } else if (!lockedItems.has(itemId)) {
            // Incorrect item - add shake animation
            item.classList.add('shake');
            setTimeout(() => {
                item.classList.remove('shake');
            }, 500);
        }
    });
    
    // Update guesses
    discaloriedGuesses--;
    discaloriedGuessesSpan.textContent = discaloriedGuesses;
    
    // Check win condition
    if (lockedItems.size === 5) {
        handleDiscaloriedWin();
        return;
    }
    
    // Check lose condition
    if (discaloriedGuesses <= 0) {
        handleDiscaloriedLose();
        return;
    }
    
    // Update feedback
    if (newlyLocked.length > 0) {
        discaloriedFeedback.textContent = `Great! ${newlyLocked.length} item(s) locked in correct position!`;
    } else {
        discaloriedFeedback.textContent = `No items in correct position. ${discaloriedGuesses} guesses remaining.`;
    }
}

// Handle Discaloried win
function handleDiscaloriedWin() {
    discaloriedGameActive = false;
    discaloriedGuessBtn.disabled = true;
    
    // Show all calories
    const allItems = document.querySelectorAll('.discaloried-item');
    allItems.forEach(element => {
        const calorieElement = element.querySelector('.discaloried-item-calories');
        calorieElement.style.display = 'inline';
    });
    
    // Select a random congratulatory title
    const randomTitle = congratulatoryTitles[Math.floor(Math.random() * congratulatoryTitles.length)];
    
    // Clear the result message
    discaloriedResult.innerHTML = '';
    
    // Create and add the celebration image
    const celebrationImage = document.createElement('img');
    celebrationImage.src = 'Sebi_cheesecake.png';
    celebrationImage.alt = 'Celebration Image';
    celebrationImage.classList.add('celebration-image');
    discaloriedResult.appendChild(celebrationImage);
    
    // Add a line break
    discaloriedResult.appendChild(document.createElement('br'));
    
    // Add the success message
    const successMessage = document.createElement('p');
    successMessage.textContent = `🎉 ${randomTitle} You correctly ordered all dishes by calories!`;
    discaloriedResult.appendChild(successMessage);
    
    // Add the celebrate class
    discaloriedResult.classList.add('celebrate');
    
    // Add button to play again
    addDiscaloriedPlayAgainButton();
}

// Handle Discaloried lose
function handleDiscaloriedLose() {
    discaloriedGameActive = false;
    discaloriedGuessBtn.disabled = true;
    
    // Show all calories
    const allItems = document.querySelectorAll('.discaloried-item');
    allItems.forEach(element => {
        const calorieElement = element.querySelector('.discaloried-item-calories');
        calorieElement.style.display = 'inline';
    });
    
    // Show correct order
    const correctOrder = discaloriedItemsData.correctOrder;
    // Display game over message
    discaloriedResult.textContent = `😢 Better luck next time!`;
    discaloriedResult.classList.add('game-over');
    
    // Add button to play again
    addDiscaloriedPlayAgainButton();
}

// Add a play again button for Discaloried
function addDiscaloriedPlayAgainButton() {
    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.classList.add('play-again');
    playAgainButton.addEventListener('click', initDiscaloriedGame);

    discaloriedResult.appendChild(document.createElement('br'));
    discaloriedResult.appendChild(playAgainButton);
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    initGame();

    // Add click event for Bell Pepper Farm text
    const bellPepperFarm = document.getElementById('bell-pepper-farm');
    const closeupContainer = document.getElementById('closeup-container');

    if (bellPepperFarm && closeupContainer) {
        bellPepperFarm.addEventListener('click', () => {
            closeupContainer.classList.toggle('hidden');
        });
    }
});
