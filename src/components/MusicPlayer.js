import { useEffect, useState, useRef } from 'react';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaVolumeUp, FaVolumeDown, FaVolumeMute, FaPlus, FaMinus } from "react-icons/fa";
import { PitchShifter } from 'soundtouchjs';

const MusicPlayer = ({ audioUrl }) => {
    const audioCtxRef = useRef(null);
    const gainNodeRef = useRef(null);
    const shifterRef = useRef(null);
    const progressRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(5);
    const [beforeMuteVol, setBeforeMuteVol] = useState(5);
    const [tempo, setTempo] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);
    const [key, setKey] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverX, setHoverX] = useState(0);

    // Initialize AudioContext and load default audio on mount
    useEffect(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            gainNodeRef.current = audioCtxRef.current.createGain();
        }
    }, []);

    // Load audio source when audioUrl changes
    useEffect(() => {
        if (audioUrl) {
            loadSource(audioUrl);
            play();
        }
    }, [audioUrl]);

    const loadSource = async (url) => {
        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const audioBuffer = await audioCtxRef.current.decodeAudioData(buffer);

            const newShifter = new PitchShifter(audioCtxRef.current, audioBuffer, 16384);
            newShifter.tempo = tempo;
            newShifter.pitch = pitch;

            shifterRef.current = newShifter;
            setDuration(audioBuffer.duration);
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    };

    const play = () => {
        if (shifterRef.current) {
            shifterRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioCtxRef.current.destination);
            audioCtxRef.current.resume().then(() => {
                setIsPlaying(true);
                trackPlayback();
            });
        }
    };

    const pause = () => {
        if (shifterRef.current) {
            shifterRef.current.disconnect();
            setIsPlaying(false);
        }
    };

    const trackPlayback = () => {
        const updateTime = () => {
            if (shifterRef.current && isPlaying) {
                setCurrentTime(shifterRef.current.timePlayed || 0);
                requestAnimationFrame(updateTime);
            }
        };
        requestAnimationFrame(updateTime);
    };

    useEffect(() => {
        if (shifterRef.current) {
            shifterRef.current.tempo = tempo;
            shifterRef.current.pitch = pitch;
            shifterRef.current.pitchSemitones = key;
            gainNodeRef.current.gain.value = volume / 10;
        }
    }, [tempo, pitch, key, volume]);

    useEffect(() => {
        if (shifterRef.current) {
            isPlaying ? play() : pause();
        }
    }, [isPlaying]);

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleProgressClick = (e) => {
        if (!shifterRef.current || !progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * duration;
        shifterRef.current.percentagePlayed = newTime / duration;
        trackPlayback();
    };

    const handleMouseMove = (e) => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        const hoverTime = (hoverX / rect.width) * duration;
        setHoverTime(hoverTime);
        setHoverX(hoverX);
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
    };

    const toggleMute = () => {
        if (volume > 0) {
            setBeforeMuteVol(volume);
            setVolume(0);
        } else {
            setVolume(beforeMuteVol);
        }
    };

    return (
        <div className="flex flex-col items-center bg-gray-800 text-white p-4 rounded-2xl shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-2">Now Playing</h2>
            <div className="bg-gray-700 w-full h-36 rounded-lg flex items-center justify-center mb-4">
                <span className="text-sm">Album Art</span>
            </div>
            <div className="flex items-center gap-4 mb-2">
                {isPlaying ? (
                    <FaPause className="text-3xl cursor-pointer hover:text-gray-400" onClick={() => setIsPlaying(false)} />
                ) : (
                    <FaPlay className="text-3xl cursor-pointer hover:text-gray-400" onClick={() => setIsPlaying(true)} />
                )}
            </div>
            <div
                className="progress w-full mb-2 relative"
                ref={progressRef}
                onClick={handleProgressClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex justify-between text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration - currentTime)}</span>
                </div>
                <progress value={(currentTime / duration) * 100} max="100" className="w-full cursor-pointer"></progress>
                {hoverTime !== null && (
                    <div className="absolute bottom-6 text-xs bg-gray-700 px-2 py-1 rounded" style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}>
                        {formatTime(hoverTime)}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 mb-2">
                <label>Volume: {volume}</label>
                <FaMinus onClick={() => setVolume(Math.max(0, volume - 1))} />
                <FaPlus onClick={() => setVolume(Math.min(10, volume + 1))} />
                <div onClick={toggleMute}>
                    {volume === 0 ? <FaVolumeMute /> : volume < 5 ? <FaVolumeDown /> : <FaVolumeUp />}
                </div>
            </div>
        </div>
    );
};

export default MusicPlayer;
