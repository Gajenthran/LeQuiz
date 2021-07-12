import React, { useState } from 'react'
import RangeSlider from 'react-bootstrap-range-slider'

import socket from './../../config/socket'

import 'rc-slider/assets/index.css';

import './Lobby.css'

/**
 * Lobby component to manage the game options and
 * start the game.
 *
 * @param {object} lobbyUsers - lobby users
 * @param {string} [lobbyUsers.name] - username
 * @param {string} [lobbyUsers.room] - user room
 * @param {array} users - others users in the room
 */
const Lobby = ({ user, users }) => {
  const [nbPlayer, setNbPlayer] = useState(users.length || 4)
  const [nbQuiz, setNbQuiz] = useState(users.length + 1)
  const [countdown, setCountdown] = useState(45)
  const [qcm, setQcm] = useState(true)
  const [randomQuiz, setRandomQuiz] = useState(true)
  const [streak, setStreak] = useState(true)
  const [invitedMessage, setInvitedMessage] = useState(false)

  /**
   * Start the game and emit options game to the server.
   *
   * @param {object} event - event
   */
  const startGame = () => {
    socket.emit('game:start', {
      nbPlayer, nbQuiz, countdown, randomQuiz, streak, qcm
    })
  }

  const copyToClipboard = (e) => {
    navigator.clipboard.writeText(window.location.href)
    e.target.focus()
    setInvitedMessage(true)
    setTimeout(() => {
      setInvitedMessage(false)
    }, 2000);
  }

  /**
   * Render all users in the lobby.
   */
  const renderUsers = () => {
    return (
      <div className="lobby-users-list">
        <h3> JOUEURS - {users.length} </h3>
        <div className="lobby-users--list-row">
          <div className="lobby-users--infos-list">
            <div className="lobby-users--name">
              <img src={user.img} alt="avatar" />
              {user.name}
            </div>
          </div>
          {users.map((user) =>
            user.id !== socket.id && (
              <div className="lobby-users--infos-list" key={user.id}>
                <div className="lobby-users--name">
                  <img src={user.img} alt="avatar" />
                  {user.name}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  /**
   * Render game options.
   */
  const renderOptions = () => {
    return (
      <div className="lobby-users-options">
        <h3> OPTIONS </h3>
        <div className="lobby-users-options-list">
          <div className="lobby-users-options-element">
            <h6> JOUEURS max. dans une partie</h6>
            <RangeSlider
              min={4}
              max={6}
              value={nbPlayer}
              onChange={(e) => setNbPlayer(Number(e.target.value))}
            />
          </div>
          <div className="lobby-users-options-element">
            <h6> nombre de quiz </h6>
            <RangeSlider
              min={users.length + 1}
              max={8}
              value={nbQuiz}
              onChange={(e) => setNbQuiz(Number(e.target.value))}
            />
          </div>
          <div className="lobby-users-options-element">
            <h6> durée d'un quiz </h6>
            <RangeSlider
              min={10}
              max={150}
              value={countdown}
              onChange={(e) => setCountdown(Number(e.target.value))}
            />
          </div>
          <div className="lobby-users-options-element">
            <h6> utilisation de la streak </h6>
            <div className="toggle-lobby-container" style={{ top: 0 }}>
              <input
                type="checkbox"
                id="toggle-lobby-streak"
                onClick={() => setStreak(!streak)}
              />
              <label className="lobby-toggle-label" htmlFor="toggle-lobby-streak"></label>
            </div>
          </div>
          <div className="lobby-users-options-element">
            <h6> quiz aléatoire </h6>
            <div className="toggle-lobby-container" style={{ top: 0 }}>
              <input
                type="checkbox"
                id="toggle-lobby-random"
                onClick={() => setRandomQuiz(!randomQuiz)}
              />
              <label className="lobby-toggle-label" htmlFor="toggle-lobby-random"></label>
            </div>
          </div>
          <div className="lobby-users-options-element">
            <h6> QCM </h6>
            <div className="toggle-lobby-container" style={{ top: 0 }}>
              <input
                type="checkbox"
                id="toggle-lobby-qcm"
                onClick={() => setQcm(!qcm)}
              />
              <label className="lobby-toggle-label" htmlFor="toggle-lobby-qcm"></label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const onReturnHome = () => {
    window.location = "/"
  }

  return (
    <>
      <div className="lobby-screen">
        {(user && users) ? (
          <div className="div-lobby">
            <h3 className="lobby--title" onClick={() => onReturnHome()}>
              Jijou-Quiz
            </h3>
            <div className="lobby--container">
              {renderOptions()}
              {renderUsers()}
            </div>

            <div className="lobby-start-game">
              <button onClick={(e) => startGame(e)}> LANCER LA PARTIE </button>
              <button
                className="lobby--invite-btn"
                onClick={(e) => copyToClipboard(e)}>
                INVITER {invitedMessage && <span> copié </span>}
              </button>
            </div>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </>
  )
}

export default Lobby
