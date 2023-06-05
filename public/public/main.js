
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
let joinCallButton = document.getElementById('join-call-button');
let roomNameTextBox = document.getElementById('make-join-call').getElementsByTagName('textarea')[0];
let pcState = document.getElementById("pc-state");
let ofState = document.getElementById("of-state");
let anState = document.getElementById("an-state");


arrows.getElementById("up-control").addEventListener("click", ()=>{
    dataChannel.send("up-control","test");
})
arrows.getElementById("left-control").addEventListener("click", ()=>{
    dataChannel.send("left-control","test");
})
arrows.getElementById("down-control").addEventListener("click", ()=>{
    dataChannel.send("down-control","test");
})
arrows.getElementById("right-control").addEventListener("click", ()=>{
    dataChannel.send("right-control","test");
})
document.addEventListener('keydown', (event) => {
    var keyPressed = event.key;
    var code = event;
    dataChannel.send(keyPressed,"message");
    switch (keyPressed) {
        case 'ArrowUp':
            console.log(event.key);
            break;
        case 'ArrowDown':
            console.log(event.key);
            break;
        case 'ArrowLeft':
            console.log(event.key);
            break;
        case 'ArrowRight':
            console.log(event.key);
            break;
    }
});
endCallButton.addEventListener('click', () => { 
    endCall()});
makeCallButton.addEventListener('click', () => {
    init();
    roomName = roomNameTextBox.value;
    joinCall();
    console.log("room name", roomName);
    makeCallButton.style.backgroundColor = "red";
    joinCallButton.disabled = true;

});
joinCallButton.addEventListener('click', () => {
    init();
    roomName = roomNameTextBox.value;
    joinCall();
    console.log("room name", roomName);
    joinCallButton.style.backgroundColor = "green";
    makeCallButton.disabled = true;

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
    peerConnection.addEventListener("connectionstatechange", (state)=>{
        pcState.innerHTML = state.target.connectionState;
        console.log("connectionState: ",state.target.connectionState);
    }
    )
}


async function joinCall() {
    let answer;
    peerConnection.addTransceiver('video', {direction: 'recvonly'});
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
    }, 2500);
    console.log('Offer in db:', offer);
    ofState.innerHTML = "created and in db";
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

    
    
    peerConnection.onicegatheringstatechange = async (event) => {
        console.log(peerConnection.iceGatheringState);
        console.log(event)
        console.log("ICE gathering is over")
    };
    /*const answer = await peerConnection.createAnswer();
    console.log('Created answer:', answer);
    anState.innerHTML = "created and in db"
    await peerConnection.setLocalDescription(answer);
    setTimeout(() => {
        db.collection(roomName).doc("answer").set({
            type: peerConnection.localDescription.type,
            sdp: peerConnection.localDescription.sdp
        });
        console.log('Answer in db(timeout):', answer);
    }, 2500);*/
}
function endCall() {
    if (peerConnection!="closed") {
        if (dataChannel || dataChannel.readyState == "open"){
        dataChannel.send("endcall123455", "test");
        }
        peerConnection.close();
        pcState.innerHTML = peerConnection.connectionState;
        makeCallButton.style.backgroundColor = "white";
        joinCallButton.style.backgroundColor = "white";
        peerConnection = null;
        
        joinCallButton.disabled = false;
        makeCallButton.disabled = false; 
    }
}
