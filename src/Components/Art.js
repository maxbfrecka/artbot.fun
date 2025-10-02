import React, { useState, useEffect, useRef } from "react"

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
      const styleTerm = encodeURIComponent("contemporary")
      const baseUrl = `https://api.artic.edu/api/v1/artworks/search?query[term][style_titles.keyword]=${styleTerm}&fields=id,api_link,title,artist_title,date_display,style_titles,image_id&limit=12`
      console.log("search url: " + baseUrl)

      const response = await fetch(baseUrl, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const json = await response.json()
      console.log("search json:", json)

      const pages = json.pagination?.total_pages || 1
      const totalart = json.pagination?.total || json.data?.length || 0
      console.log(`There are ${totalart} artworks over ${pages} pages`)

      // Get a random page and fetch that page
      const randomPage = Math.floor(Math.random() * pages) + 1
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
      const randomIndex = Math.floor(Math.random() * items.length)
      const randomArtwork = items[randomIndex]
      console.log("selected artwork:", randomArtwork)

      const apiLink = randomArtwork.api_link
      if (!apiLink) {
        throw new Error("Selected artwork has no api_link")
      }

      const artworkResp = await fetch(apiLink, { signal: controller.signal })
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
        setImageUrl(null)
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
      {error ? <p>Error: {error.message}</p> : null}

      {imageUrl ? (
        <img className="artimage" src={imageUrl} alt="artwork" />
      ) : (
        <p>No image</p>
      )}

      {artworkData ? (
        <div className="artdescription">
          <div className="artTitle">{artworkData.data.title}</div>
          <div className="artistName">{artworkData.data.artist_title}</div>
          <div>
            ({artworkData.data.date_end}) ({artworkData.data.place_of_origin}) (
            {artworkData.data.artwork_type_title})
          </div>
          <div>{artworkData.data.description}</div>
        </div>
      ) : (
        <p>No data</p>
      )}
    </div>
  )
}
