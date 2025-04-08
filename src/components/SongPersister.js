import {useState} from "react";
import WebBroker from "../utilities/WebBroker";

const SongPersister = ({changeReloadList, setUpdates}) => {

    const [videoId, setVideoId] = useState("");
    const [videoDetails, setVideoDetails] = useState({title: "", artist: ""}); // Title and artist state


    const extractVideoId = (url) => {
        const regex = /(?:\?v=|\/embed\/|\/v\/|\/watch\?v=|&v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    const fetchVideoDetails = async (id) => {
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
            .then(response => response.json())
            .then(data => {
                setVideoDetails({
                    title: data.title,
                    artist: data.author_name,
                });
            })
            .catch(error => console.error(error))
    };


    const sendVideoUrlToSave = async () => {
        if (!videoId) {
            alert("Please enter a valid YouTube URL first.");
            return;
        }
        setUpdates(["Starting save operation."])
        const webBroker = new WebBroker("http://localhost:8083/musics");
        webBroker.postWithObject({
            title: videoDetails.title,
            audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
            artist: videoDetails.artist,
        })
            .then(response => {
                if (response.ok) {
                    changeReloadList()
                    alert("Music data submitted successfully!");

                } else {
                    alert("Failed to submit music data.");
                }
            })
            .catch(console.error)
    }
    return <>
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
                    sendVideoUrlToSave(videoId)
                }}
            >Save this song
            </button>
        </div>
    </>
}
export default SongPersister