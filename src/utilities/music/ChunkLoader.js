import MusicBroker from "./MusicBroker";

class ChunkLoader{
    audioUrl
    buffer
    queue
    currentFetchOffset = 0
    chunksEndReached = false
    static CHUNK_SIZE = 1024 * 512; // 512 KB
    static ALLOWED_CHUNKS_NUMBER = 2;
    tryEndStream
    progress

    constructor(audioUrl, buffer, progressObject, tryEndStream, queue) {
        this.audioUrl = audioUrl
        this.buffer = buffer
        this.progress = progressObject
        this.tryEndStream = tryEndStream
        this.queue = queue
    }

    isFreeToAppendInBuffer() {
        return !this.chunksEndReached && !this.buffer.current.updating && this.queue.current.length > 0;
    }

    loadNextChunk = async () => {
        if(this.chunksEndReached) return
        console.log(this.progress)
        const chunkStart = this.currentFetchOffset;
        const chunkEnd = Math.min(chunkStart + ChunkLoader.CHUNK_SIZE - 1, this.progress.current.totalAudioBytes - 1); // prevent overflow

        try {
            const res = await MusicBroker.fetchChunk(this.audioUrl, chunkStart, chunkEnd)
            console.log(`bytes=${chunkStart}-${chunkEnd} of ${this.progress.current.totalAudioBytes - 1}`);

            if (!res.ok || res.status === 416) {
                this.tryEndStream();
                return;
            }

            //Proceed only after getting chunk synchronously
            const chunk = await res.arrayBuffer();

            this.queue.current.push(chunk);
            this.currentFetchOffset = chunkEnd + 1;

            if (this.isFreeToAppendInBuffer()) { //IMagine some kind of stop switch
                if (this.hasManyChunksRemainingToPlay()) {
                    this.buffer.current.appendBuffer(this.queue.current.shift());
                } else {
                    await this.waitUntil(this.allowedToAppendBufferNow());
                    this.buffer.current.appendBuffer(this.queue.current.shift());
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

    endCurrentLoading = async () => {
        this.currentFetchOffset = this.progress.current.bytesPlayed()
        this.chunksEndReached = true;
        await new Promise((resolve) => setTimeout(resolve, 0))
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
        this.queue.current = []
        this.progress.current.currentSeconds = currentTime;
        this.currentFetchOffset = this.findBytePositionFromDuration(currentTime)
        const chunkStart = this.currentFetchOffset
        const chunkEnd = Math.min(chunkStart + ChunkLoader.CHUNK_SIZE - 1, this.progress.current.totalAudioBytes - 1); // prevent overflow
        console.log(`-- updating bytes=${chunkStart}-${chunkEnd} of ${this.progress.current.totalAudioBytes - 1}`);
        try {
            const res = await MusicBroker.fetchChunk(this.audioUrl, chunkStart, chunkEnd)

            if (!res.ok || res.status === 416) {
                this.tryEndStream();
                return;
            }

            //Free to modify
            this.chunksEndReached = false;
            console.log(this.chunksRemainingToPlay(), this.hasManyChunksRemainingToPlay());

            //Proceed only after getting chunk synchronously
            const chunk = await res.arrayBuffer();
            this.queue.current.push(chunk)
            this.currentFetchOffset = chunkEnd + 1;

            if (this.allowedToAppendBufferNow()) {
                this.buffer.current.appendBuffer(this.queue.current.shift());
            } else {
                await this.waitUntil(this.allowedToAppendBufferNow);
                this.buffer.current.appendBuffer(this.queue.current.shift());
            }
        } catch (err) {
            console.error('Error loading audio chunk:', err);
        }
    }

    allowedToAppendBufferNow() {
        return () => this.hasManyChunksRemainingToPlay() && this.isFreeToAppendInBuffer();
    }

    findBytePositionFromDuration = (currentDuration) => {
        const { duration, totalAudioBytes } = this.progress.current;
        const CHUNK_SIZE = ChunkLoader.CHUNK_SIZE;

        const rawPosition = (currentDuration / duration) * totalAudioBytes;

        // Align to nearest lower CHUNK_SIZE boundary
        const alignedPosition = Math.floor(rawPosition / CHUNK_SIZE) * CHUNK_SIZE;

        return Math.max(Math.trunc(rawPosition), 0);
    };

}
export default ChunkLoader;