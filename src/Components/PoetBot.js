import React, { useState, useEffect, useRef } from "react";
import { FaLightbulb } from "react-icons/fa";
import { IoLogoOctocat } from "react-icons/io";
import { FaCat } from "react-icons/fa";
import { PiDogFill } from "react-icons/pi";

export default function PoetBot({ title, poet, lines }) {
    //prevents useEffect from running twice in StrictMode
    const didMountRef = useRef(false);
    const [poetBotResponse, setPoetBotResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // avoid double-call from StrictMode during dev mount
        if (didMountRef.current) {
            return;
        }
        didMountRef.current = true;
        setPoetBotResponse(null);
    }, [title, poet, lines]);

    const PoetBot = async (title, poet, lines) => {
        setLoading(true);
        setPoetBotResponse(null);
        console.log("calling poetbot");

        // Truncate lines to first 200 words to fit in Lambda payload limit
        const truncatedLines = truncateToWords(lines, 450);

        const response = await fetch(
            "https://i76rczicem43ribpgiczbetgue0ugawn.lambda-url.us-east-1.on.aws/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, poet, lines }),
            }
        );

        const data = await response.json();
        console.log("Lambda response:", data);
        setPoetBotResponse(data.result);
        setLoading(false);
        return data.result;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        PoetBot(title, poet, lines);
    };

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
                <div className="poetBotResponse">{poetBotResponse}</div>
            ) : null}
        </div>
    );
}

//helper
function truncateToWords(str, maxWords) {
    // Return the original string if it's empty or null
    if (!str) {
        return "";
    }

    // Split the string into an array of words
    const words = str.split(" ");

    // If the word count is less than or equal to the limit, return the original string
    if (words.length <= maxWords) {
        return str;
    }

    // Take the first 'maxWords' words and join them back into a string
    const truncatedWords = words.slice(0, maxWords);
    const truncatedString = truncatedWords.join(" ");

    return truncatedString;
}
