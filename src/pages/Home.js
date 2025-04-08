import { useEffect, useState, useRef } from 'react';
import MusicPlayer from "../components/MusicPlayer";
import MusicList from "../components/MusicList";
import RealTimeUpdates from "../components/RealTimeUpdates";
import SongPersister from "../components/SongPersister";

export default function Home() {
    const [audioUrl, setAudioUrl] = useState("");
    const [reloadList, setReloadList] = useState(false);
    const [updates, setUpdates] = useState([]);


    return (
        <div>
            <SongPersister changeReloadList={() => setReloadList(!reloadList)}
                           setUpdates={setUpdates}/>
            <RealTimeUpdates updates={updates} setUpdates={setUpdates}/>

            <MusicPlayer audioUrl={audioUrl}/>
            <MusicList audioUrl={audioUrl} setAudioUrl={setAudioUrl} reloadFlag={reloadList}/>
            <button onClick={() => setAudioUrl(prompt("Enter Audio Url"))}>
                Load Song
            </button>
        </div>
    );
}
