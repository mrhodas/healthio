
	
	var main  = function() {
	console.log("I should exist");
	    var currentView;
	    var previousView;
	    var webSocket;
	    var groupId;
	    var clientId;
	    var timeout;
	    var connectionCounter;

	    var watchid;
	    var pollingAcc
	    var accCounter;
	    var accData;
	    var calibrationFactor;


	    document.addEventListener('deviceready', init, false);

	    //var socket = io();
	    //var roomAlex = io('/alex');
	    var room;
	    $('form').submit(function() {
	        var pid = $('#pid').val();

			console.log("we're in form submit");
	        //If Empty then use selector option
	        if (pid == "") {
	            var e = document.getElementById("mySelect");
	            pid = e.options[e.selectedIndex].text;
	        }

	        //Display pid
	        $('#roomid').text(pid);

	        //Reset list view
	        $('#messages-alert').empty();


	        setupRoom(pid);
	        return false;
	    });
	    // socket.on('message', recieveMessage);
	    // room.on('alert', recieveAlert);
	    function setupRoom(roomID) {
			var room = io.connect('https://heathio-server-tagger94.c9users.io:8080/' + roomID);
	        //room = io('/' + roomID);
	        console.log("set room to " + roomID);
	        room.on('connect', function(socket) {
	            console.log("Connected room to server");
				
	        });
	        room.on('disconnect', function(msg) {
	            console.log("disconnect from server");
	        });
	        //Setup Alert message
	        room.on('alert', recieveAlert);
	    }

	    function recieveAlert(message) {
	        console.log(message);
			alert("Alert: " + message.pid + " reported: " + message.type, acknowledged, "Confirm", ["OK"]);
			//navigator.notification.notify("Alert: " + message.pid + " Reported: " + message.type, acknowledged, "Confirm", ["OK"]);
	        $('#messages-alert').append($('<li>').text("Alert: " + message.pid + " reported: " + message.type));
	    }
	};


	function init() {
	    console.log('deviceready');

	    currentView = undefined;
	    previousView = undefined;
	    webSocket = undefined;
	    groupId = undefined;
	    clientId = undefined;
	    timeout = undefined;
	    connectionCounter = undefined;
	    watchid = undefined;
	    pollingAcc = false;
	    accData = {
	        x: [0, 0, 0, 0, 0],
	        y: [0, 0, 0, 0, 0],
	        z: [0, 0, 0, 0, 0]
	    };
	    calibrationFactor = 0;


	    document.addEventListener("backbutton", onBackKeyDown, false);

	    // Render the home view
	    renderHomeView();
	    document.getElementById('pairButton').disabled = true;
	    document.getElementById('pairInput').disabled = true;
	    document.getElementById('message').innerHTML = "No connection";
	    document.getElementById('message').style.color = '#DC0000';

	    // Connect to websocket
	    //websocketConnect();
	}

	function websocketConnect() {
	    // Ensure only one connection is open at a time
	    if (webSocket !== undefined && webSocket.readyState !== WebSocket.CLOSED) {
	        console.log("WebSocket is already opened");
	        checkPairingCode();
	        return;
	    }

	    webSocket = new WebSocket("ws://heathio-server-tagger94.c9users.io");
	    timeout = setTimeout(connectionFailed, 2000);
	    console.log("Connecting to WebSocket");
	    webSocket.onopen = function(event) {


	        if (event == undefined) {

	            return;
	        }

	        console.log("Websocket Connection opened at ws://heathio-server-tagger94.c9users.io")
	        clearTimeout(timeout);
	        connectionCounter = 0;

	    }

	    webSocket.onmessage = function(event) {

	        console.log("Message recieved from server:");
	        console.log('%C' + event.data + 'color: #4CAF50');
	        var data;
	        try {
	            data = JSON.parse(event.data);
	        }
	        catch (e) {
	            return;
	        }

	        switch (data.messageType) {
	            case "set-clientid":
	                setClientId(data);
	                break
	            case "join-group":
	                joinGroup(data);
	                break;
	            case "context-list":
	                updateGameList(data);
	                renderGameSelectView();
	                break;
	            case "context-selected":
	                console.log("Server recieved choice");
	                break;
	            case "controller-snapshot":
	                console.log("Server recieved input");
	                break;
	            case "emergency-message":
	                console.log("Recieved a chat message");
	                generateEmergencyNotification(data);
	            case "notify":
	                generateNormalNotification(data);
	                break;
	            case "quit-app":
	                console.log("A user has disconnected");
	                break;
	            case "error":
	                serverError(data);
	                break;
	            case "disconnect":
	                reset();
	                break;
	            default:
	                console.log("messagetype not recognized");
	        }

	        // When the websocket is closed
	        webSocket.onclose = function(event) {
	            console.log('WebSocket closed, attempting to reconnect');
	            connectionFailed();
	        }
	    }
	}
	
	function acknowledged(room){
		console.log(room.roomID)
		
	}

	function connectionFailed() {
	    switch (currentView) {
	        case "home":
	            document.getElementById('message').innerHTML = "Attempting to reconnect";
	            document.getElementById('message').style.color = 'DC0000';
	            document.getElementById('message').className = "blink";
	            break;
	        case "select":
	            document.getElementById('message').innerHTML = "Attempting to reconnect";
	            document.getElementById('message').style.color = '4CAF50';
	            document.getElementById('message').className = "blink";
	            break;
	        default:
	            break;
	    }


	    connectionCounter = connectionCounter + 1;
	    if (connectionCounter < 15) {
	        webSocket();
	    }
	    else {
	        navigator.notification.confirm("Unable to reach the server for 30 seconds, would you like to reset the controller?", onResetControllerDialog, "Reset Controller", ["Yes", "Cancel"]);
	    }
	}

	function onResetControllerDialog(buttonIndex) {
	    if (buttonIndex === 1) {
	        reset();
	    }
	    else {
	        connectionCounter = 0;
	        websocketConnect;
	    }

	}

	function reset() {
	    console.log("Resetting");
	    stopAcc();
	    init();
	}

	function onBackKeyDown() {
	    stopAcc();
	    switch (currentView) {
	        case "home":
	            navigator.app.exitApp();
	            break;
	        case "select":
	            navigator.notification.confirm("Would you like the leave the session", onLeaveSessionDialog, "End Session", ["Yes", "Cancel"]);
	            break;
	        case "portrait":
	            //if (previousView === "debug") {
	              //  renderDebugView();
	            //}
	            //else {
	                navigator.notification.confirm("are you sure you want to leave?", onEndAppDialog, "End Session", ["Yes", "Cancel"]);
	            //}
	            break;
	        case "landscape":
	            //if (previousView === "debug") {
	            //    renderDebugView();
	            //}
	            //else {
	                navigator.notification.confirm("are you sure you want to leave?", onEndAppDialog, "End Session", ["Yes", "Cancel"]);
	            //}
	            break;
	        //case "debug":
	            //renderSelectView();
	        //    break;
	        default:
	            navigator.exitApp();
	    }
	}

	function onEndAppDialog(buttonIndex) {

	    if (buttonIndex === 1) { // confirm
	        console.log("Stopping notification service");
	        var data = {
	            "groupId": groupId,
	            "clientId": clientId,
	            "sourceType": "controller",
	            "messageType": "quit-game"
	        }
	        console.log("Sending data to server:");
	        console.log('%c' + JSON.stringify(data), 'color: #0080FF');
	        webSocket.send(JSON.stringify(data));
	        renderGameSelectView();
	    }
	    else {
	        return;
	    }
	}

	function onLeaveSessionDialog(buttonIndex) {
	    if (buttonIndex === 1) { // confirm
	        console.log("Leaving this session");
	        var data = {
	            "groupId": groupId,
	            "clientId": clientId,
	            "sourceType": "controller",
	            "messageType": "disconnect"
	        }
	        console.log("Sending data to server:");
	        console.log('%c' + JSON.stringify(data), 'color: #0080FF');
	        webSocket.send(JSON.stringify(data));
	        reset();
	    }
	    else {
	        return;
	    }
	}

	function generateEmergencyNotification(data) {
	    text = data.content.message;

	    var data = {
	        "groupId": groupId,
	        "clientId": clientId,
	        "sourceType": "controller",
	        "messageType": "emergency-message"
	    }
	    navigator.notification.confirm("Emergency your patient has " + text, onEndGameDialog, text, ["Yes"])
	    if (buttonIndex === 1) { // confirm
	        console.log("Client acknowledged the alert");
	        console.log('%c' + JSON.stringify(data), 'color: #0080FF');
	        webSocket.send(JSON.stringify(data));
	        renderGameSelectView();
	    }
	    else {
	        return;
	    }
	}

	function generateNormalNotification(data) {
	    text = data.content.message;

	    var data = {
	        "groupId": groupId,
	        "clientId": clientId,
	        "sourceType": "controller",
	        "messageType": "notify"
	    }
	    navigator.notification.confirm("Emergency your patient has " + text, onEndGameDialog, text, ["Yes"])
	    if (buttonIndex === 1) { // confirm
	        console.log("Client acknowledged the alert");
	        console.log('%c' + JSON.stringify(data), 'color: #0080FF');
	        webSocket.send(JSON.stringify(data));
	        renderGameSelectView();
	    }
	    else {
	        return;
	    }
	}
	/*
	(renderHomeView function() {
		var html =
				"<div class='header'><h1>Home</h1></div>" +
				"<div class='search-view'>" +
				"<input  class='search-key'/>" + 
				"<ul class= 'employee-list' > </ul>" +
				"</div>"
		$('body').html(html);
		$('.search-key').on('keyup', $proxy(this.findByName, this))
	},

    showAlert function (message, title) {
        if (navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(title ? (title + ": " + message) : message);
        }
    },

    findByName function() {
        console.log('findByName');
        this.store.findByName($('.search-key').val(), function(employees) {
            var l = employees.length;
            var e;
            $('.employee-list').empty();
            for (var i=0; i<l; i++) {
                e = employees[i];
                $('.employee-list').append('<li><a href="#employees/' + e.id + '">' + e.firstName + ' ' + e.lastName + '</a></li>');
            }
        });
    },

    initialize function() {
        var self = this;
        this.store = new MemoryStore(function() {
            self.showAlert('Store Initialized', 'Info');
			self.renderHomeView();
        });
        $('.search-key').on('keyup', $.proxy(this.findByName, this));
    }
	*/
		main();
	
	
	