let robotName;
let peerConnection, db, dataChannel, unsubscribe;
let stream;
let incomingStream = new MediaStream();
let endCallButton = document.getElementById('end-call-button');
let connectButton = document.getElementById('connect-button');
let robotNameTextBox = document.getElementById('robot-name');
let robotPasswordTextBox = document.getElementById('robot-password');

let RTTState = document.getElementById("RTT-state");
let pcState = document.getElementById("pc-state");
let ofState = document.getElementById("of-state");
let anState = document.getElementById("an-state");
let localState = document.getElementById("local-state");
let remoteState = document.getElementById("remote-state");

Array.from(document.getElementsByClassName("control-button")).forEach((button) => {
    button.addEventListener("click", () => {
        id = button.id;
        switch (id) {
            case "up-control":
                control = "control-up";
                break;
            case "down-control":
                control = "control-down";
                break;
            case "stop-control":
                control = "control-stop";
                break;
            case "left-control":
                control = "control-left";
                break;
            case "right-control":
                control = "control-right";
                break;
        }
        if (dataChannel) { dataChannel.send(control); }
    })
})
document.addEventListener('keydown', (event) => {
    var keyPressed = event.key.toLowerCase();
    console.log(keyPressed);
    if (dataChannel && dataChannel.readyState == "open") {
        switch (keyPressed) {
            case "w":
            case 'arrowup':
                dataChannel.send("control-up");
                break;
            case "x":
            case 'arrowdown':
                dataChannel.send("control-down");
                break;
            case "a":
            case 'arrowleft':
                dataChannel.send("control-left");
                break;
            case "d":
            case 'arrowright':
                dataChannel.send("control-right");
                break;
            case "s":
                dataChannel.send("control-stop");
        }
    }
});
endCallButton.addEventListener('click', () => {
    endCall()
});
connectButton.addEventListener('click', () => { connect() });
robotPasswordTextBox.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
        connect();
    }
})

function connect() {
    if (!peerConnection || peerConnection.connectionState != "connected") {
        resetInfo();
        if (robotNameTextBox.value != '' && robotPasswordTextBox.value != '') {
            init();
            robotName = robotNameTextBox.value;
            makeCall();
            console.log("room name", robotName);
            connectButton.style.backgroundColor = "mediumturquoise";
            
        }
    }

}

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

function init() {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addEventListener("connectionstatechange", (state) => {
        pcState.innerHTML = state.target.connectionState;
        console.log("connectionState: ", state.target.connectionState);
        if (state.target.connectionState == "connected") {
            connectButton.style.backgroundColor = "green";
            unsubscribe();
        }
        else if (state.target.connectionState == "new" || state.target.connectionState == "connecting"){
            connectButton.style.backgroundColor = "light blue";
        }
        else if (state.target.connectionState == "disconnected"){
            connectButton.style.backgroundColor = "red";
        }
        else if (state.target.connectionState == "closed" || state.target.connectionState == "failed"){
            connectButton.style.backgroundColor = "";
        }
    });
    window.addEventListener("gamepadconnected", (e) => {
        navigator.getGamepads()[e.gamepad.index]
        let i = 0, j = 0;
        console.log(
            "Gamepad connected at index %d: %s.",
            e.gamepad.index, e.gamepad.id
        );
        setInterval(() => {
            var gp = navigator.getGamepads()[e.gamepad.index];
            gp.axes.forEach((k, index) => {
                if ((k.toFixed(2) > 0.2 || k.toFixed(2) < -0.2) && (index == 2 || index == 3)) {
                    //console.log("Value with Fixed Number of Decimal Places:", k.toFixed(2));
                    //console.log("Value with Precision:", k.toPrecision(3));

                    let joyconX;
                    let joyconZ;
                    joyconX = "joyX" + (gp.axes[2] >= 0 ? "+" : "-") + Math.abs(gp.axes[2]).toFixed(2);
                    joyconZ = "joyZ" + (gp.axes[3] >= 0 ? "+" : "-") + Math.abs(gp.axes[3]).toFixed(2) + joyconX;
                    console.log(joyconZ);
                    dataChannel.send(joyconZ);
                    j = 1;
                }
                else {
                    if (j == 1) {
                        console.log("joyZ+0.00joyX+0.00");
                        dataChannel.send("joyZ+0.00joyX+0.00");
                        j = 0;
                    }
                }
            })
            gp.buttons.forEach((k, index) => {
                if (k.pressed && dataChannel && dataChannel.readyState == "open") {
                    switch (index) {
                        case 0:
                            dataChannel.send("control-stop");
                            break;
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
                }
            })
        }, 100);
    });
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Kod koji se izvršava na upravljaču
async function heartbeat() {
    while (true) {
        if (dataChannelRTT && dataChannelRTT.readyState == "open") {
            dataChannelRTT.send(Date.now());
        }
        await sleep(1000);
    }
}


async function makeCall() {
    let answer;
    peerConnection.addTransceiver('video', { direction: 'recvonly' });
    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('Found offer candidate...:', event.candidate);
        }
        if (event.candidate == null) {
            console.log('Last candidate added');
        }
    };
    peerConnection.ontrack = function (event) {
        console.log('Received new incoming stream', event);
        incomingStream = event.streams[0];
        console.log(document.getElementById('incoming-video-stream').srcObject = incomingStream);
    };
    peerConnection.onicegatheringstatechange = async (event) => {
        console.log(peerConnection.iceGatheringState, event)
        console.log("ICE gathering is over")
    };
    dataChannel = peerConnection.createDataChannel("Robot control");
    dataChannelRTT = peerConnection.createDataChannel("RTT");
    dataChannel.addEventListener("message", (ev) => {
        console.log(ev.data);
        if (ev.data == "Reconnect46855") {
            endCall();
            resetInfo();
            sleep(200);
            init();
            console.log(robotName);
            robotName = robotNameTextBox.value;
            makeCall();
            connectButton.style.backgroundColor = "red";
            return;
        }
    });

    dataChannelRTT.addEventListener("message", (ev) => {
        RTT = Date.now() - ev.data;
        console.log(RTT);
        RTTState.innerHTML = RTT;
    });
    heartbeat();


    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Created offer:', offer);
    ofState.innerHTML = "created";

    setTimeout(() => {
        db.collection(robotName).doc("offer").set({
            type: peerConnection.localDescription.type,
            sdp: peerConnection.localDescription.sdp,
            password: robotPasswordTextBox.value
        });
        console.log('Offer in db(timeout):', peerConnection.localDescription);
        ofState.innerHTML = "Created and in Database";
    }, 2500);
    unsubscribe = db.collection(robotName).doc("answer").onSnapshot((doc) => {
        if (doc.data()) {
            answer = new RTCSessionDescription(doc.data());
            anState.innerHTML = "recieved and added, deleted from db";
            db.collection(robotName).doc("answer").delete().then(() => {
                console.log("Answer deleted from db")
            }).catch((error) => {
                console.error("Answer not deleted from base: ", error);
            });
            peerConnection.setRemoteDescription(answer);
        }
    });

    let iceTransport = peerConnection.getReceivers()[0].transport.iceTransport;
    iceTransport.addEventListener("selectedcandidatepairchange", (event) => {
        console.log(iceTransport);
        localState.innerHTML = event.target.getSelectedCandidatePair().local.type;
        remoteState.innerHTML = event.target.getSelectedCandidatePair().remote.type;
    })

}
function resetInfo() {
    RTTState.innerHTML = "none";
    ofState.innerHTML = "none";
    anState.innerHTML = "none";
    pcState.innerHTML = "none";
    localState.innerHTML = "none";
    remoteState.innerHTML = "none";
    connectButton.style.backgroundColor = "";
    peerConnection = null;
}
function endCall() {
    if (peerConnection.connectionState != "closed") {
        if (dataChannel && dataChannel.readyState == "open") {
            dataChannel.send("endcall123455");
        }
        peerConnection.close();
        pcState.innerHTML = peerConnection.connectionState;
        resetInfo();
    }
}
