import React, { useState } from 'react'

import './Dev.css'
import CreateQuiz from './CreateQuiz'
import SeeQuiz from './SeeQuiz'

const Dev = () => {
  const [createQuiz, setCreateQuiz] = useState(false)
  const [seeQuiz, setSeeQuiz] = useState(false)

  const onReturnHome = () => {
    setCreateQuiz(false)
    setSeeQuiz(false)
    window.location = '/'
  }

  const onCreateQuiz = () => {
    setCreateQuiz(true)
    setSeeQuiz(false)
  }

  const onSeeQuiz = () => {
    setSeeQuiz(true)
    setCreateQuiz(false)
  }

  return (
    <>
      <div className="home-screen">
        <div className="div-home">
          {!createQuiz && !seeQuiz && (
            <div className="home--container">
              <h3 className="home--title" onClick={() => onReturnHome()}>
                Jijou-Quiz
              </h3>
              <div className="dev-options-container">
                <div className="dev-btn" onClick={() => onCreateQuiz()}>
                  {' '}
                  CREER UN QUIZ{' '}
                </div>
                <div className="dev-btn" onClick={() => onSeeQuiz()}>
                  {' '}
                  VISIONNER LES QUIZ{' '}
                </div>
                <div className="dev-btn" onClick={() => onReturnHome()}>
                  {' '}
                  RETOUR{' '}
                </div>
              </div>
            </div>
          )}

          {createQuiz && <CreateQuiz />}
          {seeQuiz && <SeeQuiz />}
        </div>
      </div>
    </>
  )
}

export default Dev
