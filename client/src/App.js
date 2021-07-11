import React from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import Home from './components/Home/Home'
import Quiz from './components/Quiz/Quiz'
import Dev from './components/Dev/Dev'

import './assets/css/index.css'

/**
 * App component which is the principal
 * component, with all paths.
 */
const App = () => {
  return (
    <>
      <Router>
        <Route path="/" exact component={Home} />
        <Route path="/game" component={Quiz} />
        <Route path="/dev" component={Dev} />
      </Router>
    </>
  )
}

export default App
