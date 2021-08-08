import React, { useEffect, useState } from 'react'
import CountUp from 'react-countup'
import { Progress } from 'react-sweet-progress'
import 'react-sweet-progress/lib/style.css'
import Sound from 'react-sound'

import './Game.css'

import { IMGS } from './../constants/images'
import { SOUNDS } from './../constants/sounds'

const CorrectBox = ({ checked, value, opacity }) => {
  return (
    <div
      className="answer-box"
      style={{
        backgroundColor: checked
          ? value === 2
            ? '#f1f0f0'
            : value === 1
            ? '#6fd341'
            : '#f12e2e'
          : '#f1f0f0',
        opacity: opacity,
      }}
    >
      {checked || value !== 2 ? (
        <img
          src={value === 1 ? IMGS['check'] : IMGS['cross']}
          alt="correct-box"
        />
      ) : null}
    </div>
  )
}

const FlagImage = ({ valid, text }) => {
  return (
    <div
      className="flag-container"
      style={{ transform: valid ? 'scale(0.7)' : 'scale(1)' }}
    >
      <img
        alt="flag"
        src={valid ? IMGS['validFlag'] : IMGS['flag']}
        style={{ top: valid ? '-65px' : '-50px' }}
      />
      <p
        style={{
          color: valid ? 'white' : 'black',
          top: valid ? '-62px' : '-47px',
        }}
      >
        {text}
      </p>
    </div>
  )
}

const ToggleButton = ({ streak, boolean, booleanFcn }) => {
  return (
    <div className="button-cover">
      <p className="button-title"> STREAK </p>
      {streak ? (
        <div className="streak-used"> UTILISÉ </div>
      ) : (
        <div className="btn-streak-container">
          <input
            type="checkbox"
            id="toggle-btn-streak"
            onClick={() => booleanFcn(!boolean)}
          />
          <label className="label-streak" htmlFor="toggle-btn-streak"></label>
        </div>
      )}
    </div>
  )
}

const Game = ({ socket, users, gameState, onFullscreen, winner, options }) => {
  // const [showReturnLobbyButton, setShowReturnLobbyButton] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [startTurn, setStartTurn] = useState(false)
  const [answer, setAnswer] = useState('')
  const [isCounterActive, setCounterActive] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [selectedQCM, setSelectedQCM] = useState(-1)
  const [showEndTurn, setShowEndTurn] = useState(false)
  const [response, setResponse] = useState(null)
  const [streak, setStreak] = useState(true && options.streak)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [showUsers, setShowUsers] = useState(false)
  const [showCurrentPlayerQuit, setShowCurrentPlayerQuit] = useState(false)

  useEffect(() => {
    let interval = null
    if (isCounterActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1)
      }, 1000)
    } else if (!isCounterActive && seconds !== 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isCounterActive, seconds])

  useEffect(() => {
    socket.on('game:answer-qcm-check', ({ response }) => {
      setResponse(response)
      setTimeout(() => {
        setResponse(null)
        setSelectedQCM(-1)
      }, 1000)
    })
  }, [socket])

  useEffect(() => {
    socket.on('game:answer-text-check', ({ response }) => {
      setResponse(response)
      setTimeout(() => {
        setResponse(null)
        setAnswer('')
      }, 1000)
    })
  }, [socket])

  useEffect(() => {
    socket.on('game:select-theme-response', ({ selectedIndex }) => {
      setCounterActive(true)
      setSelectedTheme(selectedIndex)

      setTimeout(() => {
        setSeconds(0)
        setStartTurn(true)
      }, 3300)
    })
  }, [socket])

  useEffect(() => {
    socket.on('game:print-quit', ({ currentPlayer }) => {
      setShowCurrentPlayerQuit(true)
      setStartTurn(false)
      setSelectedTheme(null)
      setSeconds(0)
      setCounterActive(false)
      setCurrentPlayer(currentPlayer)

      setTimeout(() => {
        setCurrentPlayer(null)
        setShowCurrentPlayerQuit(false)
      }, 2500)
    })
  })

  useEffect(() => {
    socket.on('game:print-score', ({ currentPlayer }) => {
      setShowEndTurn(true)
      setStartTurn(false)
      setSelectedTheme(null)
      setSeconds(0)
      setCounterActive(false)
      setCurrentPlayer(currentPlayer)

      setTimeout(() => {
        setCurrentPlayer(null)
        setShowEndTurn(false)
      }, 2500)
    })
  })

  useEffect(() => {
    socket.on('game:new-round', () => {
      setShowEndTurn(false)
      setStartTurn(false)
      setSelectedTheme(null)
      setSeconds(0)
      setCounterActive(false)
      setAnswer('')
      setSelectedQCM(-1)
    })
  }, [socket])

  const renderEndTurn = () => {
    if (currentPlayer === null) return null

    const usr = currentPlayer

    return (
      <div
        className={'bg-winner'}
        style={{ animation: 'bg-color 1.5s linear' }}
      >
        <div
          className="winner-container"
          style={{ animation: 'popup-scale 1.5s linear' }}
        >
          <div className="winner-container-avatar">
            <div className="winner-container-img">
              <img src={usr.img} alt="back" />
              <p> {usr.name} </p>
              <div className="winner-score">
                <CountUp start={0} end={usr.score} duration={2} delay={0}>
                  {({ countUpRef }) => <p ref={countUpRef} />}
                </CountUp>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentPlayerQuit = () => {
    if (currentPlayer === null) return null

    const usr = currentPlayer

    return (
      <div
        className={'bg-winner'}
        style={{ animation: 'bg-color 1.5s linear' }}
      >
        <div
          className="winner-container"
          style={{ animation: 'popup-scale 0.5s linear' }}
        >
          <div className="winner-container-avatar">
            <div className="winner-container-img">
              <img src={usr.img} alt="back" />
              <p> Current user quit. </p>
              <p> {usr.name} will take the lead. </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const onReturnLobby = () => {
    setSelectedTheme(null)
    setStartTurn(false)
    setStreak(true)
    setSeconds(0)
    setCurrentPlayer(null)
    socket.emit('game:return-lobby')
  }

  const renderWinner = () => {
    return (
      <div className="bg-winner">
        <div
          className="winner-container"
          style={{ animation: 'popup-scale 1.2s linear' }}
        >
          <div className="winner-container-avatar">
            <div className="winner-container-img">
              <img
                className="winner-crown-img"
                src={IMGS['crown']}
                alt="crown"
                style={{ animation: 'rotating 0.9s ease infinite' }}
              />
              <img src={winner.img} alt="back" />
              <p> {winner.name.slice(0, 10)} </p>
              <div className="winner-score">
                <CountUp start={0} end={winner.score} duration={2} delay={0}>
                  {({ countUpRef }) => <p ref={countUpRef} />}
                </CountUp>
              </div>
            </div>
          </div>
        </div>
        <button className="return-lobby-btn" onClick={() => onReturnLobby()}>
          RETOURNER AU LOBBY
        </button>
      </div>
    )
  }

  const renderShowScore = () => {
    const { themes, currentPlayer, streakCount, turnStreak } = gameState

    const c = turnStreak
      ? streakCount < 5
        ? 0
        : streakCount < 8
        ? 5
        : streakCount < 10
        ? 8
        : 10
      : 0

    return (
      <>
        <div className="selected-theme">
          <div
            className="selected-quiz"
            style={{ position: startTurn ? 'relative' : 'absolute' }}
          >
            <p> {themes[selectedTheme].name} </p>
          </div>

          <div
            className="score-container"
            style={{ left: startTurn ? '90%' : '5%' }}
          >
            <p> {users[currentPlayer].currentScore + c} </p>
          </div>
        </div>
        {!startTurn && (
          <div className="question-container">
            <div className="progress-container">
              <Progress
                percent={(seconds * 100) / 3}
                className="timer-bar"
                theme={{
                  active: { symbol: ' ', color: 'rgb(216, 202, 184)' },
                  success: { symbol: ' ', color: 'rgb(216, 202, 184)' },
                }}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  const onSelectTheme = (index) => {
    if (index === -1 || users[gameState.currentPlayer].id !== socket.id) return

    socket.emit('game:select-theme', { selectedIndex: index, streak })
  }

  const renderQuizTheme = () => {
    const { themes, doneThemes, currentPlayer } = gameState
    const usr = users[currentPlayer]
    if (!themes || !usr) return null

    const userStreak = usr.streak
    return (
      <>
        <div className="user-quiz-container">
          <div
            className="avatar-quiz"
            style={{ marginRight: !userStreak ? '30px' : '0px' }}
          >
            <img src={users[currentPlayer].img} alt="avatar" />
            <p> {users[currentPlayer].name} </p>
          </div>
          {!userStreak &&
            options.streak &&
            users[currentPlayer].id === socket.id && (
              <ToggleButton
                streak={userStreak}
                booleanFcn={setStreak}
                boolean={streak}
              />
            )}
        </div>
        <div className="quiz-container">
          {themes.map((theme, index) => (
            <div
              key={index}
              className={doneThemes[index] ? 'selected-quiz' : 'quiz-element'}
              onClick={() => onSelectTheme(doneThemes[index] ? -1 : index)}
              style={{ opacity: doneThemes[index] ? 0.2 : 1 }}
            >
              <p>
                {options.randomQuiz && index === options.nbQuiz - 1
                  ? '???'
                  : theme.name}
              </p>
            </div>
          ))}
        </div>
      </>
    )
  }

  const onClickQCM = (index) => {
    if (users[gameState.currentPlayer].id !== socket.id || selectedQCM !== -1)
      return

    socket.emit('game:answer-qcm', { qcmIndex: index })
  }

  useEffect(() => {
    socket.on('game:answer-qcm-all', ({ qcmIndex }) => {
      setSelectedQCM(qcmIndex)
    })
  }, [socket])

  useEffect(() => {
    socket.on('game:answer-text-all', ({ text }) => {
      setAnswer(text)
    })
  }, [socket])

  const renderQuestion = () => {
    const { theme, currentQuestion, answers } = gameState
    if (!theme) return null

    return (
      <div className="question-container">
        <div className="progress-container">
          <Progress
            percent={(seconds * 100) / options.countdown}
            className="timer-bar"
            theme={{
              active: { symbol: ' ', color: 'rgb(216, 202, 184)' },
              success: { symbol: ' ', color: 'rgb(216, 202, 184)' },
            }}
          />
        </div>
        <div className="question-text">
          <p> {theme.questions[currentQuestion].question} </p>
        </div>

        {options.qcm ? (
          <div className="answer-input">
            {theme.questions[currentQuestion].qcm.map((value, index) => (
              <div
                className={selectedQCM !== -1 ? 'selected-qcm' : 'answer-qcm'}
                key={index}
                onClick={() => onClickQCM(index)}
                style={
                  selectedQCM === -1
                    ? {}
                    : {
                        backgroundColor:
                          selectedQCM === index
                            ? selectedQCM === response
                              ? '#6fd341'
                              : '#f12e2e'
                            : answers[currentQuestion] === -1
                            ? '#fff'
                            : index === response
                            ? '#6fd341'
                            : '#fff',
                        color:
                          selectedQCM === -1
                            ? '#fff'
                            : selectedQCM === index
                            ? '#fff'
                            : '#000',
                        opacity:
                          selectedQCM === -1
                            ? 1
                            : selectedQCM === index
                            ? 1
                            : 0.5,
                      }
                }
              >
                {value}
              </div>
            ))}
          </div>
        ) : (
          <div className="answer-input">
            <input
              type="text"
              name="answer"
              value={answer}
              placeholder="Entrez votre réponse..."
              onChange={(e) => setAnswer(e.target.value)}
              style={
                answer && response
                  ? {
                      backgroundColor:
                        answer === response ? '#6fd341' : '#f12e2e',
                      color: 'white',
                    }
                  : {}
              }
              onKeyPress={(event) => onAnswerPress(event)}
            />
            {!response && (
              <div className="answer-submit" onClick={() => onSubmitAnswer()}>
                <img alt="sent" src={IMGS['sent']} />
              </div>
            )}
          </div>
        )}

        {options.qcm && selectedQCM === response ? (
          <Sound url={SOUNDS['correct']} playStatus={Sound.status.PLAYING} />
        ) : options.qcm && selectedQCM !== -1 && selectedQCM !== response ? (
          answers[currentQuestion] === -1 ? (
            <Sound url={SOUNDS['wrong']} playStatus={Sound.status.PLAYING} />
          ) : (
            <Sound
              url={SOUNDS['secondWrong']}
              playStatus={Sound.status.PLAYING}
            />
          )
        ) : null}
      </div>
    )
  }

  const onAnswerPress = (event) => {
    if (event.key === 'Enter') onSubmitAnswer()
  }

  const onSubmitAnswer = () => {
    if (users[gameState.currentPlayer].id !== socket.id || (answer && response))
      return

    socket.emit('game:answer-text', { text: answer === '' ? ' ' : answer })
  }

  /* const renderTimer = () => {
    return <div className="timer-container"> TOUR 1/3 </div>
  } */

  const renderAnswers = () => {
    const { answers, turnStreak, streakCount, currentPlayer } = gameState

    return (
      <div
        className="answers-container"
        style={{ transform: startTurn ? 'scale(1)' : 'scale(0)' }}
      >
        <div className="avatar-quiz">
          <img src={users[currentPlayer].img} alt="avatar" />
          <p> {users[currentPlayer].name} </p>
        </div>
        {answers &&
          answers.map((answerValue, index) => (
            <div key={index} className="answer-container">
              <CorrectBox
                checked={answerValue !== -1}
                value={answerValue}
                opacity={answerValue !== -1 ? 1 : 0.5}
                key={index}
              />
              {turnStreak && index === 4 && (
                <FlagImage valid={streakCount > 4} text={'+5'} />
              )}
              {turnStreak && index === 7 && streakCount > 4 && (
                <FlagImage valid={streakCount > 7} text={'+8'} />
              )}
              {turnStreak && index === 9 && streakCount > 7 && (
                <FlagImage valid={streakCount === 10} text={'+10'} />
              )}
            </div>
          ))}
      </div>
    )
  }

  const renderTransparentLayer = () => {
    return <div className="transparent-layer"></div>
  }

  const renderUsers = () => {
    const { currentPlayer } = gameState
    return (
      <>
        <div
          className="users-arrow"
          style={{ left: showUsers ? '100px' : '0' }}
          onClick={() => setShowUsers(!showUsers)}
        >
          {' '}
          {showUsers ? '<' : '>'}{' '}
        </div>
        {showUsers && (
          <div
            className="users-container"
            style={{ left: showUsers ? '10px' : '-100px' }}
          >
            {users.map((usr, index) => (
              <div
                key={index}
                className="user-element"
                style={{
                  boxShadow:
                    usr.id === socket.id
                      ? '5px 5px 0 rgba(0, 0, 0, 1)'
                      : '1px 1px 0 rgba(0, 0, 0, 0.5)',
                  backgroundColor:
                    usr.id === users[currentPlayer].id ? '#6fd341' : '#fff',
                }}
              >
                <img src={usr.img} alt="usr-avatar" />
                <p
                  style={{
                    color: usr.id === users[currentPlayer].id ? '#fff' : '#000',
                  }}
                >
                  {usr.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <div id="game-container-id" className="div-game-container">
      <img
        className="game-full-screen"
        src={IMGS['fullScreen']}
        onClick={onFullscreen}
        alt="full-screen"
      />
      <>
        {gameState &&
          users[gameState.currentPlayer] &&
          users[gameState.currentPlayer].id !== socket.id &&
          renderTransparentLayer()}
        {renderUsers()}
        {selectedTheme === null ? (
          renderQuizTheme()
        ) : (
          <div className="start-turn-container">
            {renderAnswers()}
            {renderShowScore()}
            {startTurn && renderQuestion()}
          </div>
        )}
      </>
      {winner && renderWinner()}
      {showEndTurn && renderEndTurn()}
      {showCurrentPlayerQuit && renderCurrentPlayerQuit()}
    </div>
  )
}

export default Game
