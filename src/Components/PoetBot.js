import React, { useState, useEffect, useRef } from "react"
import { FaLightbulb } from "react-icons/fa"
import { IoLogoOctocat } from "react-icons/io"
import { FaCat } from "react-icons/fa"
import { PiDogFill } from "react-icons/pi"
import { MdSpatialAudioOff } from "react-icons/md"
import { BsFillSignStopFill } from "react-icons/bs"

export default function PoetBot({ title, poet, lines }) {
  //prevents useEffect from running twice in StrictMode
  const didMountRef = useRef(false)
  const [poetBotResponse, setPoetBotResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)

  useEffect(() => {
    if (!didMountRef.current) {
      // First mount — just mark as mounted, don’t reset
      didMountRef.current = true
      return
    }
    // Runs on later changes to title/poet/lines
    setPoetBotResponse(null)
  }, [title, poet, lines])

  const PoetBot = async (title, poet, lines) => {
    setLoading(true)
    setPoetBotResponse(null)
    console.log("calling poetbot")

    // Truncate lines to first 200 words to fit in Lambda payload limit
    const truncatedLines = truncateToWords(lines, 450)

    const response = await fetch(
      "https://i76rczicem43ribpgiczbetgue0ugawn.lambda-url.us-east-1.on.aws/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, poet, lines }),
      }
    )

    const data = await response.json()
    console.log("Lambda response:", data)
    setPoetBotResponse(data.result)
    setLoading(false)
    return data.result
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    PoetBot(title, poet, lines)
  }

  function readAnalysis(analysisText) {
    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser does not support text to speech!")
      return
    }
    function speakWhenReady(attempt = 0) {
      const voices = window.speechSynthesis.getVoices()
      const googleVoice = voices.find(
        (v) => v.name === "Google UK English Male"
      )
      // If voices not yet loaded and we haven’t tried too long, retry
      if (voices.length === 0 && attempt < 10) {
        return setTimeout(() => speakWhenReady(attempt + 1), 200)
      }
      const utterance = new SpeechSynthesisUtterance(analysisText)
      utterance.voice =
        googleVoice || voices.find((v) => v.default) || voices[0]
      utterance.rate = 1.1
      utterance.pitch = 1.0
      utterance.volume = 1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      setAudioPlaying(true)
      utterance.onend = () => setAudioPlaying(false)
    }
    window.speechSynthesis.cancel()
    speakWhenReady()
  }

  function stopPlayback() {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    setAudioPlaying(false)
  }

  return (
    <div className="poetBotContainer">
      {!poetBotResponse && !loading && (
        <FaLightbulb className="poetBotButton" onClick={handleSubmit} />
      )}
      {loading ? (
        <div className="poetBotLoadingContainer">
          <IoLogoOctocat className="poetBotLoading" />
          <IoLogoOctocat className="poetBotLoading" />
          <IoLogoOctocat className="poetBotLoading" />
          <IoLogoOctocat className="poetBotLoading" />
          <IoLogoOctocat className="poetBotLoading" />
        </div>
      ) : null}
      {poetBotResponse ? (
        <>
          <div className="poetBotResponse">
            {!audioPlaying && (
              <MdSpatialAudioOff
                className="readAnalysis"
                onClick={() => readAnalysis(poetBotResponse)}
              />
            )}
            {audioPlaying ? (
              <BsFillSignStopFill
                className="stopReadingAnalysis"
                onClick={stopPlayback}
              />
            ) : null}
            {poetBotResponse}
          </div>
        </>
      ) : null}
    </div>
  )
}

//helper
function truncateToWords(str, maxWords) {
  // Return the original string if it's empty or null
  if (!str) {
    return ""
  }

  // Split the string into an array of words
  const words = str.split(" ")

  // If the word count is less than or equal to the limit, return the original string
  if (words.length <= maxWords) {
    return str
  }

  // Take the first 'maxWords' words and join them back into a string
  const truncatedWords = words.slice(0, maxWords)
  const truncatedString = truncatedWords.join(" ")

  return truncatedString
}
