import React, { useState, useEffect, useRef } from "react"
import poets from "./Helpers/poets.json"
import { FcGoogle } from "react-icons/fc"
import PoetBot from "./PoetBot"
import { MdSpatialAudioOff } from "react-icons/md"
import { BsFillSignStopFill } from "react-icons/bs"

export default function Poem({ refresh }) {
  //prevents useEffect from running twice in StrictMode
  const didMountRef = useRef(false)

  const [author, setAuthor] = useState("")
  const [poemTitle, setPoemTitle] = useState("")
  const [lines, setLines] = useState(null)

  const poetsJson = poets

  const [audioPlaying, setAudioPlaying] = useState(false)

  // run on mount and whenever `refresh` changes
  useEffect(() => {
    // avoid double-call from StrictMode during dev mount
    if (didMountRef.current) {
      // normal refresh (after first real mount)
      fetchPoemsAndPoem()
      return
    }
    didMountRef.current = true
    fetchPoemsAndPoem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh])

  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log("Voices loaded:", window.speechSynthesis.getVoices())
    }
  }, [])

  const fetchPoemsAndPoem = async () => {
    //get random poet name from poetsJson
    const randomPoet =
      poetsJson.authors[Math.floor(Math.random() * poetsJson.authors.length)]
    console.log("random poet: " + randomPoet)
    setAuthor(randomPoet)
    try {
      //get random poet's poem titles to use in next fetch
      const response = await fetch(
        `https://poetrydb.org/author/${randomPoet}/title`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const titles = await response.json()
      console.log(titles)
      const randomPoem = titles[Math.floor(Math.random() * titles.length)]
      console.log("random poem title: " + randomPoem.title)
      setPoemTitle(randomPoem.title)

      //fetch random poem by title
      fetchRandomPoem(randomPoem)
    } catch (error) {
      console.log("fetching author's poems failed")
      console.log(error)
    }
  }

  const fetchRandomPoem = async (randomPoem) => {
    console.log("fetching random poem from author's poems:")
    try {
      const res = await fetch("https://poetrydb.org/title/" + randomPoem.title)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const poem = await res.json()
      console.log(poem)
      setLines(poem[0].lines.join("\n"))
    } catch (error) {
      console.log("fetching poem failed")
      console.log(error)
    }
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    fetchPoemsAndPoem()
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
    setAudioPlaying(false)
  }

  return (
    <div class="poemgrid">
      <div class="poem">
        <div class="poemtitle">
          {poemTitle}{" "}
          {audioPlaying ? (
            <BsFillSignStopFill
              className="stopReading"
              onClick={stopPlayback}
            />
          ) : (
            <MdSpatialAudioOff
              className="readPoem"
              onClick={() => readPoemAloud(lines)}
            />
          )}
        </div>
        <div class="poemauthor">{author}</div>
        <FcGoogle
          className="googlePoet"
          onClick={() => {
            if (!author) return
            window.open(
              `https://www.google.com/search?q=${encodeURIComponent(author)}`,
              "_blank"
            )
          }}
        />
        <div
          class="poemtext"
          style={{ whiteSpace: "pre-wrap", marginTop: "1em" }}
        >
          {lines}

          {lines ? (
            <PoetBot title={poemTitle} poet={author} lines={lines} />
          ) : null}
        </div>
      </div>
      <div class="poembar"></div>
    </div>
  )
}
