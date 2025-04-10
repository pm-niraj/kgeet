import React, {useEffect, useRef, useState} from 'react';
import {FaMinus, FaPause, FaPlay, FaPlus, FaVolumeDown, FaVolumeMute, FaVolumeUp} from 'react-icons/fa';
import MusicBroker from "../utilities/music/MusicBroker";
import Progress from "../utilities/music/Progress";
import progress from "../utilities/music/Progress";
import TimeFormatter from "../utilities/music/TimeFormatter";
import ChunkLoader from "../utilities/music/ChunkLoader";

const MusicPlayer = ({audioUrl, setNext, setPrev}) => {
    const audioElement = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const progressElement = useRef(null);
    const songLoaded = useRef(false)
    const isSeeking = useRef(false)

    //Problem solved temporarily duration -> Can't be 1 initially -> But can't divide by duration okay
    const chunksEndReached = useRef(false);
    const progressObject = useRef(null)
    const chunkLoader = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(5);
    const [beforeMuteVol, setBeforeMuteVol] = useState(5);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverX, setHoverX] = useState(0);
    const [progressTime, setProgressTime] = useState(0);

    useEffect(() => {
        progressObject.current = new Progress(0, 0, 0)
        chunkLoader.current = new ChunkLoader(audioUrl, sourceBufferRef, progressObject, tryEndStream)
        const audio = audioElement.current;
        if (!audio) return;

        const update = () => {
            setProgressTime(audio.currentTime);
            progressObject.current.changeProgress(audio.currentTime);
            if (songLoaded.current && progressObject.current?.ended()) {
                songLoaded.current = false
                setNext()
            }
        };

        audio.addEventListener('timeupdate', update);
        return () => audio.removeEventListener('timeupdate', update);
    }, []);


    function resetChunkLoader() {
        chunkLoader.current.audioUrl = audioUrl
        chunkLoader.current.currentFetchOffset = 0
    }

// -- When audio url is changed
    useEffect(() => {
        if (!audioUrl) return;
        initializeSongPlayVars()
            .then(() => {

                mediaSourceRef.current = new MediaSource;
                audioElement.current.src = URL.createObjectURL(mediaSourceRef.current);

                mediaSourceRef.current.addEventListener('sourceopen', () => {
                    configureMediaplayerWithAudioChunks(audioUrl)
                        .then(async () => {
                            resetChunkLoader();
                            await chunkLoader.current.loadNextChunk()
                        }).then(play);
                });
            })
    }, [audioUrl]);

    function initializeSongPlayVars() {
        chunksEndReached.current = false;
        return Promise.all([MusicBroker.fetchTotalBytes(audioUrl),
            MusicBroker.fetchDuration(audioUrl)])
            .then(([t, d]) => {
                progressObject.current = new Progress(0, d, t)
            })
            .catch(console.log)
    }

    const configureMediaplayerWithAudioChunks = async () => {
        const mimeCodec = 'audio/mpeg';
        const mediaSource = mediaSourceRef.current;

        if (mediaSource && MediaSource.isTypeSupported(mimeCodec)) {
            const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
            sourceBuffer.mode = 'sequence';
            sourceBufferRef.current = sourceBuffer;

            //Whenever updateend is done -> Current buffer is updated, this event gets fired non-stop
            sourceBuffer.addEventListener('updateend', updateEndHandler);
        } else {
            console.error('Unsupported MIME type or codec:', mimeCodec);
        }
    };

    const updateEndHandler = async () => {
        console.log("Updateend fired")
        if (moreChunksToLoad()) {
            await chunkLoader.current.loadNextChunk()
        } else {
            tryEndStream()
        }
    }

    function moreChunksToLoad() {
        return chunkLoader.current.currentFetchOffset < progressObject.current.totalAudioBytes && !chunksEndReached.current;
    }

    const tryEndStream = () => {
        if (!sourceBufferRef.current.updating) {
            mediaSourceRef.current.endOfStream();
            chunksEndReached.current = true;
            console.log("Ended in try")
        } else {
            // Try again shortly
            setTimeout(tryEndStream, 50);
        }
    }


    const play = () => {
        songLoaded.current = true
        audioElement.current?.play();
        setIsPlaying(true);
    };

    const pause = () => {
        audioElement.current?.pause();
        setIsPlaying(false);
    };


    useEffect(() => {
        if (audioElement.current) {
            audioElement.current.volume = volume / 10;
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
        if (!audioElement.current || !progressElement.current || !progressObject.current.duration) return;
        const rect = progressElement.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * progressObject.current.duration;
        if(isSeekable(newTime))
            audioElement.current.currentTime = newTime;

    };

    const isSeekable = (desiredTime) => {
        for (let i = 0; i < sourceBufferRef.current.buffered.length; i++) {
            console.log(sourceBufferRef.current.buffered.start(i), sourceBufferRef.current.buffered.end(i))
            if (sourceBufferRef.current.buffered.start(i) <= desiredTime && desiredTime <= sourceBufferRef.current.buffered.end(i)) {
                return true;
            }
        }
        return false;
    }
    const findBytePositionFromDuration = (currentDuration) => {
        return Math.trunc(Math.max((currentDuration / progressObject.current.duration) * progressObject.current.totalAudioBytes - 10000, 0));
    }
    const handleMouseMove = (e) => {
        if (!progressElement.current) return;
        const rect = progressElement.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / rect.width) * progressObject.current.duration;
        setHoverTime(time);
        setHoverX(x);
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
    };

    return (
        <div
            className="w-14 h-1/3 flex-none flex flex-col items-center bg-gray-800 text-white p-4 rounded-2xl shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-2">Now Playing</h2>
            <div className="bg-gray-700 w-full h-36 rounded-lg flex items-center justify-center mb-4">
                <span className="text-sm">Album Art</span>
            </div>

            <audio ref={audioElement} preload="auto"/>

            <div className="flex items-center gap-4 mb-2">
                {isPlaying ? (
                    <FaPause className="text-3xl cursor-pointer hover:text-gray-400" onClick={pause}/>
                ) : (
                    <FaPlay className="text-3xl cursor-pointer hover:text-gray-400" onClick={play}/>
                )}
            </div>

            <div
                className="progress w-full mb-2 relative"
                ref={progressElement}
                onClick={handleProgressClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex justify-between text-sm">
                    <span>{TimeFormatter.formatTime(progressTime)}</span>
                    <span>{TimeFormatter.formatTime(progressObject.current?.duration - progressTime)}</span>
                </div>
                <progress value={progressObject.current?.percentagePlayed()}
                          max="100" className="w-full cursor-pointer"></progress>
                {hoverTime !== null && (
                    <div
                        className="absolute bottom-6 text-xs bg-gray-700 px-2 py-1 rounded"
                        style={{left: `${hoverX}px`, transform: 'translateX(-50%)'}}
                    >
                        {TimeFormatter.formatTime(hoverTime)}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mb-2">
                <label>Volume: {volume}</label>
                <FaMinus onClick={() => setVolume(Math.max(0, volume - 1))}/>
                <FaPlus onClick={() => setVolume(Math.min(10, volume + 1))}/>
                <div onClick={toggleMute}>
                    {volume === 0 ? <FaVolumeMute/> : volume < 5 ? <FaVolumeDown/> : <FaVolumeUp/>}
                </div>
            </div>
        </div>
    );
};

export default MusicPlayer;
