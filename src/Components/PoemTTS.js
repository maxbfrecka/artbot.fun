import React, { useState, useEffect, useRef } from "react"
import { FaLightbulb } from "react-icons/fa"
import { IoLogoOctocat } from "react-icons/io"
import { FaCat } from "react-icons/fa"
import { PiDogFill } from "react-icons/pi"
import { MdSpatialAudioOff } from "react-icons/md"
import { BsFillSignStopFill } from "react-icons/bs"

export default function PoemTTS({ title, poet, lines }) {
  //prevents useEffect from running twice in StrictMode
  const didMountRef = useRef(false)
  const [TTSResponse, setTTSResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const [audioPlaying, setAudioPlaying] = useState(false)

  // keep this outside the function so both play/stop can see it
  let currentAudio = null

  useEffect(() => {
    if (!didMountRef.current) {
      // First mount — just mark as mounted, don’t reset
      didMountRef.current = true
      return
    }
    // Runs on later changes to title/poet/lines
    setTTSResponse(null)
  }, [title, poet, lines])

  const FormatTTS = async (title, poet, lines, wordlimit = 500) => {
    setLoading(true)
    setTTSResponse(null)
    console.log("calling TTS formatter")

    // truncate lines if too long
    const truncatedLines = truncateToWords(lines, wordlimit)

    const response = await fetch(
      "https://7yoo2uxbqwjbdq5m7umkf3jqnu0lybwl.lambda-url.us-east-1.on.aws/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, poet, lines: truncatedLines }),
      }
    )

    const data = await response.json()
    console.log("Lambda response:", data)
    let finalLines = data.result

    console.log("Final formatted TTS lines:", finalLines)
    setTTSResponse(finalLines)
    setLoading(false)
    return finalLines
  }

  //specialized function for use with ElevenLabs
  const FormatTTSElevenLabs = async (title, poet, lines, wordlimit = 500) => {
    setLoading(true)
    setTTSResponse(null)
    console.log("calling Eleven Labs TTS formatter")

    // truncate lines if too long
    const truncatedLines = truncateToWords(lines, wordlimit)

    const response = await fetch(
      "https://enz5qscq63ayvs6yrniy6dhwgm0ubtmu.lambda-url.us-east-1.on.aws/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, poet, lines: truncatedLines }),
      }
    )

    const data = await response.json()
    console.log("Lambda response:", data)
    let finalLines = data.result

    console.log("Final formatted TTS lines:", finalLines)
    setTTSResponse(finalLines)
    setLoading(false)
    return finalLines
  }

  function readPoemAloud(lines) {
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

      const utterance = new SpeechSynthesisUtterance(lines)
      utterance.voice =
        googleVoice || voices.find((v) => v.default) || voices[0]
      utterance.rate = 0.9
      utterance.pitch = 1.1
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
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setAudioPlaying(false)
      currentAudio = null
    }
    setAudioPlaying(false)
  }

  async function getElevenLabs(title, poet, lines, wordlimit = 500) {
    setLoading(true) // show spinner, hide play icon

    //truncate lines if too long
    const truncatedLines = truncateToWords(lines, wordlimit)

    try {
      console.log("calling Eleven Labs TTS API")
      const response = await fetch(
        "https://gxobpdah6xcfgzetwjxu7ljopu0wbybi.lambda-url.us-east-1.on.aws/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, poet, lines: truncatedLines }),
        }
      )
      console.log("Eleven Labs TTS response status:", response.status)
      const data = await response.json()
      console.log("Eleven Labs TTS response:", data)
      const audioBase64 = data.audioBase64

      // Convert Base64 → Blob → URL
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      )
      const audioUrl = URL.createObjectURL(audioBlob)
      console.log("Generated audio URL:", audioUrl)

      // const audio = new Audio(audioUrl)
      // audio.play()
      // setAudioPlaying(true)

      // audio.onplay = () => setLoading(false) // hide spinner, show playing icon
      // audio.onended = () => setAudioPlaying(false) // cleanup

      currentAudio = new Audio(audioUrl)
      currentAudio.play()
      setAudioPlaying(true)

      currentAudio.onplay = () => setLoading(false)

      currentAudio.onended = () => {
        setAudioPlaying(false)
        currentAudio = null
      }

      //ALTERNATIVE METHOD:
      // const audioUrl = `data:audio/mpeg;base64,${data.audioBase64}`;
      // const audio = new Audio(audioUrl);
      // audio.play();
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // If poem is too long, truncate and notify
    const words = lines.split(" ")
    if (words.length > 300) {
      //use browser voice for long poems
      let tts = await FormatTTS(title, poet, lines, 500)
      console.log("using browser TTS for long poem")
      readPoemAloud(tts)
    } else {
      //use Eleven Labs for short poems
      console.log("using Eleven Labs TTS")
      let tts = await FormatTTSElevenLabs(title, poet, lines, 500)
      getElevenLabs(title, poet, tts, 500)
    }
  }

  //
  //
  //
  //
  //
  //
  //
  //
  //

  return (
    <div className="TTSContainer">
      {/* <h1 onClick={() => getElevenLabs(title, poet, lines)}>
        PLAY ELEVEN LABS?
      </h1> */}
      {!TTSResponse && !loading && (
        <MdSpatialAudioOff className="readPoem" onClick={handleSubmit} />
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

      {audioPlaying ? (
        <BsFillSignStopFill className="stopReading" onClick={stopPlayback} />
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
  let truncatedString = truncatedWords.join(" ")
  truncatedString += `\n\n[Note: The original poem was longer than ${maxWords} words and has been truncated for TTS.]`

  return truncatedString
}
