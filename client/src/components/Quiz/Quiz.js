import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import queryString from 'query-string'

import socket from '../../config/socket'

import Lobby from '../Lobby/Lobby'
import Profile from '../Profile/Profile'
import Game from '../Game/Game'

const PROFILE_STATE = 0
const LOBBYSTATE = 1
const GAMESTATE = 2

const Quiz = ({ location }) => {
  const [gameState, setGameState] = useState({})
  const [users, setUsers] = useState([])
  const [user, setUser] = useState({})
  const [lobbyChecked, setLobbyChecked] = useState(false)
  const [playState, setPlayState] = useState(LOBBYSTATE)
  const [options, setOptions] = useState({})
  const [winner, setWinner] = useState(null)

  const onFullscreen = () => {
    const elem = document.getElementById('game-container-id')

    // Firefox
    if (document.mozFullScreenEnabled) {
      if (!document.mozFullScreenElement) {
        elem.mozRequestFullScreen()
      } else {
        document.mozCancelFullScreen()
      }
    }

    if (document.fullscreenElement) {
      if (!document.fullscreenElement) {
        elem.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }

    // Safari
    if (document.webkitFullscreenEnabled) {
      if (!document.webkitFullscreenElement) {
        elem.webkitRequestFullscreen()
      } else {
        document.webkitExitFullscreen()
      }
    }

    // Edge
    if (document.msFullscreenEnabled) {
      if (!document.msFullscreenElement) {
        elem.msRequestFullscreen()
      } else {
        document.msExitFullscreen()
      }
    }
  }

  useEffect(() => {
    socket.on('lobby:create-response', ({ user }) => {
      if (user === undefined || !(user.roomId || user.name))
        return <Redirect to="/" />

      setUser(user)
      setUsers([...users, user])
      setPlayState(LOBBYSTATE)
    })
  })

  useEffect(() => {
    socket.on(
      'lobby:join-response-user',
      ({ user, users, gameStarted, gameState, options }) => {
        setUser(user)
        setUsers(users)
        setPlayState(gameStarted ? GAMESTATE : LOBBYSTATE)
        if (gameStarted) {
          setGameState(gameState)
          setOptions(options)
        }
      }
    )
  }, [])

  useEffect(() => {
    socket.on('lobby:join-response-all', ({ users }) => {
      setUsers(users)
    })
  })

  useEffect(() => {
    const { room } = queryString.parse(location.search)
    if (!lobbyChecked && room) {
      socket.emit('lobby:check', { room })
      socket.on('lobby:check-response', ({ error, roomExist, userExist }) => {
        if (error) window.location.href = '/'
        else {
          let state = null
          if (roomExist && userExist) state = LOBBYSTATE
          else state = PROFILE_STATE
          setPlayState(state)
          setLobbyChecked(true)
        }
      })
    }
  }, [location.search, lobbyChecked])

  useEffect(() => {
    socket.on('game:new-game', ({ users, gameState, options }) => {
      setWinner(null)
      setUser(users.find((user) => user.id === socket.id))
      setUsers(users)
      setGameState((prevGameState) => ({
        ...prevGameState,
        ...gameState,
      }))
      setOptions(options)
      setPlayState(GAMESTATE)
    })
  }, [])

  useEffect(() => {
    socket.on('game:new-round', ({ users, gameState }) => {
      setUser(users.find((user) => user.id === socket.id))
      setUsers(users)
      setGameState((prevGameState) => ({
        ...prevGameState,
        ...gameState,
      }))
    })
  }, [])

  /**
   * Update users actions.
   */
  useEffect(() => {
    socket.on('game:update-action-response', ({ users, gameState }) => {
      setGameState((prevGameState) => ({ ...prevGameState, ...gameState }))
      setUser(users.find((u) => u.id === socket.id))
      setUsers(users)
    })
  }, [])

  useEffect(() => {
    socket.on('game:select-theme-response', ({ users, gameState }) => {
      setUser(users.find((u) => u.id === socket.id))
      setUsers(users)
      setGameState((prevGameState) => ({
        ...prevGameState,
        ...gameState,
      }))
    })
  }, [])

  useEffect(() => {
    socket.on('game:answer-qcm-response', ({ users, gameState }) => {
      setTimeout(() => {
        setUser(users.find((u) => u.id === socket.id))
        setUsers(users)
        setGameState((prevGameState) => ({
          ...prevGameState,
          ...gameState,
        }))
      }, 1000)
    })
  }, [])

  useEffect(() => {
    socket.on('game:answer-text-response', ({ users, gameState }) => {
      setTimeout(() => {
        setUser(users.find((u) => u.id === socket.id))
        setUsers(users)
        setGameState((prevGameState) => ({
          ...prevGameState,
          ...gameState,
        }))
      }, 1000)
    })
  }, [])

  useEffect(() => {
    socket.on('game:return-lobby-response', () => {
      setPlayState(LOBBYSTATE)
    })
  }, [])

  useEffect(() => {
    socket.on('game:end-game', ({ users }) => {
      setTimeout(() => {
        setUsers(users)
        setWinner(users[0])
      }, 500)
    })
  }, [])

  useEffect(() => {
    socket.on('game:disconnect', ({ users }) => {
      setUsers(users)
    })
  }, [])

  return (
    <>
      {playState === PROFILE_STATE ? (
        <Profile location={location} warn/>
      ) : playState === LOBBYSTATE ? (
        <Lobby location={location} user={user} users={users} />
      ) : (
        <Game
          socket={socket}
          users={users}
          gameState={gameState}
          onFullscreen={onFullscreen}
          winner={winner}
          options={options}
        />
      )}
    </>
  )
}

export default Quiz
