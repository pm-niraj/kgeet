import React, { useState, useEffect, useRef } from 'react';
import {
    FaPlay, FaPause, FaVolumeUp, FaVolumeDown,
    FaVolumeMute, FaPlus, FaMinus
} from 'react-icons/fa';

const MusicPlayer = ({ audioUrl }) => {
    const audioRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const queueRef = useRef([]);
    const progressRef = useRef(null);
    const totalAudioBytes = useRef(null);
    const fetchOffset = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(5);
    const [beforeMuteVol, setBeforeMuteVol] = useState(5);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverX, setHoverX] = useState(0);

    const chunkSize = 1024 * 512; // 512 KB

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // Fetch duration from `/audio_length/audioUrl`
    const fetchTotalBytes = async (url) => {
        try {
            const res = await fetch(`http://localhost:8083/audio_length/${(url)}`);
            const data = await res.text();
            console.log(data)
            return parseInt(data, 10);
        } catch (err) {
            console.error('Error fetching duration:', err);
            return 0;
        }
    };


    const fetchDuration = async (url) => {
        try {
            const res = await fetch(`http://localhost:8083/duration/${(url)}`);
            const data = await res.text();
            console.log(data)
            return parseFloat(data);
        } catch (err) {
            console.error('Error fetching duration:', err);
            return 0;
        }
    };

    // Setup MediaSource on audioUrl change
    useEffect(() => {
        if (!audioUrl) return;
        console.log(audioUrl)

        pause();
        if (audioRef.current) {
            audioRef.current.src = '';
        }

        (async () => {
            totalAudioBytes.current = await fetchTotalBytes(audioUrl);
            setDuration(await fetchDuration(audioUrl))
            setCurrentTime(0);
            fetchOffset.current = 0;
            queueRef.current = [];

            const mediaSource = new MediaSource();
            mediaSourceRef.current = mediaSource;

            audioRef.current.src = URL.createObjectURL(mediaSource);

            mediaSource.addEventListener('sourceopen', () => {
                initMediaBuffer(audioUrl).then(play);
            });
        })();
    }, [audioUrl]);

    const initMediaBuffer = async (url) => {
        const mimeCodec = 'audio/mpeg';
        const mediaSource = mediaSourceRef.current;

        if (mediaSource && MediaSource.isTypeSupported(mimeCodec)) {
            const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
            sourceBuffer.mode = 'sequence';
            sourceBufferRef.current = sourceBuffer;

            //Whenever updateend is done -> Current buffer is updated, this event gets fired non stop
            sourceBuffer.addEventListener('updateend', () => {
                if (!sourceBuffer.updating && queueRef.current.length > 0) {
                    sourceBuffer.appendBuffer(queueRef.current.shift());
                } else if (!sourceBuffer.updating && fetchOffset.current < totalAudioBytes.current) {
                    loadNextChunk(url);
                }
            });

            loadNextChunk(url);
        } else {
            console.error('Unsupported MIME type or codec:', mimeCodec);
        }
    };


    const loadNextChunk = async (url) => {
        if(!totalAudioBytes.current)
            await fetchTotalBytes(url);
        const start = fetchOffset.current;
        const end = Math.min(start + chunkSize - 1, totalAudioBytes.current - 1); // prevent overflow

        try {
            const res = await fetch(`http://localhost:8083/serve/${(url)}`, {
                headers: { Range: `bytes=${start}-${end}` },
            });
            console.log(`bytes=${start}-${end}`)

            if (!res.ok || res.status === 416) {
                // Wait until SourceBuffer is done updating
                const tryEndStream = () => {
                    if (!sourceBufferRef.current.updating) {
                        mediaSourceRef.current.endOfStream();
                    } else {
                        // Try again shortly
                        setTimeout(tryEndStream, 50);
                    }
                };
                tryEndStream();
                return;
            }

            const chunk = await res.arrayBuffer();
            queueRef.current.push(chunk);
            fetchOffset.current = end + 1;

            if (!sourceBufferRef.current.updating) {
                sourceBufferRef.current.appendBuffer(queueRef.current.shift());
            }


        } catch (err) {
            console.error('Error loading audio chunk:', err);
        }
    };

    const play = () => {
        audioRef.current?.play();
        setIsPlaying(true);
    };

    const pause = () => {
        audioRef.current?.pause();
        setIsPlaying(false);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 10;
        }
    }, [volume]);

    const toggleMute = () => {
        if (volume > 0) {
            setBeforeMuteVol(volume);
            setVolume(0);
        } else {
            setVolume(beforeMuteVol);
        }
    };

    const handleProgressClick = (e) => {
        if (!audioRef.current || !progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * duration;
        audioRef.current.currentTime = newTime;
    };

    const handleMouseMove = (e) => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / rect.width) * duration;
        setHoverTime(time);
        setHoverX(x);
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
    };

    return (
        <div className="flex flex-col items-center bg-gray-800 text-white p-4 rounded-2xl shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-2">Now Playing</h2>
            <div className="bg-gray-700 w-full h-36 rounded-lg flex items-center justify-center mb-4">
                <span className="text-sm">Album Art</span>
            </div>

            <audio ref={audioRef} preload="auto" />

            <div className="flex items-center gap-4 mb-2">
                {isPlaying ? (
                    <FaPause className="text-3xl cursor-pointer hover:text-gray-400" onClick={pause} />
                ) : (
                    <FaPlay className="text-3xl cursor-pointer hover:text-gray-400" onClick={play} />
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
                    <div
                        className="absolute bottom-6 text-xs bg-gray-700 px-2 py-1 rounded"
                        style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}
                    >
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
