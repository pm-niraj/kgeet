import MusicBroker from "./MusicBroker";

class ChunkLoader{
    audioUrl
    buffer
    currentFetchOffset = 0
    chunksEndReached = false
    static CHUNK_SIZE = 1024 * 512; // 512 KB
    static ALLOWED_CHUNKS_NUMBER = 10;
    tryEndStream
    progress

    constructor(audioUrl, buffer, progressObject, tryEndStream) {
        this.audioUrl = audioUrl
        this.buffer = buffer
        this.progress = progressObject
        this.tryEndStream = tryEndStream
    }

    isFreeToAppendInBuffer() {
        return !this.chunksEndReached && !this.buffer.current.updating;
    }

    loadNextChunk = async () => {
        console.log(this.progress)
        const chunkStart = this.currentFetchOffset;
        const chunkEnd = Math.min(chunkStart + ChunkLoader.CHUNK_SIZE - 1, this.progress.current.totalAudioBytes - 1); // prevent overflow

        try {
            const res = await MusicBroker.fetchChunk(this.audioUrl, chunkStart, chunkEnd)
            console.log(`bytes=${chunkStart}-${chunkEnd}`)

            if (!res.ok || res.status === 416) {
                this.tryEndStream();
                return;
            }

            //Proceed only after getting chunk synchronously
            const chunk = await res.arrayBuffer();
            this.currentFetchOffset = chunkEnd + 1;

            if (this.isFreeToAppendInBuffer()) { //IMagine some kind of stop switch
                if (this.hasManyChunksRemainingToPlay()) {
                    this.buffer.current.appendBuffer(chunk);
                } else {
                    await this.waitUntil(this.allowedToAppendBufferNow());
                    this.buffer.current.appendBuffer(chunk);
                }
            }
        } catch (err) {
            console.error('Error loading audio chunk:', err);
        }
    };
    chunksRemainingToPlay = () => {
        return (this.currentFetchOffset - this.progress.current.bytesPlayed()) / ChunkLoader.CHUNK_SIZE;
    }

    hasManyChunksRemainingToPlay = () => {
        // console.log("Chunks remain to play ", this.chunksRemainingToPlay(), "bytes Played ", this.progress.current.bytesPlayed())
        return this.chunksRemainingToPlay() < ChunkLoader.ALLOWED_CHUNKS_NUMBER;
    }

    endCurrentLoading = () => {
        this.currentFetchOffset = this.progress.current.bytesPlayed()
        this.chunksEndReached = true;
    }

    waitUntil = async (conditionFn, interval = 5000) => {
        console.log('------waiting hmm hmm')
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
    startUpdating = async (currentTime) => {
        this.progress.current.currentSeconds = currentTime;
        this.currentFetchOffset = this.findBytePositionFromDuration(currentTime)
        const chunkStart = this.currentFetchOffset
        const chunkEnd = Math.min(chunkStart + ChunkLoader.CHUNK_SIZE - 1, this.progress.current.totalAudioBytes - 1); // prevent overflow

        try {
            const res = await MusicBroker.fetchChunk(this.audioUrl, chunkStart, chunkEnd)
            // console.log(`updated bytes=${chunkStart}-${chunkEnd}`)

            if (!res.ok || res.status === 416) {
                this.tryEndStream();
                return;
            }

            //Free to modify
            this.chunksEndReached = false;
            console.log(this.chunksRemainingToPlay(), this.hasManyChunksRemainingToPlay());

            //Proceed only after getting chunk synchronously
            const chunk = await res.arrayBuffer();
            this.currentFetchOffset = chunkEnd + 1;

            if (this.allowedToAppendBufferNow()) {
                this.buffer.current.appendBuffer(chunk);
            } else {
                await this.waitUntil(this.allowedToAppendBufferNow);
                this.buffer.current.appendBuffer(chunk);
            }
        } catch (err) {
            console.error('Error loading audio chunk:', err);
        }
    }

    allowedToAppendBufferNow() {
        return () => this.hasManyChunksRemainingToPlay() && this.isFreeToAppendInBuffer();
    }

    findBytePositionFromDuration = (currentDuration) => {
        return Math.trunc(Math.max((currentDuration / this.progress.current.duration) * this.progress.current.totalAudioBytes - 10000, 0));
    }

}
export default ChunkLoader;