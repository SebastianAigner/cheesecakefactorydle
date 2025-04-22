// Game variables
let menuData = null;
let currentItem = null;
let guessCount = 0;
const MAX_GUESSES = 6;
let gameActive = true;

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

    // Check if guess is correct (within 10% or 100 calories)
    const isCorrect = percentDifference < 10 || difference <= 100;

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
        ? '↑ Too high' 
        : guess < actualCalories 
            ? '↓ Too low' 
            : '✓ Correct!';

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

    // Display success message
    resultMessage.textContent = `🎉 ${randomTitle} The actual calorie count is ${actualCalories}.`;
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

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);
