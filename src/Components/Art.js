import React, { useState, useEffect, useRef } from "react"
import { HiOutlineArrowCircleDown } from "react-icons/hi"
import { FcGoogle } from "react-icons/fc"

export default function Art({ refresh }) {
  // prevent duplicate state-updates from overlapping fetches
  const didMountRef = useRef(false)
  const abortRef = useRef(null)

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState(null)
  const [searchTerm, setSearchTerm] = useState("hat")
  const [artworkData, setArtworkData] = useState(null)

  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Only attempt to avoid the StrictMode double-call in dev.
    // We still allow the effect to run whenever `refresh` changes.
    if (!didMountRef.current) {
      didMountRef.current = true
      fetchData()
      return
    }
    fetchData()
    // eslint-disable-next-line
  }, [refresh])

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    fetchData()
  }

  const fetchData = async () => {
    // cancel any previous in-flight requests
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const styleTerms = [
        "contemporary",
        "21st Century",
        "20th Century",
        "19th century", //lowecase c in their API
        "18th Century",
      ]
      const randomStyle =
        styleTerms[Math.floor(Math.random() * styleTerms.length)]
      console.log("random style: " + randomStyle)

      const styleTerm = encodeURIComponent(randomStyle)
      //const styleTerm = encodeURIComponent("test");
      const baseUrl = `https://api.artic.edu/api/v1/artworks/search?query[term][style_titles.keyword]=${styleTerm}&fields=id,api_link,title,artist_title,date_display,style_titles,image_id&limit=1`
      console.log("search url: " + baseUrl)

      const response = await fetch(baseUrl, {
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const json = await response.json()
      console.log("search json:", json)

      const pages = json.pagination?.total_pages || 1
      const totalart = json.pagination?.total || json.data?.length || 0
      console.log(`There are ${totalart} artworks over ${pages} pages`)

      //restrict pages to max 1000 due to API limit
      const limitedPages = Math.min(pages, 1000)

      // Get a random page and fetch that page
      //NOTE: the API seems to only return 1000 results max, even if total is higher
      //so we limit the random page to 1000 / limit (1 per page) = 1000 pages max
      //https://api.artic.edu/docs/#pagination
      const randomPage = Math.floor(Math.random() * limitedPages) + 1
      console.log(`Fetching page ${randomPage}`)
      const pageResponse = await fetch(baseUrl + `&page=${randomPage}`, {
        signal: controller.signal,
      })
      if (!pageResponse.ok) {
        throw new Error(`HTTP error! status: ${pageResponse.status}`)
      }
      const pageJson = await pageResponse.json()
      console.log("page json:", pageJson)

      const items = pageJson.data || []
      if (items.length === 0) {
        throw new Error("No artworks found on page")
      }

      // Use the pageJson items directly (avoid stale state)
      // const randomIndex = Math.floor(Math.random() * items.length);
      // const randomArtwork = items[randomIndex];
      // console.log("selected artwork:", randomArtwork);
      //randomizing the artwork is not necessary, just get the index. we are using pages for randomization above due to limits
      const randomArtwork = items[0]
      console.log("selected artwork:", randomArtwork)

      const apiLink = randomArtwork.api_link
      if (!apiLink) {
        throw new Error("Selected artwork has no api_link")
      }

      const artworkResp = await fetch(apiLink, {
        signal: controller.signal,
      })
      if (!artworkResp.ok) {
        throw new Error(`HTTP error! status: ${artworkResp.status}`)
      }
      const artworkjson = await artworkResp.json()
      console.log("artwork json:", artworkjson)

      setArtworkData(artworkjson)
      const imageId = artworkjson.data?.image_id
      if (imageId) {
        setImageUrl(
          `https://www.artic.edu/iiif/2/${imageId}/full/843,/0/default.jpg`
        )
      } else {
        //if no imageId, try fetching again
        setImageUrl(null)
        console.log("No image URL found, retrying fetch")
        fetchData()
        return
      }

      // set data for debugging/UI if you want
      setData(pageJson)
    } catch (err) {
      if (err.name === "AbortError") {
        // request was cancelled — ignore
        return
      }
      console.error("fetching failed", err)
      setError(err)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  return (
    <div className="artcontainer">
      {/* <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form> */}

      {loading ? <p>Loading...</p> : null}
      {/* {error ? <p>Error: {error.message}</p> : null} */}

      {imageUrl ? (
        <>
          <img
            className="artimage"
            src={imageUrl}
            alt="artwork"
            style={{ cursor: "zoom-in" }}
            onClick={() => setShowModal(true)}
          />
          {showModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              onClick={() => setShowModal(false)}
            >
              <img
                src={imageUrl}
                alt="artwork zoomed"
                style={{
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                  boxShadow: "0 0 20px #fff",
                }}
              />
            </div>
          )}
        </>
      ) : (
        <p>No image</p>
      )}

      {artworkData ? (
        <div className="artinfo">
          <div className="titleAndDownload">
            <div className="artTitle">
              {artworkData.data.title}{" "}
              <HiOutlineArrowCircleDown
                className="downloadImage"
                onClick={async () => {
                  if (!artworkData || !imageUrl) return
                  const artist =
                    artworkData.data.artist_title?.replace(
                      /[^a-z0-9]/gi,
                      "_"
                    ) || "artist"
                  const title =
                    artworkData.data.title?.replace(/[^a-z0-9]/gi, "_") ||
                    "artwork"
                  const filename = `${artist}_${title}.jpg`

                  try {
                    const response = await fetch(imageUrl)
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)

                    const link = document.createElement("a")
                    link.href = url
                    link.download = filename
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                  } catch (err) {
                    alert("Failed to save image.")
                  }
                }}
              />
            </div>
          </div>
          <div className="nameAndGoogle">
            <div
              className="artistName"
              style={{
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => {
                const artist = artworkData.data.artist_title
                if (!artist) return
                const formatted = artist.toLowerCase().replace(/\s+/g, "-")
                window.open(`https://www.wikiart.org/en/${formatted}`, "_blank")
              }}
            >
              {artworkData.data.artist_title}
            </div>
            <FcGoogle
              className="googleArtist"
              style={{ cursor: "pointer", marginLeft: "10px" }}
              onClick={() => {
                const artist = artworkData.data.artist_title
                if (!artist) return
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(
                    artist
                  )}`,
                  "_blank"
                )
              }}
            />
          </div>

          <div>
            ({artworkData.data.date_end}) ({artworkData.data.place_of_origin}) (
            {artworkData.data.artwork_type_title})
          </div>
          <div className="artdescription">{artworkData.data.description}</div>
        </div>
      ) : (
        <p>No data</p>
      )}
    </div>
  )
}
