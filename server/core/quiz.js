const Game = require("./game")
const { hasUser, getUserIndex, getUsersInRoom, getUser } = require("./users")

const ROOM_LIMIT = 8
const KEY_LENGTH = 8
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

const createRandomKey = () => {
  const nbChars = CHARS.length
  let r = 0
  let key = ""
  for (let i = 0; i < KEY_LENGTH; i++) {
    r = Math.floor(Math.random() * nbChars)
    key += CHARS[r]
  }
  return key
}

/**
 * Class representing the ginho engine.
 */
class Ginho {
  /**
   * Create ginho engine.
   */
  constructor() {
    this.users = []
    this.game = new Map()
  }

  /**
   * Launch the game, by getting users in the room,
   * initialize game state, and game options from the lobby.
   *
   * @param {object} io - io
   * @param {object} socket - socket io
   * @param {object} options - game options
   */
  startGame(io, socket, options) {
    const user = getUser(this.users, socket.id)
    if (!user) return { error: "Cannot connect with user." }
    const users = getUsersInRoom(this.users, user.room)
    if (this.game.get() !== undefined)
      return { error: "Cannot create the game: the room is already in game." }

    this.game.set(user.room, new Game(users, options, socket.id))
    const game = this.game.get(user.room)
    if (!game) return { error: "Game don't exist." }

    const gameState = game.getGameState()
    io.to(user.room).emit("game:new-game", {
      users: game.getUsers(),
      gameState,
      options,
    })
  }

  returnLobby(io, socket) {
    const user = getUser(this.users, socket.id)
    if (!user) return { error: "Cannot connect with user." }
    const game = this.game.get(user.room)
    if (!game) return { error: "Game don't exist." }

    this.game.delete(user.room)
    io.to(user.room).emit("game:return-lobby-response")
  }

  createLobby(io, socket, { user, room }) {
    if (!(user.name || room)) {
      console.warn("Error: Username and room are required.")
      return { error: "Username and room are required." }
    }

    if (hasUser(this.users, user.name, room)) {
      console.warn("Error: Username is taken.")
      return { error: "Username is taken." }
    }

    user.id = socket.id
    user.room = room
    this.users.unshift(user)

    const game = this.game.get(room)

    if (game) {
      let attempt = 3
      let key = room
      while (attempt) {
        key = createRandomKey()
        if (!this.game.get(key)) break
        attempt--
      }
      if (!attempt) return { error: "Game already created." }
      user.room = key
    }

    socket.join(user.room)
    setTimeout(() => {
      io.to(socket.id).emit("lobby:create-response", { user })
    }, 300)
  }

  checkLobby(io, socket, { room }) {
    let error = false
    if (!room || !room.length === ROOM_LIMIT) error = true

    const roomExist = io.sockets.adapter.rooms[room] || false
    let userExist = false

    if (roomExist) userExist = io.sockets.adapter.rooms[room].sockets[socket.id]

    io.to(socket.id).emit("lobby:check-response", {
      error,
      roomExist,
      userExist,
    })
  }

  joinLobby(io, socket, { user, room }) {
    user.id = socket.id
    user.room = room
    this.users.unshift(user)
    socket.join(user.room)

    let gameStarted = false
    let gameState = null
    let options = null

    const game = this.game.get(room)

    if (game) {
      game.addUser(user)
      gameStarted = true
      gameState = { ...game.getGameState() }
      options = game.getOptions()
    }

    io.to(socket.id).emit("lobby:join-response-user", {
      user,
      users: getUsersInRoom(this.users, user.room),
      gameStarted,
      gameState,
      options,
    })

    socket.broadcast.to(user.room).emit("lobby:join-response-all", {
      users: getUsersInRoom(this.users, user.room),
    })
  }

  /**
   * Remove user from the lobby or the game.
   *
   * @param {object} io - io
   * @param {object} socket - socket io
   */
  removeUser(io, socket) {
    const index = this.users.findIndex((user) => user.id === socket.id)
    const user = this.users[index]

    if (index > -1) {
      const room = user.room
      const game = this.game.get(room)
      if (game) {
        const currentPlayer = game.removeUser(user.id)
        if (game.getUsers().length === 0) this.game.delete(room)
        this.users.splice(index, 1)

        if (currentPlayer) {
          game.resetCountdown()
          game.clearCountdown()
          const newRound = game.newRound(true)

          if (newRound) {
            io.to(user.room).emit("game:print-quit", {
              currentPlayer: game.getCurrentPlayer(),
            })

            setTimeout(() => {
              io.to(user.room).emit("game:new-round", {
                users: game.getUsers(),
                gameState: game.getGameState(),
              })
            }, 2500)
          } else {
            game.rankUsers()
            io.to(user.room).emit("game:end-game", {
              users: game.getUsers(),
              gameState: game.getGameState(),
            })
          }
        } else {
          console.log(this.users)
          console.log(index)
          game.updateCurrentPlayer(index)
          io.to(user.room).emit("game:disconnect", {
            users: getUsersInRoom(game.getUsers(), user.room),
          })
        }
      } else {
        io.to(user.room).emit("game:disconnect", {
          users: getUsersInRoom(this.users, room),
        })
      }
    }
  }

  /**
   * Update user action.
   *
   * @param {object} io - io
   * @param {object} socket - socket io
   * @param {*} action - user action
   */
  selectTheme(io, socket, { selectedIndex, streak }) {
    const index = getUserIndex(this.users, socket.id)
    const user = this.users[index]

    if (!user) {
      console.warn("Error: User don't exist.")
      return { error: "User don't exist." }
    }

    const game = this.game.get(user.room)

    if (!game || game === null) {
      console.warn("Game is not existing.")
      return { error: "Game is not existing." }
    }

    game.selectTheme(selectedIndex, streak)
    const gameState = game.getGameState()
    const users = game.getUsers()

    io.to(user.room).emit("game:select-theme-response", {
      users,
      gameState,
      selectedIndex,
    })

    setTimeout(() => {
      game.resetCountdown()
      game.clearCountdown()
      const timer = game.getTimer()
      game.setCountdown(() => {
        game.resetCountdown()
        game.clearCountdown()
        const currentPlayer = game.getCurrentPlayer()
        const newRound = game.newRound(false)
        if (newRound) {
          io.to(user.room).emit("game:print-score", { currentPlayer })

          setTimeout(() => {
            io.to(user.room).emit("game:new-round", {
              users: game.getUsers(),
              gameState: game.getGameState(),
            })
          }, 2500)
        } else {
          game.rankUsers()
          io.to(user.room).emit("game:end-game", {
            users: game.getUsers(),
            gameState: game.getGameState(),
          })
        }
      }, timer.end - timer.start)
    }, 3300)
  }

  answerText(io, socket, { text }) {
    const index = getUserIndex(this.users, socket.id)
    const user = this.users[index]

    if (!user) {
      return { error: "User don't exist." }
    }

    const game = this.game.get(user.room)

    if (!game || game === null) {
      console.warn("Game is not existing.")
      return { error: "Game is not existing." }
    }

    if (!game.isCurrentUser(user.id)) {
      console.warn("Not current user.")
      return { error: "Not current user." }
    }

    io.to(user.room).emit("game:answer-text-all", { text })

    const { allChecked, response } = game.answerText(text)
    io.to(user.room).emit("game:answer-text-check", { response })

    if (allChecked) {
      io.to(user.room).emit("game:answer-text-response", {
        users: game.getUsers(),
        gameState: game.getGameState(),
      })
    } else {
      game.resetCountdown()
      game.clearCountdown()
      const currentPlayer = game.getCurrentPlayer()
      const newRound = game.newRound(false)
      if (newRound) {
        io.to(user.room).emit("game:print-score", { currentPlayer })

        setTimeout(() => {
          io.to(user.room).emit("game:new-round", {
            users: game.getUsers(),
            gameState: game.getGameState(),
          })
        }, 2500)
      } else {
        game.rankUsers()
        io.to(user.room).emit("game:end-game", {
          users: game.getUsers(),
          gameState: game.getGameState(),
        })
      }
    }
  }

  answerQCM(io, socket, { qcmIndex }) {
    const index = getUserIndex(this.users, socket.id)
    const user = this.users[index]

    if (!user) {
      return { error: "User don't exist." }
    }

    const game = this.game.get(user.room)

    if (!game || game === null) {
      console.warn("Game is not existing.")
      return { error: "Game is not existing." }
    }

    if (!game.isCurrentUser(user.id)) {
      console.warn("Not current user.")
      return { error: "Not current user." }
    }

    io.to(user.room).emit("game:answer-qcm-all", { qcmIndex })

    const { allChecked, response } = game.answerQCM(qcmIndex)
    io.to(user.room).emit("game:answer-qcm-check", { qcmIndex, response })

    if (allChecked) {
      io.to(user.room).emit("game:answer-qcm-response", {
        users: game.getUsers(),
        gameState: game.getGameState(),
      })
    } else {
      game.resetCountdown()
      game.clearCountdown()
      const currentPlayer = game.getCurrentPlayer()
      const newRound = game.newRound(false)
      if (newRound) {
        io.to(user.room).emit("game:print-score", { currentPlayer })

        setTimeout(() => {
          io.to(user.room).emit("game:new-round", {
            users: game.getUsers(),
            gameState: game.getGameState(),
          })
        }, 2500)
      } else {
        game.rankUsers()
        io.to(user.room).emit("game:end-game", {
          users: game.getUsers(),
          gameState: game.getGameState(),
        })
      }
    }
  }
}

module.exports = new Ginho()
