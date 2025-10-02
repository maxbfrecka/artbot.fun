import logo from "./logo.svg"
import "./App.css"
import Poem from "./Components/Poem"
import Art from "./Components/Art"
import React, { useState, useEffect, useRef } from "react"

function App() {
  // incrementing counter triggers children to refresh
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const nextTickRef = useRef(0)

  // interval length (ms). use 10000 (10s) for testing, set to 600000 for 10min.
  const ms = 60000 * 10

  useEffect(() => {
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
    <div className="pagecontainer">
      <div className="timer">
        Next refresh in: {timeString}{" "}
        <div className="randomizeButton" onClick={handleRandomizeClick}></div>
      </div>
      <div className="contentcontainer">
        <Art refresh={refreshCounter} />
        <Poem refresh={refreshCounter} />
      </div>
    </div>
  )
}

export default App
