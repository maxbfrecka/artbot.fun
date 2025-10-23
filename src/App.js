import logo from "./logo.svg"
import "./App.scss"
import Poem from "./Components/Poem"
import Art from "./Components/Art"
import React, { useState, useEffect, useRef } from "react"
import artbotlogo from "./images/artbot logo.png"
import { AiFillAliwangwang } from "react-icons/ai"
import "./Styles/modal.scss"

function App() {
  // incrementing counter triggers children to refresh
  const [showModal, setShowModal] = useState(true)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const nextTickRef = useRef(0)

  // interval length (ms). use 10000 (10s) for testing, set to 600000 for 10min.
  const ms = 60000 * 10

  useEffect(() => {
    // Check if user has seen modal yet
    const hasVisited = localStorage.getItem("hasVisited")
    if (!hasVisited) {
      setShowModal(true)
      localStorage.setItem("hasVisited", "true")
    }

    // initial tick setup
    setRefreshCounter((c) => c + 1)
    nextTickRef.current = Date.now() + ms
    setRemainingMs(ms)

    const refreshInterval = setInterval(() => {
      setRefreshCounter((c) => c + 1)
      // schedule next tick
      nextTickRef.current = Date.now() + ms
      setRemainingMs(ms)
    }, ms)

    // update remaining time every 250ms (or 1000ms)
    const countdownInterval = setInterval(() => {
      setRemainingMs(Math.max(0, nextTickRef.current - Date.now()))
    }, 250)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
    }
  }, []) // run once on mount

  const handleRandomizeClick = (e) => {
    e.preventDefault()
    setRefreshCounter((c) => c + 1)
    // schedule next tick
    nextTickRef.current = Date.now() + ms
    setRemainingMs(ms)
  }

  // format minutes:seconds
  const minutes = Math.floor(remainingMs / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)
  const timeString = `${minutes}:${String(seconds).padStart(2, "0")}`

  return (
    <>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              Welcome to <strong>artbot.fun</strong>!
            </h2>
            <p>
              For the best experience, please use <strong>Google Chrome</strong>
              . The text to speech functionality may not work properly in other
              browsers.
              <br />
              <br />
              Generating audio for longer poems is not recommended. <br />
              <br />
              Use the PoetBot icon beneath the poem for poetry analysis. <br />
              <br />
              Press the randomization icon in the top right to refresh poem &
              art.
              <br /> <br />
              <strong> Enjoy exploring!</strong>
            </p>
            <button onClick={() => setShowModal(false)}>Got it!</button>
          </div>
        </div>
      )}
      <div className="App">
        <div className="top"></div>
        <div className="pagecontainer">
          <div className="header">
            <div className="logoAndText">
              <img className="logo" src={artbotlogo} />
              <div className="logoText">by dogamedia</div>
            </div>
            <div className="timer">
              Next refresh in: <span className="timeString">{timeString} </span>
              <AiFillAliwangwang
                className="randomizeButton"
                onClick={handleRandomizeClick}
              />
            </div>
          </div>
          <div className="contentcontainer">
            <Art refresh={refreshCounter} />
            <Poem refresh={refreshCounter} />
          </div>
        </div>
        <div className="bottom"></div>
      </div>
    </>
  )
}

export default App
