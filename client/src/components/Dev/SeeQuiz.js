import React, { useState, useEffect } from 'react'
import { ENDPOINT } from '../../config/endpoint'
import { fetchWrapper } from '../constants/fetch'

import './Dev.css'

const SeeQuiz = () => {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  // const [error, setError] = useState('')

  useEffect(() => {
    if (!loading) {
      setLoading(!loading)
      fetchWrapper
        .get(`${ENDPOINT}/list-quiz`)
        .then((data) => {
          setQuestions(data)
        })
        .catch((error) => console.warn(error))
    }
  }, [loading])

  const renderQuiz = () => {
    return (
      <>
        <div
          className="quiz-container"
          style={{ width: '100%', height: '80%' }}
        >
          {questions &&
            Array.isArray(questions) &&
            questions.map((q, index) => (
              <div key={index} className="quiz-element">
                {' '}
                <p> {q.title} </p>{' '}
              </div>
            ))}
        </div>
      </>
    )
  }

  return <>{renderQuiz()}</>
}

export default SeeQuiz
