// VARIABLES CONCERNING KEYBOARD
const keys = document.querySelectorAll(".key");
const idArr = Array.from(keys).map(function (key) {
  return key.children[0].id;
});

const wordDisplay = document.querySelector("#next-word");
const timeDisplay = document.querySelector("#time");
const scoreDisplay = document.querySelector("#score");
const streakDisplay = document.querySelector("#streak");
const multiplierDisplay = document.querySelector("#multiplier");
const instructionDisplay = document.querySelector("#instruction");
const userInput = document.querySelector("#user-input");
const digitalClock = document.querySelectorAll("#digital-timer .number");
const restartMessage = document.querySelector("#restart-message");
const highscoreDisplay = document.querySelector("#highscore");
const highstreakDisplay = document.querySelector("#highstreak");
const factParagraph = document.querySelector("#fact-paragraph");
const difficultyDisplay = document.querySelector("#difficulty");
const prevDifficulty = document.querySelector("#prev-difficulty");
const nextDifficulty = document.querySelector("#next-difficulty");

// VARIABLES CONCERNING TIME/CLOCK
let clock;
let time = 0;
// combination of pieces to display digits 0-9
const digits = [
  [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13],
  [3, 5, 8, 10, 13],
  [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13],
  [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13],
  [1, 3, 4, 5, 6, 7, 8, 10, 13],
  [1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13],
  [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13],
  [1, 2, 3, 5, 8, 10, 13],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13],
];

// VARIABLES CONCERNING SCOREBOARD AND GAMESTATE
let firstGame = true;
let gameState = false;
let score = 0;
let streak = 0;
var highstreak = 0;
const difficulty = [
  {
    name: "easy",
    timePerWord: 3,
    pointsPerWord: 100,
    letterSteak: 0.1,
    typoPunishment: 0,
  },
  {
    name: "medium",
    timePerWord: 2,
    pointsPerWord: 150,
    letterSteak: 0.25,
    typoPunishment: -200,
  },
  {
    name: "hard",
    timePerWord: 1,
    pointsPerWord: 200,
    letterSteak: 0.5,
    typoPunishment: -400,
    typoPunishmentSeconds: -1,
  },
];

// VARIABLES CONCERNING FACTS/WORDS/LETTERS
let fact;
let word;
// nth letter of current word
let currentIndex;
// nth word of array
let factIndex = 0;
let letters;
let wordsArr;

// EVENT LISTENERS
window.addEventListener("DOMContentLoaded", () => {
  setInterval(checkStatus, 50);
  difficultyDisplay.innerText = difficulty[0].name;
  setDifficultyMessage(difficulty[0]);
  prevDifficulty.classList.remove("hoverable");
});
userInput.addEventListener("input", (e) => {
  backspace(e), matchLetter(e);
});
window.addEventListener("keydown", keyGlow);
window.addEventListener("keyup", keyRemoveGlow);
window.addEventListener("keypress", startGame);
prevDifficulty.addEventListener("click", decreaseDifficulty);
nextDifficulty.addEventListener("click", increaseDifficulty);
difficultyDisplay.addEventListener("mouseover", () => {
  requestAnimationFrame(() => {
    difficultyDisplay.nextElementSibling.nextElementSibling.classList.add(
      "show"
    );
  });
});
difficultyDisplay.addEventListener("mouseout", () => {
  requestAnimationFrame(() => {
    difficultyDisplay.nextElementSibling.nextElementSibling.classList.remove(
      "show"
    );
  });
});

function startGame(e) {
  if ((e.key === " " || e.key === "Spacebar") && !gameState) {
    resetMatchVariables();
    fetchWords().then((data) => {
      let currentDifficulty = difficulty[getDifficultyIndex()];
      console.log(data.text);
      fact = data.text;
      wordsArr = getWordsArr(fact);
      console.log(wordsArr);
      gameState = true;
      firstGame = false;
      time = wordsArr.length * currentDifficulty.timePerWord;
      readyScreen();
      showWord(wordsArr);
      keepTime();
    });

    e.preventDefault();
  }
}

function readyScreen() {
  prevDifficulty.classList.remove("hoverable");
  nextDifficulty.classList.remove("hoverable");

  // Reset values
  score = 0;
  streak = 0;
  highstreak = 0;

  // Restore Input
  userInput.value = "";
  userInput.disabled = false;
  userInput.style.display = "block";
  userInput.parentElement.style.borderBottom = "2px solid #f0f0f0";
  userInput.focus();

  // Display words
  wordDisplay.style.display = "block";

  // Display clock
  digitalClock[0].style.display = "block";
  digitalClock[1].style.display = "block";

  // Display scoreboard
  scoreDisplay.style.color = "#f0f0f0";
  scoreDisplay.parentElement.style.display = "block";
  streakDisplay.parentElement.style.display = "block";
  multiplierDisplay.parentElement.style.display = "block";
  multiplierDisplay.innerText = setPointsMultiplier(streak);
  scoreDisplay.innerText = score;
  streakDisplay.innerText = streak;

  // Hide post-game msg
  if (letters) {
    letters.forEach((letter) => letter.remove());
  }
  instructionDisplay.style.display = "none";
  restartMessage.style.display = "none";
  factParagraph.style.display = "none";
}

function intermissionScreen() {
  let currentDifficulty = difficulty[getDifficultyIndex()];
  if (currentDifficulty.name == "easy" || currentDifficulty.name == "medium") {
    nextDifficulty.classList.add("hoverable");
  }
  if (currentDifficulty.name == "medium" || currentDifficulty.name == "hard") {
    prevDifficulty.classList.add("hoverable");
  }

  // Hide Input
  userInput.value = "";
  userInput.disabled = true;
  userInput.style.display = "none";
  userInput.parentElement.style.borderBottom = "none";

  // Display post-game msg
  instructionDisplay.style.display = "none";
  factParagraph.style.display = "block";
  factParagraph.innerText = fact;
  restartMessage.style.display = "block";
  restartMessage.children[0].style.display = "block";
  restartMessage.children[1].style.display = "block";
  highscoreDisplay.innerText = `${score}`;
  if (highstreak < streak) {
    highstreak = streak;
  }
  highstreakDisplay.innerText = `${highstreak}`;

  // Hide scoreboard
  scoreDisplay.parentElement.style.display = "none";
  streakDisplay.parentElement.style.display = "none";
  multiplierDisplay.parentElement.style.display = "none";
}

function startScreen() {
  // Hide Input
  userInput.value = "";
  userInput.disabled = true;
  userInput.style.display = "none";
  userInput.parentElement.style.borderBottom = "none";

  // Hide word
  wordDisplay.style.display = "none";
  factParagraph.style.display = "none";

  // Display instruction
  restartMessage.style.display = "block";
  restartMessage.children[0].style.display = "none";
  restartMessage.children[1].style.display = "none";

  // Hide scoreboard
  scoreDisplay.parentElement.style.display = "none";
  streakDisplay.parentElement.style.display = "none";
  multiplierDisplay.parentElement.style.display = "none";

  // Hide clock
  digitalClock[0].style.display = "none";
  digitalClock[1].style.display = "none";
}

function countdown() {
  if (time > 1) {
    time--;
  } else {
    time--;
    gameState = false;
  }
}

// Checks if time runs out
function checkStatus() {
  if (!gameState && time <= 0 && !firstGame) {
    gameState = false;
    intermissionScreen();
    clearInterval(clock);
  } else if (!gameState && time <= 0) {
    startScreen();
    clearInterval(clock);
  }
}

// display next word of the array
function showWord(array) {
  // if that was the last word of the array, reset
  if (factIndex === array.length) {
    time = 0;
    factIndex = 0;
    currentIndex = 0;
    gameState = false;
    wordsArr = [];
  } else {
    word = array[factIndex];
    for (let i = 0; i < word.length; i++) {
      const span = document.createElement("span");
      span.className = `letter `;
      span.appendChild(document.createTextNode(word.charAt(i).toUpperCase()));

      wordDisplay.insertBefore(span, wordDisplay.lastChild);
    }

    letters = document.querySelectorAll(".letter");
    currentIndex = 0;
    factIndex++;
  }
}

function matchLetter(e) {
  let currentDifficulty = difficulty[getDifficultyIndex()];

  // correct letter scenario
  if (
    gameState &&
    userInput.value.substring(0, currentIndex + 1).toUpperCase() ===
      word.toUpperCase().substring(0, currentIndex + 1)
  ) {
    letters[currentIndex].classList.add("letter-correct");
    streak++;
    multiplierDisplay.innerText = setPointsMultiplier(streak);
    streakDisplay.innerText = streak;

    if (
      userInput.value.substring(0, currentIndex + 1).toUpperCase() ===
      word.toUpperCase()
    ) {
      userScores(currentDifficulty.pointsPerWord);
      showWord(wordsArr);
    } else {
      currentIndex++;
      matchLetter();
    }
  }

  // incorrect word scenario
  else if (
    gameState &&
    userInput.value.length >= word.substring(0, currentIndex + 1).length &&
    userInput.value.substring(0, currentIndex + 1).toUpperCase() !==
      word.toUpperCase().substring(0, currentIndex + 1)
  ) {
    letters[currentIndex].classList.add("letter-incorrect");

    if (
      userInput.value.length === word.substring(0, currentIndex + 1).length &&
      e.data != null
    ) {
      typoPenaltyPoints(currentDifficulty.typoPunishment);
      typoPenaltySeconds(currentDifficulty.typoPunishmentSeconds);
    }
    if (highstreak < streak) {
      highstreak = streak;
    }
    streak = 0;
    multiplierDisplay.innerText = setPointsMultiplier(streak);
    streakDisplay.innerText = streak;
  }
}

// Adds backspace functionality, removes glow, handles currentIndex, resets streak
function backspace() {
  if ((e.code = "Backspace")) {
    if (userInput.value.length < currentIndex + 1) {
      originalIndex = currentIndex;
      currentIndex = userInput.value.length;

      if (highstreak < streak) {
        highstreak = streak;
      }
      streak = 0;
      multiplierDisplay.innerText = setPointsMultiplier(streak);
      streakDisplay.innerText = streak;

      // Delete correct letter
      for (let i = 0; i < originalIndex - currentIndex; i++) {
        letters[originalIndex - 1 - i].classList.remove("letter-correct");
      }
      // Delete incorrect letter
      for (let i = 0; i < originalIndex - currentIndex + 1; i++) {
        letters[originalIndex - i].classList.remove("letter-incorrect");
      }
    }
  }
}

// Clears input, word and currentIndex, adds score
function userScores(points) {
  currentIndex = 0;
  letters.forEach((letter) => letter.remove());
  userInput.value = "";
  score += Math.floor(setPointsMultiplier(streak) * points);

  scoreDisplay.innerHTML = score;
  animateScorePoints(Math.floor(setPointsMultiplier(streak) * points));
}

function typoPenaltyPoints(penalty) {
  if (penalty < 0) {
    score += penalty;
    score <= 0 ? (score = 0) : score;
    scoreDisplay.innerHTML = score;
    animateScorePoints(penalty);
  }
}

function typoPenaltySeconds(penalty) {
  if (penalty && penalty < 0) {
    time += penalty;

    let digitalTime = splitTimeToDigits(time);
    displayNumber(digitalClock[0], digitalTime[0]);
    displayNumber(digitalClock[1], digitalTime[1]);
    if (time <= 0) {
      checkStatus();
    }
  }
}

// Returns time split into units and tens digits
function splitTimeToDigits(time) {
  if (time < 10) {
    return `0${time}`;
  } else {
    return time.toString().split("");
  }
}

// Shows/hides pieces in order to display digital number
function displayNumber(element, number) {
  const pieces = element.querySelectorAll(".piece");
  pieces.forEach((piece, index) => {
    if (digits[number].includes(index + 1)) {
      piece.classList.add("show");
    } else {
      piece.classList.remove("show");
    }
  });
}

// Runs clock and updates digital display
function keepTime() {
  let digitalTime = splitTimeToDigits(time);
  displayNumber(digitalClock[0], digitalTime[0]);
  displayNumber(digitalClock[1], digitalTime[1]);

  // named interval in order to stop it
  clock = setInterval(() => {
    countdown();
    digitalTime = splitTimeToDigits(time);
    displayNumber(digitalClock[0], digitalTime[0]);
    displayNumber(digitalClock[1], digitalTime[1]);
  }, 1000);
}

// Computes current points multiplier
function setPointsMultiplier(streak) {
  let currentDifficulty = difficulty[getDifficultyIndex()];
  return (1 + currentDifficulty.letterSteak * Math.floor(streak / 10)).toFixed(
    2
  );
}

// Animates scoring points
function animateScorePoints(points) {
  const span = document.createElement("span");
  span.className = "score-points";
  span.appendChild(
    document.createTextNode(`${points >= 0 ? "+" : ""}${points}`)
  );

  requestAnimationFrame(() => {
    span.classList.add("show-points");
  });

  scoreDisplay.parentElement.appendChild(span);
  setTimeout(() => span.remove(), 500);
}

// Fetches random fact from API
async function fetchWords() {
  const response = await fetch(
    `https://uselessfacts.jsph.pl/random.json?language=en`
  );
  const responseData = await response.json();
  return responseData;
}

// converts fetched fact to array of words + gets rid of punctuation
// remove fact variable?????
function getWordsArr(fact) {
  factArr = fact.replace(
    /(~|&quot|`|!|@|#|$|%|^|&|\*|\(|\)|{|}|\[|\]|;|:|\"|'|<|,|\.|>|\?|\/|\\|\||-|_|\+|=)/g,
    ""
  );
  factArr = factArr.replace(/\s\s+/g, " ");
  factArr = factArr.trim();

  return factArr.split(" ");
}

// generates paragraph element and displays fetched fact
function displayfact() {
  const p = document.createElement("p");
  span.appendChild(document.createTextNode(fact));

  wordDisplay.parentElement.appendChild(p);
}

// KEYBOARD ANIMATION
// Adds glow around key pressed
function keyGlow(e) {
  let keyPress = e.key.toLowerCase();
  if (idArr.includes(keyPress)) {
    keys[idArr.indexOf(keyPress)].classList.add("glow");
    keys[idArr.indexOf(keyPress)].classList.add("shadow-key");
    keys[idArr.indexOf(keyPress)].classList.add("press-motion");
  }
}

// Removes glow around key on release
function keyRemoveGlow(e) {
  let keyPress = e.key.toLowerCase();
  if (idArr.includes(keyPress)) {
    keys[idArr.indexOf(keyPress)].classList.remove("glow");
    keys[idArr.indexOf(keyPress)].classList.remove("shadow-key");
    keys[idArr.indexOf(keyPress)].classList.remove("press-motion");
  }
}

function decreaseDifficulty() {
  // check if not disabled
  if (prevDifficulty.classList.contains("hoverable")) {
    // add hoverable to disabled next btn
    if (!nextDifficulty.classList.contains("hoverable")) {
      nextDifficulty.classList.add("hoverable");
    }

    let index = getDifficultyIndex();
    if (index > 0 && index <= difficulty.length - 1) {
      difficultyDisplay.innerText = difficulty[index - 1].name;
      setDifficultyMessage(difficulty[index - 1]);

      // if last element disable icon
      if (index - 1 === 0) {
        prevDifficulty.classList.remove("hoverable");
      }
    }
  }
}

function increaseDifficulty() {
  // check if not disabled
  if (nextDifficulty.classList.contains("hoverable")) {
    // add hoverable to disabled previous btn
    if (!prevDifficulty.classList.contains("hoverable")) {
      prevDifficulty.classList.add("hoverable");
    }

    let index = getDifficultyIndex();
    if (index >= 0 && index < difficulty.length - 1) {
      difficultyDisplay.innerText = difficulty[index + 1].name;
      setDifficultyMessage(difficulty[index + 1]);

      // if last element disable icon
      if (index + 1 === difficulty.length - 1) {
        nextDifficulty.classList.remove("hoverable");
      }
    }
  }
}

function setDifficultyMessage(difficulty) {
  difficultyDisplay.nextElementSibling.nextElementSibling.innerHTML = `
  <span>Time per word: ${difficulty.timePerWord}sec</span>
  <span>Points per word: ${difficulty.pointsPerWord}pts</span>
  <span>10 letters streak: multiplier +${difficulty.letterSteak}</span>
  <span>
    Typo punishment: ${difficulty.typoPunishment}pts 
    ${
      difficulty.typoPunishmentSeconds
        ? "and " + difficulty.typoPunishmentSeconds + "sec"
        : ""
    }
  </span>
  `;
}

function getDifficultyIndex() {
  const currentDifficulty = difficultyDisplay.innerText;
  return difficulty.findIndex((diff) => diff.name == currentDifficulty);
}

function resetMatchVariables() {
  factIndex = 0;
  currentIndex = 0;
  time = 0;
  wordsArr = [];
}
