import React, { useState, useEffect, useRef } from 'react';
import {
    FaPlay, FaPause, FaVolumeUp, FaVolumeDown,
    FaVolumeMute, FaPlus, FaMinus
} from 'react-icons/fa';
import MusicBroker from "../utilities/music/MusicBroker";
import Progress from "../utilities/music/Progress";
import TimeFormatter from "../utilities/music/TimeFormatter";
import progress from "../utilities/music/Progress";

const MusicPlayer = ({ audioUrl, setNext, setPrev}) => {
    const audioRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const queueRef = useRef([]);
    const progressRef = useRef(null);
    const totalAudioBytes = useRef(0);
    const fetchOffset = useRef(0);
    const started = useRef(false)

    //Problem solved temporarily duration -> Can't be 1 initially -> But can't divide by duration okay
    const duration = useRef(0);
    const stopRunning = useRef(false);
    const chunksEndReached = useRef(false);
    const progressObject = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(5);
    const [beforeMuteVol, setBeforeMuteVol] = useState(5);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverX, setHoverX] = useState(0);
    const [progressTime, setProgressTime] = useState(0);

    const chunkSize = 1024 * 512; // 512 KB
    const ALLOWED_CHUNKS_NUMBER = 10;

    function chunksRemainingToPlay(){
        return (fetchOffset.current - progressObject.current.bytesPlayed()) / chunkSize;
    }

    function hasManyChunksRemainingToPlay(){
        console.log("Chunks remain to play ", chunksRemainingToPlay(), "bytes Played ", progressObject.current.bytesPlayed())
        return chunksRemainingToPlay() < ALLOWED_CHUNKS_NUMBER;
    }

    useEffect(() => {
        progressObject.current = new Progress(0, duration.current, totalAudioBytes.current)
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setProgressTime(audio.currentTime);
            progressObject.current.changeProgress(audio.currentTime);
            if(started.current && progressObject.current?.ended()){
                started.current = false
                console.log("Officially")
                setNext()
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', () => {
            setNext()
        });
        return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
    }, []);

    // Setup MediaSource on audioUrl change
    useEffect(() => {
        chunksEndReached.current = false;
        stopRunning.current = false;
        if (!audioUrl) return;
        console.log(audioUrl)

        pause();
        if (audioRef.current) {
            audioRef.current.src = '';
        }

        (async () => {
            totalAudioBytes.current = await MusicBroker.fetchTotalBytes(audioUrl)
            duration.current = await MusicBroker.fetchDuration(audioUrl)
            progressObject.current = new Progress(0, duration.current, totalAudioBytes.current)
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

    const initMediaBuffer = async () => {
        const mimeCodec = 'audio/mpeg';
        const mediaSource = mediaSourceRef.current;

        if (mediaSource && MediaSource.isTypeSupported(mimeCodec)) {
            const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
            sourceBuffer.mode = 'sequence';
            sourceBufferRef.current = sourceBuffer;

            //Whenever updateend is done -> Current buffer is updated, this event gets fired non stop
            sourceBuffer.addEventListener('updateend', async () => {
                console.log("Updateend fired")
                if (!sourceBuffer.updating && queueRef.current.length > 0) {
                    sourceBuffer.appendBuffer(queueRef.current.shift());
                } else if (fetchOffset.current < totalAudioBytes.current) {
                    if(!stopRunning.current && !chunksEndReached.current) {
                        loadNextChunk(audioUrl);
                    }
                }
                else{
                    tryEndStream()
                }
            });

            if(!stopRunning.current && !chunksEndReached.current) {
                loadNextChunk(audioUrl);
            }
        } else {
            console.error('Unsupported MIME type or codec:', mimeCodec);
        }
    };

    function findIncludingRangeOffset(currentDuration) {
        const bytePosition = (currentDuration / duration.current) * totalAudioBytes.current;
        const chunkIndex = Math.floor(bytePosition / chunkSize);
        const chunkStartRange = chunkIndex * chunkSize;
        return chunkStartRange;
    }

    async function loadFromDuration(period, url) {
        stopRunning.current = true;
        fetchOffset.current = findIncludingRangeOffset(period);
        queueRef.current = [];

        const sb = sourceBufferRef.current;

        await waitForUpdateEnd(sb);

        const left = Math.max(0, period - 50);
        const right = Math.min(duration.current, period + 50);

        sb.remove(0, left);
        await waitForUpdateEnd(sb);

        sb.remove(right, duration.current);
        await waitForUpdateEnd(sb);

        stopRunning.current = false;
        await loadNextChunk(url).then(play);
    }

    function waitForUpdateEnd(sourceBuffer) {
        return new Promise(resolve => {
            if (!sourceBuffer.updating) {
                resolve();
            } else {
                const handler = () => {
                    sourceBuffer.removeEventListener('updateend', handler);
                    resolve();
                };
                sourceBuffer.addEventListener('updateend', handler);
            }
        });
    }
    const tryEndStream = () => {
        if (!sourceBufferRef.current.updating) {
            mediaSourceRef.current.endOfStream();
            stopRunning.current = true;
            chunksEndReached.current = true;
            console.log("Ended in try")
        } else {
            // Try again shortly
            setTimeout(tryEndStream, 50);
        }
    }
    const loadNextChunk = async () => {
        if(!totalAudioBytes.current)
            {
                totalAudioBytes.current = await MusicBroker.fetchTotalBytes(audioUrl);
            }
        const start = fetchOffset.current;
        const end = Math.min(start + chunkSize - 1, totalAudioBytes.current - 1); // prevent overflow

        try {
            const res = await fetch(`http://localhost:8083/serve/${(audioUrl)}`, {
                headers: { Range: `bytes=${start}-${end}` },
            });
            console.log(`bytes=${start}-${end}`)

            if (!res.ok || res.status === 416) {
                console.log("This marked end??")
                // Wait until SourceBuffer is done updating
                tryEndStream();
                return;
            }

            const chunk = await res.arrayBuffer();
            queueRef.current.push(chunk);
            fetchOffset.current = end + 1;

            if(!stopRunning.current || !chunksEndReached.current) { //IMagine some kind of stop switch
                if(!sourceBufferRef.current.updating){
                    if(hasManyChunksRemainingToPlay()){
                        sourceBufferRef.current.appendBuffer(queueRef.current.shift());
                    }
                    else{
                        if(!chunksEndReached.current){
                            await waitUntil(hasManyChunksRemainingToPlay);
                            sourceBufferRef.current.appendBuffer(queueRef.current.shift());
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading audio chunk:', err);
        }
    };

    const waitUntil = async (conditionFn, interval = 5000) => {
        return new Promise((resolve) => {
            const check = () => {
                if (conditionFn()) {
                    resolve();
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    };

    const play = () => {
        started.current = true
        audioRef.current?.play();
        setIsPlaying(true);
    };

    const pause = () => {
        audioRef.current?.pause();
        setIsPlaying(false);
    };


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
        if (!audioRef.current || !progressRef.current || !duration.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * duration.current;

        /**
         * Call load from method here
         */
        // loadFromDuration(newTime, audioUrl).then(r => {
        //     audioRef.current.currentTime = newTime;
        // })

        audioRef.current.currentTime = newTime;

    };

    const handleMouseMove = (e) => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / rect.width) * duration.current;
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
                    <span>{TimeFormatter.formatTime(progressTime)}</span>
                    <span>{TimeFormatter.formatTime(duration.current - progressTime)}</span>
                </div>
                <progress value={progressObject.current?.percentagePlayed()}
                          max="100" className="w-full cursor-pointer"></progress>
                {hoverTime !== null && (
                    <div
                        className="absolute bottom-6 text-xs bg-gray-700 px-2 py-1 rounded"
                        style={{ left: `${hoverX}px`, transform: 'translateX(-50%)' }}
                    >
                        {TimeFormatter.formatTime(hoverTime)}
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
