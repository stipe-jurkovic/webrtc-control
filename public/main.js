let videoStream;
let roomName;
let peerConnection, calleeCandidates, db, audiosender, videosender, icestate, dataChannel;
let stream;
let audiotrack, videotrack;
let caller;
let incomingStream = new MediaStream();
let arrows = document;
let endCallButton = document.getElementById('end-call-button');
let makeCallButton = document.getElementById('make-call-button');
let roomNameTextBox = document.getElementById('make-join-call').getElementsByTagName('textarea')[0];
let pcState = document.getElementById("pc-state");
let ofState = document.getElementById("of-state");
let anState = document.getElementById("an-state");
let localState = document.getElementById("local-state");
let remoteState = document.getElementById("remote-state");


arrows.getElementById("up-control").addEventListener("click", () => {
    if (dataChannel) { dataChannel.send("control-up"); }
})
arrows.getElementById("down-control").addEventListener("click", () => {
    if (dataChannel) { dataChannel.send("control-down"); }
})
arrows.getElementById("left-control").addEventListener("click", () => {
    if (dataChannel) { dataChannel.send("control-left"); }
})
arrows.getElementById("right-control").addEventListener("click", () => {
    if (dataChannel) { dataChannel.send("control-right"); }
})
document.addEventListener('keydown', (event) => {
    var keyPressed = event.key;
    console.log(keyPressed);
    if (dataChannel) {
        dataChannel.send(keyPressed, "message");
        switch (keyPressed) {
            case 'ArrowUp':
                console.log(event.key);
                dataChannel.send("control-up");
                break;
            case 'ArrowDown':
                console.log(event.key);
                dataChannel.send("control-down");
                break;
            case 'ArrowLeft':
                console.log(event.key);
                dataChannel.send("control-left");
                break;
            case 'ArrowRight':
                console.log(event.key);
                dataChannel.send("control-right");
                /*peerConnection.getStats().then((report) => {
                    report.forEach(
                        (stats) => {
                            if (stats.type === 'local-candidate') {
                                console.log('Stat ID:', stats.id);
                                console.log('Type:', stats.type);
                                console.log('State:', stats.state);
                                console.log('Timestamp:', stats.timestamp);
                                console.log('Candidate Type:', stats.candidateType);
                                console.log('Protocol:', stats.protocol);
                                console.log('Address:', stats.address);
                                console.log('Port:', stats.port);
                                console.log('Transport:', stats.transport);
                                console.log("Selected:", stats.selected);
                                console.log('----------------------------------');
                            }
                        }
                    );
                });*/
                break;
        }
    }
});
endCallButton.addEventListener('click', () => {
    endCall()
});
makeCallButton.addEventListener('click', () => {
    init();
    roomName = roomNameTextBox.value;
    makeCall();
    console.log("room name", roomName);
    makeCallButton.style.backgroundColor = "red";

});


/*-------------------------------------------------web rtc ------------------------------------------------------*/
const firebaseConfig = {
    apiKey: "AIzaSyBHz1Ko1En0b3gknSk82e_EAuqRHGs6SSs",
    authDomain: "webrtc-for-robot.firebaseapp.com",
    projectId: "webrtc-for-robot",
    storageBucket: "webrtc-for-robot.appspot.com",
    messagingSenderId: "996101800430",
    appId: "1:996101800430:web:09071d4096d375fc1d8eff",
    measurementId: "G-X31NJB43KV"
};
firebase.initializeApp(firebaseConfig);
db = firebase.firestore();

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: "stun:a.relay.metered.ca:80" },
        { urls: "turn:a.relay.metered.ca:80", username: "dc6a654926f87d93d1d49211", credential: "Oz/UT8fQ+zoK+pgB" },
        { urls: "turn:a.relay.metered.ca:80?transport=tcp", username: "dc6a654926f87d93d1d49211", credential: "Oz/UT8fQ+zoK+pgB" },
        { urls: "turn:a.relay.metered.ca:443", username: "dc6a654926f87d93d1d49211", credential: "Oz/UT8fQ+zoK+pgB" },
        { urls: "turn:a.relay.metered.ca:443?transport=tcp", username: "dc6a654926f87d93d1d49211", credential: "Oz/UT8fQ+zoK+pgB" },
    ]
};


let openMediaDevices = async (constraints) => {
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    return videoStream;
}

function init() {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addEventListener("connectionstatechange", (state) => {
        pcState.innerHTML = state.target.connectionState;
        console.log("connectionState: ", state.target.connectionState);
        if (state.target.connectionState == "connected") {
            console.log(peerConnection.getStats().type);
            peerConnection.getStats().then((report) => {
                report.forEach(
                    (stats) => {
                        if (stats.type === 'local-candidate') {
                            console.log('Stat ID:', stats.id);
                            console.log('Type:', stats.type);
                            console.log('State:', stats.state);
                            console.log('Timestamp:', stats.timestamp);
                            console.log('Candidate Type:', stats.candidateType);
                            console.log('Protocol:', stats.protocol);
                            console.log('Address:', stats.address);
                            console.log('Port:', stats.port);
                            console.log('Transport:', stats.transport);
                            console.log('----------------------------------');
                        }
                    }
                );
            });
        }
    }
    )
    window.addEventListener("gamepadconnected", (e) => {
        var gp = navigator.getGamepads()[e.gamepad.index]
        console.log(
            "Gamepad connected at index %d: %s. %d buttons, %d axes.",
            e.gamepad.index,
            e.gamepad.id,
            e.gamepad.buttons.length,
            e.gamepad.axes.length
        );
        setInterval(() => {
            var gp = navigator.getGamepads()[e.gamepad.index]
            isPressed = gp.buttons[0].pressed;
            gp.buttons.forEach((k, index)=>{
                if (k.pressed){
                console.log(
                    "Gamepad connected at index %d: Button %d was pressed down.",
                    e.gamepad.index,
                    index
                );
                if (dataChannel) {
                    switch (index) {
                        case 12:
                            dataChannel.send("control-up");
                            break;
                        case 13:
                            dataChannel.send("control-down");
                            break;
                        case 14:
                            dataChannel.send("control-left");
                            break;
                        case 15:
                            dataChannel.send("control-right");
                            break;
                    }
                }}
            })}, 100);
    });
}


async function makeCall() {
    let answer;
    peerConnection.addTransceiver('video', { direction: 'recvonly' });
    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('Adding offer candidate...:', event.candidate);
            //callerCandidates.add(event.candidate.toJSON());
        }
        if (event.candidate == null) {
            console.log('Last candidate added');
        }
    };
    dataChannel = peerConnection.createDataChannel("Robot control");
    dataChannel.addEventListener("message", (ev) => {
        console.log(ev.data);
        if (ev.data == "Reconnect46855") {
            endCall();
            init();
            roomName = roomNameTextBox.value;
            makeCall();
            console.log("room name", roomName);
            makeCallButton.style.backgroundColor = "red";
            return;
        }
    })
    peerConnection.ontrack = function (event) {
        console.log('Received new incoming stream');
        incomingStream = event.streams[0];
        console.log(document.getElementById('incoming-video-stream').srcObject = incomingStream);
    };
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Created offer:', offer);
    ofState.innerHTML = "created";
    setTimeout(() => {
        db.collection(roomName).doc("offer").set({
            type: peerConnection.localDescription.type,
            sdp: peerConnection.localDescription.sdp
        });
        console.log('Answer in db(timeout):', peerConnection.localDescription);
        console.log('Offer in db:', offer);
        ofState.innerHTML = "created and in db";
    }, 2500);
    db.collection(roomName).doc("answer").onSnapshot((doc) => {
        if (doc.data()) {
            answer = new RTCSessionDescription(doc.data());
            anState.innerHTML = "recieved and added, deleted from db";
            db.collection(roomName).doc("answer").delete().then(() => { console.log("Answer deleted from db") }).catch((error) => {
                console.error("Answer not deleted from base: ", error);
            });
            peerConnection.setRemoteDescription(answer);
        }

    });



    let iceTransport = peerConnection.getReceivers()[0].transport.iceTransport;
    iceTransport.addEventListener("selectedcandidatepairchange", (event) => {
        console.log(iceTransport);
        console.log("old: ", iceTransport.getSelectedCandidatePair());
        console.log("new: ", event.target.getSelectedCandidatePair());
        localState.innerHTML = event.target.getSelectedCandidatePair().local.type;
        remoteState.innerHTML = event.target.getSelectedCandidatePair().remote.type;
    })

    peerConnection.onicegatheringstatechange = async (event) => {
        console.log(peerConnection.iceGatheringState);
        console.log(event)
        console.log("ICE gathering is over")
    };
}
function endCall() {
    if (peerConnection != "closed") {
        if (dataChannel && dataChannel.readyState == "open") {
            dataChannel.send("endcall123455", "test");
        }
        peerConnection.close();
        pcState.innerHTML = peerConnection.connectionState;
        ofState.innerHTML = "unset";
        anState.innerHTML = "unset";
        makeCallButton.style.backgroundColor = "white";
        peerConnection = null;
    }
}
