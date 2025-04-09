class Progress{
    currentSeconds;
    duration;
    totalAudioBytes;

    constructor(currentSeconds, duration, totalAudioBytes) {
        this.duration = duration;
        this.currentSeconds = currentSeconds;
        this.totalAudioBytes = totalAudioBytes
    }
    bytesPlayed(){
        // console.log("Bytes played : ", this.currentSeconds, this.duration, this.totalAudioBytes);
        if(this.duration !== 0)
            return (this.currentSeconds / this.duration) * this.totalAudioBytes;
        else
            return 0
    }
    changeProgress(currentSeconds){
        this.currentSeconds = currentSeconds
    }

    percentagePlayed(){
        if(this.duration === 0)
            return 0
        return (this.currentSeconds / this.duration) * 100;
    }

    ended(){
        return Math.trunc(Math.abs(this.currentSeconds - this.duration) * 10) === 0;
    }
}
export default Progress;