const express = require("express")
const bodyParser = require("body-parser")
const morgan = require("morgan")
const http = require("http")
const path = require("path")
const cors = require("cors")
const socketIO = require("socket.io")
const mongoose = require("mongoose")
const fs = require("fs")

const quiz = require("./core/quiz")

require("dotenv").config({ path: "variables.env" })

const ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8080

const app = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: false, limit: "50mb" }))
app.use(bodyParser.json())

const server = http.createServer(app)
const io = socketIO(server)
io.sockets.server.engine.pingTimeout = 15000

app.enable("trust proxy")

app.use(cors())
app.use(morgan("dev"))

const publicDir = require("path").join(__dirname, "/public")
app.use(express.static(publicDir))

if (ENV === "production") {
  app.use(express.static(path.join(__dirname, "./../client/build")))
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "./../client/build/index.html"))
  })
} else {
  console.warn("You are in development environment...")
}

try {
  mongoose.connect(
    process.env.MONGO_URI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log(" Mongoose is connected")
  )
  mongoose.Promise = global.Promise
  mongoose.connection.on("error", (err) => {
    console.error(`-> ${err.message}`)
  })
} catch (e) {
  console.log("Error: could not connect")
}

io.on("connection", (socket) => {
  listen(io, socket, "lobby:create", quiz.createLobby.bind(quiz))
  listen(io, socket, "lobby:check", quiz.checkLobby.bind(quiz))
  listen(io, socket, "lobby:join", quiz.joinLobby.bind(quiz))
  listen(io, socket, "game:start", quiz.startGame.bind(quiz))
  listen(io, socket, "game:select-theme", quiz.selectTheme.bind(quiz))
  listen(io, socket, "game:answer-qcm", quiz.answerQCM.bind(quiz))
  listen(io, socket, "game:answer-text", quiz.answerText.bind(quiz))
  listen(io, socket, "game:return-lobby", quiz.returnLobby.bind(quiz))
  listen(io, socket, "disconnect", quiz.removeUser.bind(quiz))
})

function listen(io, socket, type, callback) {
  socket.on(type, (data) => {
    callback(io, socket, data)
  })
}

const checkQuestions = (questions) => {
  for (let i = 0; i < questions.length; i++) {
    if (!questions[i].question) return false
    for (let r = 0; r < questions[i].response.length; r++) {
      if (r === 0 && !questions[i].response[r]) return false
      else if (r > 0 && !questions[i].response[r])
        questions[i].response.splice(r, 1)
    }

    for (let q = 0; q < questions[i].qcm.length; q++) {
      if (!questions[i].qcm[q]) return false
    }
  }
  return true
}

const modelsPath = path.join(__dirname, "models")
fs.readdirSync(modelsPath).forEach(function (file) {
  require(path.join(modelsPath, file))
})

const Theme = mongoose.model("Theme")

const saveTheme = async (title, questions) => {
  const theme = new Theme({ title, questions })
  await theme.save()
}

const getThemes = () => {
  const themes = Theme.aggregate([{ $sample: { size: 5 } }])
  return themes
}

app.get("/list-quiz", async (req, res) => {
  const themes = await getThemes()
  let status = 200
  let message = "Quiz found."

  if (!themes) {
    status = 404
    message = "Quiz not found."
  }

  console.log(themes)

  res.json({ status, message, body: themes })
})

app.post("/submit-quiz", (req, res) => {
  const { quiz } = req.body
  const { title, questions } = quiz

  let status = 200
  let message = "Quiz submitted."
  if (!title) {
    message = "Invalid title."
    status = 401
  } else if (!questions || questions.length !== 10) {
    message = "Invalid questions format."
    status = 401
  } else if (!checkQuestions(questions)) {
    message = "Invalid QCM and response supplied."
    status = 401
  }

  if (status === 200) {
    // check responses includes in qcm
    // check accent in responses
    saveTheme(title, questions)
  }

  console.log(status, message)
  res.json({ status, message })
})

server.listen(PORT, () => {
  console.warn(`Server listening on port ${PORT}!`)
})

module.exports = app
