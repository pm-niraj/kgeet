class MusicBroker {
    static fetchTotalBytes = async (url) => {
        try {
            const res = await fetch(`http://localhost:8083/audio_length/${(url)}`);
            const data = await res.text();
            return parseInt(data, 10);
        } catch (err) {
            console.error('Error fetching duration:', err);
            return 0;
        }
    };


    static fetchDuration = async (url) => {
        try {
            const res = await fetch(`http://localhost:8083/duration/${(url)}`);
            const data = await res.text();
            return parseFloat(data);
        } catch (err) {
            console.error('Error fetching duration:', err);
            return 0;
        }
    }

    static fetchChunk = async (url, chunkStart, chunkEnd) =>
    {
        return await fetch(`http://localhost:8083/serve/${(url)}`, {
            headers: {Range: `bytes=${chunkStart}-${chunkEnd}`},
        })
    }

}
export default MusicBroker