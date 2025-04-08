import SockJS from "sockjs-client";
import {Client} from "@stomp/stompjs";

class SocketBroker{
    socket;
    stompClient;
    topic;
    constructor(socketUrl, topic) {
        this.socket = new SockJS(socketUrl);
        this.topic = topic;
    }

    tryManageMessage(handleMessage){
        this.stompClient = new Client({
            webSocketFactory: () => this.socket,
            debug: (msg) => console.log(msg),
            onConnect: () => {
                console.log("Connected to WebSocket");
                this.stompClient.subscribe(this.topic, handleMessage);
            },
        })
    }

    async startSubscribing(){
        return this.stompClient.activate();
    }

    async stopConnection(){
        return this.stompClient.deactivate();
    }
}
export default SocketBroker;