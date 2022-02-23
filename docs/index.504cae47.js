// Declare some globals that we'll need throughout
let activeMeeting, webex;
let textarea = document.getElementById('transcript');
// First, let's wire our form fields up to localStorage so we don't have to
// retype things every time we reload the page.
[
    'access-token',
    'invitee'
].forEach((id)=>{
    const el = document.getElementById(id);
    el.value = localStorage.getItem(id);
    el.addEventListener('change', (event)=>{
        localStorage.setItem(id, event.target.value);
    });
});
// There's a few different events that'll let us know we should initialize
// Webex and start listening for incoming calls, so we'll wrap a few things
// up in a function.
function connect() {
    return new Promise((resolve)=>{
        if (!webex) webex = window.webex = Webex.init({
            config: {
                meetings: {
                    reconnection: {
                        enabled: true
                    }
                }
            },
            credentials: {
                access_token: document.getElementById('access-token').value
            }
        });
        // Register our device with Webex cloud
        if (!webex.meetings.registered) webex.meetings.register()// Sync our meetings with existing meetings on the server
        .then(()=>webex.meetings.syncMeetings()
        ).then(()=>{
            document.getElementById('connection-status').innerText = 'connected';
            // Our device is now connected
            resolve();
        })// This is a terrible way to handle errors, but anything more specific is
        // going to depend a lot on your app
        .catch((err)=>{
            console.error(err);
            // we'll rethrow here since we didn't really *handle* the error, we just
            // reported it
            throw err;
        });
        else // Device was already connected
        resolve();
    });
}
// Similarly, there are a few different ways we'll get a meeting Object, so let's
// put meeting handling inside its own function.
function bindMeetingEvents(meeting) {
    meeting.on('meeting:receiveTranscription:started', (payload)=>{
        textarea.innerHTML += `\n${JSON.stringify(payload)}`;
    });
    meeting.on('meeting:receiveTranscription:stopped', ()=>{
        textarea.innerHTML += `\nNot Receiving transcription anymore!`;
    });
    meeting.on('error', (err)=>{
        console.error(err);
    });
    // Of course, we'd also like to be able to leave the meeting:
    document.getElementById('hangup').addEventListener('click', ()=>{
        meeting.leave();
    });
    return meeting;
}
// Join the meeting and add media
function joinMeeting(meeting) {
    return meeting.join({
        receiveTranscription: true
    }).then(()=>{
        textarea.innerHTML = 'Listening!';
    });
}
// In order to simplify the state management needed to keep track of our button
// handlers, we'll rely on the current meeting global object and only hook up event
// handlers once.
document.getElementById('hangup').addEventListener('click', ()=>{
    if (activeMeeting) activeMeeting.leave();
});
// Now, let's set up incoming call handling
document.getElementById('credentials').addEventListener('submit', (event)=>{
    // let's make sure we don't reload the page when we submit the form
    event.preventDefault();
    // The rest of the incoming call setup happens in connect();
    connect();
});
// And finally, let's wire up dialing
document.getElementById('dialer').addEventListener('submit', (event)=>{
    // again, we don't want to reload when we try to dial
    event.preventDefault();
    const destination = document.getElementById('invitee').value;
    // we'll use `connect()` (even though we might already be connected or
    // connecting) to make sure we've got a functional webex instance.
    connect()// Create the meeting
    .then(()=>webex.meetings.create(destination)
    )// Save meeting
    .then((meeting)=>{
        activeMeeting = meeting;
        return meeting;
    })// Call our helper function for binding events to meetings
    .then(bindMeetingEvents)// Pass the meeting to our join meeting helper
    .then(joinMeeting).catch((error)=>{
        // Report the error
        console.error(error);
    // Implement error handling here
    });
});

//# sourceMappingURL=index.504cae47.js.map
