import React, { useState, useEffect, useRef } from "react"
import poets from "./Helpers/poets.json"
import { FcGoogle } from "react-icons/fc"
import PoetBot from "./PoetBot"
import { MdSpatialAudioOff } from "react-icons/md"
import { BsFillSignStopFill } from "react-icons/bs"
import PoemTTS from "./PoemTTS"

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
      fetchAPoem()
      return
    }
    didMountRef.current = true
    fetchAPoem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh])

  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log("Voices loaded:", window.speechSynthesis.getVoices())
    }
  }, [])

  //use randomly one of two poem sources
  function fetchAPoem() {
    if (Math.random() < 0.5) {
      fetchRandomAllPoetryPoem()
    } else {
      fetchPoemsAndPoem()
    }
  }

  // example inside a component or util file
  const fetchRandomAllPoetryPoem = async () => {
    try {
      const res = await fetch(
        "https://tdl6sg2qtho4jv5oxjnymluurq0vpewz.lambda-url.us-east-1.on.aws/",
        { method: "GET" }
      )

      if (!res.ok) {
        throw new Error(`HTTP error! ${res.status}`)
      }

      const data = await res.json()
      // data = { poet, title, poem_text, ai_analysis? }
      setAuthor(data.poet)
      setPoemTitle(data.title)
      setLines(data.poem_text)
      return data
    } catch (err) {
      console.error("Failed to fetch poem:", err)
      return null
    }
  }

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

  return (
    <div class="poemgrid">
      <div class="poem">
        <div class="poemtitle">
          {poemTitle}{" "}
          {/* {audioPlaying ? (
            <BsFillSignStopFill
              className="stopReading"
              onClick={stopPlayback}
            />
          ) : (
            <MdSpatialAudioOff
              className="readPoem"
              onClick={() => readPoemAloud(lines)}
            />
          )} */}
          <PoemTTS title={poemTitle} poet={author} lines={lines} />
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
