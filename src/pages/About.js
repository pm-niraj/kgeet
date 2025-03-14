import { useState } from 'react';
import MusicPlayer from "../components/MusicPlayer";

export default function About() {
    const [audioUrl, setAudioUrl] = useState(null);
    return (
        <div>
            <h1>About</h1>
            <MusicPlayer audioUrl={audioUrl} />
            <button onClick={() => setAudioUrl(prompt("Enter Audio Url"))}>
                Load Song
            </button>
        </div>
    );
}