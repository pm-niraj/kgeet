import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import SocketBroker from "../utilities/SocketBroker";

const RealTimeUpdates = ({updates, setUpdates}) => {

    useEffect(() => {
        const socketBroker = new SocketBroker("http://localhost:8083/ws", "/topic/song-updates")
        const handleMessage = (message) => {
            const update = JSON.parse(message.body);
            if (Object.hasOwn(update, "downloaded")) {
                setUpdates((prevUpdates) => {
                    // Remove the last entry and prepend the new value
                    const updatedList = [...prevUpdates];
                    updatedList.pop(); // Safely remove the last item
                    return [update.downloaded];
                });
            } else {
                setUpdates((prevUpdates) => [update.message, ...prevUpdates]);
            }
        }
        socketBroker.tryManageMessage(handleMessage)
        socketBroker.startSubscribing()
        // Return in useEffect -> Means when component is unmounting => page closed/changed
        return () => {
            socketBroker.stopConnection();
        };
    }, []);

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-4">
            <h1 className="text-xl font-bold text-center text-gray-800">
                Real-Time Song Updates
            </h1>
            <div className="space-y-2">
                {updates.length > 0 ? (
                    updates.map((update, index) => (
                        <div
                            key={index}
                            className="p-4 bg-blue-100 rounded-lg border border-blue-200"
                        >
                            <p className="text-sm text-gray-700">{update}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">No updates yet...</p>
                )}
            </div>
        </div>
    );
};

export default RealTimeUpdates;
