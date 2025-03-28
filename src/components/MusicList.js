import React, { useState, useEffect } from "react";

const MusicList = ({audioUrl, setAudioUrl, reloadFlag}) => {
    const [songs, setSongs] = useState([]); // To store the list of songs

    // Fetch the list of songs from the backend (/musics)
    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await fetch("http://localhost:8083/musics");
                const data = await response.json();
                setSongs(data); // Store the fetched songs in the state
            } catch (error) {
                console.error("Error fetching songs:", error);
            }
        };

        fetchSongs();
    }, [reloadFlag]); // Empty dependency array ensures it runs once after the component mounts

    // Handle the click on a song title to change the audio URL
    const handleSongClick = (audioUrl) => {
        setAudioUrl(`http://localhost:8083/uploads/${audioUrl}`); // Update audio URL with the selected song
    };

    return (
        <div className="flex flex-col items-center p-4">
            {/* List of Songs */}
            <div className="w-full max-w-md mb-4">
                <h2 className="text-xl font-bold mb-4">Songs List</h2>
                <ul className="list-none">
                    {songs.map((song, index) => (
                        <li
                            key={index}
                            className="cursor-pointer text-blue-500 hover:text-blue-700"
                            onClick={() => handleSongClick(song.audioUrl)}
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
