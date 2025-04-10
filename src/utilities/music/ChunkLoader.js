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
                    await this.waitUntil(this.hasManyChunksRemainingToPlay);
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
        console.log("Chunks remain to play ", this.chunksRemainingToPlay(), "bytes Played ", this.progress.current.bytesPlayed())
        return this.chunksRemainingToPlay() < ChunkLoader.ALLOWED_CHUNKS_NUMBER;
    }

    waitUntil = async (conditionFn, interval = 5000) => {
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
}
export default ChunkLoader;