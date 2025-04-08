class WebBroker {
    url = "http://localhost:8083";
    constructor(url) {
        this.url = url;
    }
    async  postWithObject(object){
        return fetch(this.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(object),
        })
    }
}
export default WebBroker;