import React, { useState, useEffect } from "react";

const MusicList = ({audioUrl, setAudioUrl, reloadFlag, nextTrigger, previousTrigger}) => {
    const [songs, setSongs] = useState(null); // To store the list of songs
    const [currentSong, setCurrentSong] = useState(0);

    // Fetch the list of songs from the backend (/musics)
    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await fetch("http://localhost:8083/musics");
                const data = await response.json();
                setSongs(data)
            } catch (error) {
                console.error("Error fetching songs:", error);
            }
        };
        fetchSongs();
    }, [reloadFlag]); // Empty dependency array ensures it runs once after the component mounts

    useEffect(() => {
        if(songs !== null && songs.length > 0){
            console.log("Next is triggered List")
            if(currentSong < songs.length - 1) {
                setAudioUrl(songs[currentSong + 1].audioUrl)
                setCurrentSong(currentSong + 1)
            }
        }
    }, [nextTrigger])
    //
    // useEffect(() => {
    //     console.log("Prev is triggered")
    //     if(currentSong > 0) {
    //         setAudioUrl(songs[currentSong - 1].audioUrl)
    //         setCurrentSong(currentSong - 1)
    //     }
    // }, [previousTrigger])

    // Handle the click on a song title to change the audio URL
    const handleSongClick = (audioUrl) => {
        setAudioUrl(audioUrl); // Update audio URL with the selected song
    };

    return (
        <div className="flex flex-col items-center p-4">
            {/* List of Songs */}
            <div className="w-full max-w-md mb-4">
                <h2 className="text-xl font-bold mb-4">Songs List</h2>
                <ul className="list-none">
                    {songs?.map((song, index) => (
                        <li
                            key={index}
                            className="cursor-pointer text-blue-500 hover:text-blue-700"
                            onClick={() => {
                                handleSongClick(song.audioUrl)
                                setCurrentSong(index)
                            }}
                        >
                            {song.title}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Display Selected Audio URL */}
            {audioUrl && (
                <div className="w-full max-w-md mt-4">
                    <h3 className="text-lg font-medium mb-2">Selected Audio:</h3>
                    <p className="text-sm text-gray-700">{audioUrl}</p>
                </div>
            )}
        </div>
    );
};

export default MusicList;
