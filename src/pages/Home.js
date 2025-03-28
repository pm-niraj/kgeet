import { useEffect, useState, useRef } from 'react';
import MusicPlayer from "../components/MusicPlayer";
import MusicList from "../components/MusicList";

export default function Home() {
    const [audioUrl, setAudioUrl] = useState(null);
    const [videoId, setVideoId] = useState("");
    const [reloadList, setReloadList] = useState(false);
    const [videoDetails, setVideoDetails] = useState({ title: "", artist: "" }); // Title and artist state

    const extractVideoId = (url) => {
        const regex = /(?:\?v=|\/embed\/|\/v\/|\/watch\?v=|&v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }; // Method to fetch video details from YouTube oEmbed API

    const fetchVideoDetails = async (id) => {
        try {
            const response = await fetch(
                `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
            );
            const data = await response.json();
            setVideoDetails({
                title: data.title, // Set title from response
                artist: data.author_name, // Set artist from response
            });
        } catch (error) {
            console.error("Error fetching video details:", error);
        }
    };


    // Handle POST request to backend (localhost)
    const handlePostSubmit = async () => {
        if (!videoId) {
            alert("Please enter a valid YouTube URL first.");
            return;
        }
        console.log(videoDetails)

        try {
            const response = await fetch("http://localhost:8083/musics", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: videoDetails.title,
                    audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    artist: videoDetails.artist,
                }),
            });

            if (response.ok) {
                setReloadList(!reloadList);
                alert("Music data submitted successfully!");

            } else {
                alert("Failed to submit music data.");
            }
        } catch (error) {
            console.error("Error submitting music data:", error);
        }
    };
    return (
        <div>
            <h1>Search for your favourite song</h1>
            <div className="flex flex-col items-center p-4">
                <form className="w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Enter YouTube video URL"
                        onChange={(e) => {
                            setVideoId(extractVideoId(e.target.value));
                            fetchVideoDetails(extractVideoId(e.target.value));
                        }}
                        className="w-full p-2 border rounded mb-4"
                    />
                </form>

                {videoId && (
                    <div className="mt-4 w-full max-w-2xl">
                        <div className="relative pb-[56.25%] h-0 overflow-hidden">
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}
                <input
                    type="text"
                    value={videoDetails.title}
                    onChange={(e) => {
                        setVideoDetails({...videoDetails, title: e.target.value});
                    }}
                    className="w-full p-2 border rounded"
                />
                <input
                type="text"
                value={videoDetails.artist}
                onChange={(e) => {
                    setVideoDetails({...videoDetails, artist: e.target.value});
                }}
                className="w-full p-2 border rounded"
            />
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    onClick={() => {

                        handlePostSubmit(videoId)
                    }}
                >Save this song
                </button>
            </div>

            <MusicPlayer audioUrl={audioUrl}/>
            <MusicList audioUrl={audioUrl} setAudioUrl={setAudioUrl} reloadFlag={reloadList}/>
            <button onClick={() => setAudioUrl(prompt("Enter Audio Url"))}>
                Load Song
            </button>
        </div>
    );
}
