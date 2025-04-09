import { useEffect, useState, useRef } from 'react';
import MusicPlayer from "../components/MusicPlayer";
import MusicList from "../components/MusicList";
import RealTimeUpdates from "../components/RealTimeUpdates";
import SongPersister from "../components/SongPersister";

export default function Home() {
    const [audioUrl, setAudioUrl] = useState("");
    const [reloadList, setReloadList] = useState(false);
    const [updates, setUpdates] = useState([]);
    const [nextTrigger, setNextTrigger] = useState(false)
    const [prevTrigger, setPrevTrigger] = useState(false)


    return (
        <div>
            <SongPersister changeReloadList={() => setReloadList(prev=>!prev)}
                           setUpdates={setUpdates}/>
            <RealTimeUpdates updates={updates} setUpdates={setUpdates}/>

            <div className="flex">
                <MusicPlayer audioUrl={audioUrl}
                             setNext={() => {setNextTrigger(prev => !prev)}}
                             setPrev={()=>{setPrevTrigger(prev => !prev)}}
                />
                <MusicList audioUrl={audioUrl}
                           setAudioUrl={setAudioUrl}
                           reloadFlag={reloadList}
                           nextTrigger={nextTrigger}
                           previousTrigger={prevTrigger}
                />
            </div>
            <button onClick={() => setAudioUrl(prompt("Enter Audio Url"))}>
                Load Song
            </button>
        </div>
    );
}
