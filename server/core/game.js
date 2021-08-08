const fs = require('fs')
const path = require('path')

const COUNTDOWN = 60

const DIC_ACCENTED_CHAR = {
  é: 'e',
  à: 'a',
  è: 'e',
  ù: 'u',
  â: 'a',
  î: 'i',
  ô: 'o',
  û: 'u',
  ê: 'e',
  ï: 'i',
  ü: 'u',
  ö: 'o',
  ë: 'e',
  ç: 'c',
}

const THEMES_JSON = JSON.parse(
  fs.readFileSync(path.join(__dirname, '/themes.json'))
)

const THEMES = THEMES_JSON.themes

const shuffleArray = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = deck[i]
    deck[i] = deck[j]
    deck[j] = temp
  }
}

class Game {
  constructor(users, options) {
    // nbPlayer, nbQuiz, countdown, randomQuiz, streak
    this.options = options

    this.users = users
    this.turnStreak = false
    this.streakCount = 0
    this.streakCancel = false
    this.themeIndexes = Array.from(Array(THEMES.length), (_, index) => index)
    shuffleArray(this.themeIndexes)
    this.quizIndexes = this.themeIndexes.slice(0, options.nbQuiz)
    this.doneThemes = new Array(options.nbQuiz).fill(false)
    this.themes = Array.from(
      Array(this.quizIndexes.length),
      (_, i) => THEMES[this.quizIndexes[i]]
    )
    this.currentTheme = -1
    this.theme = null
    this.answers = new Array(10)
    this.currentQuestion = 0
    this.countdown = null
    this.timer = null

    for (let i = 0; i < this.users.length; i++) {
      this.users[i].currentScore = 0
      this.users[i].score = 0
      this.users[i].streak = false
    }

    this.currentPlayer = Math.floor(Math.random() * this.users.length)
    this.firstPlayer = this.currentPlayer
  }

  getCurrentPlayer() {
    return this.users[this.currentPlayer]
  }

  selectTheme(selectedIndex, streak) {
    this.currentTheme = this.quizIndexes[selectedIndex]
    this.doneThemes[selectedIndex] = true
    if (this.users[this.currentPlayer].streak === false && streak === true) {
      this.turnStreak = true
      this.users[this.currentPlayer].streak = true
    }
    this.theme = THEMES[this.currentTheme]
    this.answers.fill(-1)
    for (let i = 0; i < this.theme.questions.length; i++)
      shuffleArray(this.theme.questions[i].qcm)
  }

  isCurrentUser(id) {
    return this.theme && id === this.users[this.currentPlayer].id
  }

  answerQCM(qcmIndex) {
    const { questions } = this.theme

    return this.checkAnswer(
      questions[this.currentQuestion].qcm[qcmIndex],
      qcmIndex
    )
  }

  answerText(text) {
    return this.checkAnswer(text, -1)
  }

  checkAnswer(answer, qcmIndex) {
    const word = answer
      .replace(/[^\w ]/g, (char) => DIC_ACCENTED_CHAR[char] || char)
      .toLowerCase()

    const { questions } = this.theme
    let response = null
    if (questions[this.currentQuestion].response.includes(word)) {
      this.users[this.currentPlayer].currentScore++
      this.answers[this.currentQuestion] = 1
      response = qcmIndex === -1 ? answer : qcmIndex
      if (!this.streakCancel && this.turnStreak) this.streakCount++
    } else {
      if (!this.streakCancel && this.turnStreak) {
        this.streakCancel = true
        this.streakCount =
          this.streakCount < 5
            ? 0
            : this.streakCount < 8
            ? 5
            : this.streakCount < 10
            ? 8
            : 10
      }
      this.answers[this.currentQuestion] =
        this.answers[this.currentQuestion] === 2 ? 0 : 2
      response =
        qcmIndex === -1
          ? questions[this.currentQuestion].response[0]
          : questions[this.currentQuestion].qcm.findIndex((q) =>
              questions[this.currentQuestion].response.includes(
                q
                  .replace(/[^\w ]/g, (char) => DIC_ACCENTED_CHAR[char] || char)
                  .toLowerCase()
              )
            )
    }

    const allChecked =
      this.answers.findIndex((answer) => answer === -1 || answer === 2) >= 0

    if (allChecked) {
      do {
        this.currentQuestion = (this.currentQuestion + 1) % this.answers.length
      } while (
        this.answers[this.currentQuestion] === 1 ||
        this.answers[this.currentQuestion] === 0
      )
    }

    return { allChecked, response }
  }

  newRound(removeUser = false) {
    if (!removeUser) {
      this.streakCount =
        this.streakCount < 5
          ? 0
          : this.streakCount < 8
          ? 5
          : this.streakCount < 10
          ? 8
          : 10

      this.users[this.currentPlayer].currentScore += this.streakCount

      for (let i = 0; i < this.users.length; i++) {
        this.users[i].score += this.users[i].currentScore
        this.users[i].currentScore = 0
      }
    }

    this.currentPlayer = (this.currentPlayer + 1) % this.users.length
    const remainingThemes = this.doneThemes.filter((t) => t === false).length
    if (
      remainingThemes < this.users.length &&
      this.currentPlayer === this.firstPlayer
    ) {
      return false
    }

    this.streakCancel = false
    this.streakCount = 0
    this.turnStreak = false
    this.theme = null
    this.answers.fill(-1)
    this.currentQuestion = 0
    this.countdown = null
    this.timer = null

    return true
  }

  setCountdown(fct, timeout) {
    this.countdown = setInterval(fct, timeout)
  }

  clearCountdown() {
    clearInterval(this.countdown)
  }

  resetCountdown() {
    const cd = this.options.countdown || COUNTDOWN
    this.timer = cd * 1000

    return this.timer
  }

  getTimer() {
    return this.timer
  }

  getOptions() {
    return this.options
  }

  getGameState() {
    return {
      turnStreak: this.turnStreak,
      currentTheme: this.currentTheme,
      doneThemes: this.doneThemes,
      theme: this.theme,
      themes: this.themes,
      answers: this.answers,
      currentQuestion: this.currentQuestion,
      currentPlayer: this.currentPlayer,
      streakCount: this.streakCount,
    }
  }

  getUsers() {
    return this.users
  }

  rankUsers() {
    this.users.sort((u1, u2) => (u1.score < u2.score ? 1 : -1))
  }

  updateCurrentPlayer(deletedIndex) {
    if (deletedIndex >= this.currentPlayer) return

    this.currentPlayer =
      this.currentPlayer - 1 < 0
        ? this.users.length - 1
        : this.currentPlayer - 1
  }

  removeUser(id) {
    const index = this.users.findIndex((user) => user.id === id)
    let currentPlayer =
      this.users.length > 0 &&
      this.users[this.currentPlayer].id === this.users[index].id

    if (
      currentPlayer &&
      this.users[this.firstPlayer].id === this.users[index].id &&
      this.users.length > 0
    )
      this.firstPlayer = ((this.firstPlayer + 1) % this.users.length) - 1

    if (index !== -1) this.users.splice(index, 1)

    return currentPlayer
  }
}

module.exports = Game
