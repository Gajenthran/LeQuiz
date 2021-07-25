import React, { useState } from 'react'
import { ENDPOINT } from '../../config/endpoint'
import { fetchWrapper } from '../constants/fetch'
import { IMGS } from '../constants/images'

import './Dev.css'

const QUIZ_STATE = {
  title: 1,
  questions: 2,
  sent: 3,
}

const QUESTIONS = [
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
  {
    question: '',
    response: [''],
    qcm: new Array(4).fill(''),
  },
]
const TITLE_LIMIT = 30
const QUESTION_LIMIT = 70
const REP_LIMIT = 55
const NB_QUESTIONS = QUESTIONS.length

const CreateQuiz = () => {
  const [quizState, setQuizState] = useState(QUIZ_STATE['title'])
  const [title, setTitle] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState(0)
  const [questions, setQuestions] = useState(QUESTIONS)
  const [error, setError] = useState('')

  const onStartQuiz = () => {
    if (TITLE_LIMIT - title.length > 0) setQuizState(QUIZ_STATE['questions'])
  }

  const renderTitle = () => {
    return (
      <div className="dev-create-title-container">
        <p className="dev-req"> Veuillez entrez le titre du quiz </p>
        <div className="dev-create-title">
          <textarea
            type="text"
            value={title}
            placeholder="Entrez le titre du quiz"
            onChange={(e) => setTitle(e.target.value)}
          />
          <p
            className="dev-create-title-limit"
            style={{
              color: TITLE_LIMIT - title.length > 0 ? 'black' : '#f12e2e',
            }}
          >
            {TITLE_LIMIT - title.length}
          </p>
        </div>
        <div className="dev-btn" onClick={() => onStartQuiz()}>
          COMMENCER LE QUIZ
        </div>
      </div>
    )
  }

  const onChangeQuestion = (e) => {
    const { value } = e.target

    const questions_ = [...questions]
    questions_[selectedQuestion].question = value
    setQuestions(questions_)
  }

  const onAddResponse = () => {
    const questions_ = [...questions]

    questions_[selectedQuestion].response = [
      ...questions_[selectedQuestion].response,
      '',
    ]
    setQuestions(questions_)
  }

  const onChangeResponse = (e, index) => {
    const questions_ = [...questions]

    questions_[selectedQuestion]['response'][index] = e.target.value
    setQuestions(questions_)
  }

  const onChangeQCM = (e, index) => {
    const questions_ = [...questions]

    questions_[selectedQuestion].qcm[index] = e.target.value
    setQuestions(questions_)
  }

  const onSubmitQuiz = () => {
    fetchWrapper
      .post(`${ENDPOINT}/submit-quiz`, { quiz: { title, questions } })
      .then((data) => {
        setTitle('')
        const q = [...QUESTIONS]
        setQuestions(q)
        setSelectedQuestion(0)
        setQuizState(QUIZ_STATE['title'])
        window.location = '/dev'
      })
      .catch((error) => setError(error))
    // socket.emit('dev:send-quiz')
  }

  const renderQuiz = () => {
    return (
      <div className="dev-create-title-container">
        <div className="selected-quiz-container">
          <div className="selected-quiz">
            <p> {title} </p>
          </div>
          <div className="submit-quiz" onClick={() => onSubmitQuiz()}>
            <img src={IMGS['sent']} alt="sent" />
          </div>
        </div>
        <div className="dev-category-container">
          <p className="dev-category-title"> QUESTION </p>
          <div className="dev-category-question">
            <input
              value={questions[selectedQuestion].question}
              placeholder="Entrez la question..."
              onChange={(e) => onChangeQuestion(e)}
            />
            <p
              className="dev-category-question-limit"
              style={{
                color:
                  QUESTION_LIMIT - questions[selectedQuestion].question.length >
                  0
                    ? 'black'
                    : '#f12e2e',
              }}
            >
              {QUESTION_LIMIT - questions[selectedQuestion].question.length}
            </p>
          </div>
        </div>
        <div className="dev-category-container">
          <p className="dev-category-title"> REPONSE(S) </p>
          <div className="dev-category-responses">
            {questions[selectedQuestion].response.map((answer, index) => (
              <div key={index} className="dev-category-response">
                <input
                  value={answer}
                  placeholder="Entrez une réponse..."
                  onChange={(e) => onChangeResponse(e, index)}
                />
                <p
                  className="dev-category-question-limit"
                  style={{
                    color: REP_LIMIT - answer.length > 0 ? 'black' : '#f12e2e',
                  }}
                >
                  {REP_LIMIT - answer.length}
                </p>
              </div>
            ))}
            {questions[selectedQuestion].response.length < 6 && (
              <button onClick={() => onAddResponse()}> + </button>
            )}
          </div>
        </div>
        <div className="dev-category-container">
          <p className="dev-category-title"> QCM </p>
          <div className="dev-category-qcm">
            {questions[selectedQuestion].qcm.map((q, index) => (
              <textarea
                key={index}
                value={q}
                placeholder={`OPTION ${index + 1}`}
                onChange={(e) => onChangeQCM(e, index)}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderArrows = () => {
    return (
      <div className="quiz-arrows">
        <img
          className="arrow-left"
          src={IMGS['leftArrow']}
          alt="arrow-left"
          onClick={() =>
            setSelectedQuestion(
              selectedQuestion - 1 < 0 ? NB_QUESTIONS - 1 : selectedQuestion - 1
            )
          }
        />
        <img
          className="arrow-right"
          src={IMGS['rightArrow']}
          alt="arrow-right"
          onClick={() =>
            setSelectedQuestion((selectedQuestion + 1) % NB_QUESTIONS)
          }
        />
      </div>
    )
  }

  const renderPage = () => {
    return (
      <div className="timer-container">
        {' '}
        PAGE {selectedQuestion + 1}/{NB_QUESTIONS}{' '}
      </div>
    )
  }

  const renderError = () => {
    return <div className="error-container"> {error} </div>
  }

  return (
    <>
      {quizState === QUIZ_STATE['title'] && renderTitle()}
      {quizState === QUIZ_STATE['questions'] && renderQuiz()}
      {quizState === QUIZ_STATE['questions'] && renderArrows()}
      {quizState === QUIZ_STATE['questions'] && renderPage()}
      {(quizState === QUIZ_STATE['questions'] && error) && renderError()}
    </>
  )
}

export default CreateQuiz
