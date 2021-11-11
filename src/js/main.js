function pad(str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

const SessionState = {
	IN_SESSION: 0,
	LAST_SESSION: 1,
	BETWEEN_SESSION: 2,
	ERROR: 3
}

function sessionError(e) {
	console.log("Something went wrong updating")
	console.log(e)
}

var canvas, ctx
const lineWidth = 10
const lineColor = '#FFFFFF'
function initialize() {
	canvas = document.getElementById('progressCanvas')
	ctx = canvas.getContext('2d')
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = lineColor;
	fetchSession().then( response =>
		setInterval(render_page, 1000, response)
	).catch(sessionError);
}

function fetchSession() {
	return new Promise( function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "/session")
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				var now = new Date()
				var response = JSON.parse(xhr.response)
				const isFirstEmpty = (Object.keys(response["current"]).length === 0)
				const isSecondEmpty = (Object.keys(response["next"]).length === 0)
				const encodedMode = 2*isFirstEmpty + isSecondEmpty // This encodes the 4 possible responses as a 2 bit number
				// 0 = current and next responses contain data
				// 1 = current response contains data, next response contains no data
				// 2 = current response contains no data, next response contains data
				// 3 = current and next responses both contain no data
				response["SessionState"] = encodedMode
				resolve(response)
			} else {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			}
		}
		xhr.send();
	});
}

function drawFullCircle(ctx, cx, cy,r) {
	drawPartialCircle(ctx, cx, cy, r, 1.0)
}

function drawPartialCircle(ctx, cx, cy, r, pct) {
	ctx.beginPath();
	ctx.arc(cx, cy, r, 3/2*Math.PI, 3/2*Math.PI + 2 * Math.PI * pct)
	ctx.stroke();
}

function deltaTimeToComponents(time_in_ms) {
	const days = Math.floor(time_in_ms / (1000 * 60 * 60 * 24))
	const hours = Math.floor(time_in_ms % (1000*60*60*24)/(1000*60*60))
	const minutes = Math.floor(time_in_ms % (1000*60*60)/(1000*60));
	const seconds = Math.floor(time_in_ms % (1000*60)/1000);
	return { days:days, hours:hours, minutes:minutes, seconds:seconds }
}
// FIXME: This throws an error in the browser console, but we need it to be able to run any tests. What's the workaround?
exports.deltaTimeToComponents = deltaTimeToComponents

function getTalkNumber(time_remaining_in_ms, sessionData) {
	return Math.floor((time_remaining_in_ms / 1000) / sessionData["time_per_talk"]) + 1
}

function getTalkState(time_remaining_in_ms, sessionData) {
	const time_remaining_in_secs = time_remaining_in_ms / 1000
	// Calculate the time remaining when we go from transition -> talk
	const transition_to_talk = sessionData["time_per_talk"] - sessionData["transition_length"]
	// Calculate the time remaining when we go from talk -> qa
	const transition_to_qa = transition_to_talk - sessionData["talk_length"]

	var sessionState;
	if (time_remaining_in_secs >= transition_to_talk) { // We're in the transition period
		sessionState = "Transitioning to next talk"
	} else if (time_remaining_in_secs >= transition_to_qa) { // We're in the talk period
		sessionState = "Talk in progress"
	} else { // We're in the QA period
		sessionState = "Question/Answer period"
	}

	return sessionState
}

function getStyleParametersForState(talk_state) {

}

function render_current_session(sessionData) {
	document.getElementById('days-time-container').style.display = "none"
	document.getElementById('hours-time-container').style.display = "none"

	var now = new Date();
	const currentSession = sessionData["current"]
	const nextSession = sessionData["next"]
	var startDate = new Date(currentSession["start_date"])
	var endDate = new Date(currentSession["end_date"])
	var talk_number = getTalkNumber(now.getTime() - startDate.getTime(), sessionData)
	// dt = the time left in this talk in milliseconds
	var dt = startDate.getTime() + talk_number * currentSession["time_per_talk"]*1000 - now.getTime();
	sessionState = getTalkState(dt, sessionData)

	// FIXME: Need to change this to calculate time left in the current talk as a function of "part" of the talk (I.E talk, questions, transition)
	transition_period 	= Math.floor(Math.max(dt/1000 - currentSession["talk_length"] - currentSession["qa_length"], 0))
	talk_period			= Math.floor(Math.max(dt/1000 - currentSession["qa_length"], 0))
	qa_period			= Math.floor(Math.max(dt/1000, 0))
	var minutes = 0
	var seconds = 0

	var backgroundColor = "#00FF00"
	var foregroundColor = "#000000"
	if (transition_period > 0) { // This would be the transition period
		backgroundColor = "#000000"
		foregroundColor = "#FFFFFF"
		minutes = Math.floor(transition_period % (60*60) / (60))
		seconds = Math.floor(transition_period % (60) )
		document.getElementById("session-status").innerHTML = "Transitioning to next talk"
	} else if (talk_period > 0 && transition_period == 0) { // This is the talk itself
		minutes = Math.floor(talk_period % (60*60) / 60)
		seconds = Math.floor(talk_period % (60) )
		if (minutes < 5) {
			backgroundColor = "#FFFF00"
			foregroundColor	= "#FF0000"
		}
		if (minutes < 1) {
			backgroundColor = "#FF0000"
			foregroundColor	= "#000000"
		}
		document.getElementById("session-status").innerHTML = "Talk in progress"
	} else if (qa_period > 0 && talk_period == 0 && transition_period == 0) { // This is the QA part
		minutes = Math.floor(qa_period % (60*60) / 60)
		seconds = Math.floor(qa_period % (60) )
		backgroundColor = "#FF0000"
		foregroundColor = "#000000"	
		document.getElementById("session-status").innerHTML = "Question/Answer Period"
	}

	// Now set some page style info
	document.body.style.backgroundColor = backgroundColor;
	document.body.style.color			= foregroundColor;
	ctx.strokeStyle						= foregroundColor;

	var paddedMinutes = pad(minutes,2)
	var paddedSeconds = pad(seconds,2)
	document.getElementById('minutes').innerHTML = paddedMinutes
	document.getElementById('seconds').innerHTML = paddedSeconds
	document.getElementById('session-info-title').innerHTML = "Current Session: " + nextSession["name"]
	document.getElementById('session-info-subtitle').innerHTML = "Talk number " + talk_number + " of " + currentSession["number_talks"]



	// Now draw the "time circles" - one circle for each days, hours, minutes, and seconds
	// Start by clearing the canvas (so that our new drawing actually shows up)
	canvas_center_x = canvas.width / 2.0;
	canvas_center_y = canvas.height / 2.0;

	// FIXME: This doesn't draw quite the way I want when at 0/59 seconds due to the way the compositing works. Basically a full "inner" circle (representing 60 seconds) results in an empty circle drawn on screen
	// Probably need to change the way that the seconds/minutes/hours/days are represented so that "0 minutes" results in an empty circle but 59 minutes results in a nearly full one. Just need to figure out how. Probably a drawing trick or something
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	outerLineWidth = 18;
	innerLineWidth = 14
	ctx.lineWidth = outerLineWidth;
	ctx.strokeStyle = foregroundColor;
	drawFullCircle(ctx, canvas_center_x, canvas_center_y, 100 - ctx.lineWidth/2);
	drawFullCircle(ctx, canvas_center_x, canvas_center_y, 80 - ctx.lineWidth/2);
	drawFullCircle(ctx, canvas_center_x, canvas_center_y, 60 - ctx.lineWidth/2);

	
	ctx.lineWidth = innerLineWidth;
	ctx.strokeStyle = backgroundColor;
	drawPartialCircle(ctx, canvas_center_x, canvas_center_y, 100 - outerLineWidth/2, 1.0 - Math.min(transition_period, currentSession["transition_length"]) / (currentSession["transition_length"] ) );
	drawPartialCircle(ctx, canvas_center_x, canvas_center_y, 80 - outerLineWidth/2, 1.0 - Math.min(talk_period, currentSession["talk_length"]) / (currentSession["talk_length"]  ) );
	drawPartialCircle(ctx, canvas_center_x, canvas_center_y, 60 - outerLineWidth/2, 1.0 - Math.min(qa_period, currentSession["qa_length"]) / (currentSession["qa_length"]  ) );

}

function render_between_session(sessionData) {
	var now = new Date();
	const currentSession = sessionData["current"]
	const nextSession = sessionData["next"]
	var startDate = new Date(nextSession["start_date"])
	var endDate = new Date(nextSession["start_date"])

	var dt = endDate.getTime() - now.getTime();
	const dt_components = deltaTimeToComponents(endDate.getTime() - now.getTime())

	var paddedDays = dt_components["days"].toString();
	var paddedHours =  pad(dt_components["hours"], 2)
	var paddedMinutes = pad(dt_components["minutes"], 2)
	var paddedSeconds = pad(dt_components["seconds"], 2)
	document.getElementById('days').innerHTML = paddedDays
	document.getElementById('hours').innerHTML = paddedHours
	document.getElementById('minutes').innerHTML = paddedMinutes
	document.getElementById('seconds').innerHTML = paddedSeconds

	document.getElementById('session-info-title').innerHTML = "Next Session: " + nextSession["name"]
	document.getElementById('session-info-subtitle').innerHTML = "Next Session Begins in:" // Want to use a single space just to make sure it is always full height
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: sessionData['current']['timeZone'], timeZoneName: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric'};
	document.getElementById('session-status').innerHTML = (new Date(sessionData["next"]["start_date"])).toLocaleDateString('en-US', options)
	// Now set some page style info
	document.body.style.backgroundColor = "black";
	document.body.style.color			= "white";

	// Now draw the "time circles" - one circle for each days, hours, minutes, and seconds
	// Start by clearing the canvas (so that our new drawing actually shows up)
	canvas_center_x = canvas.width / 2.0;
	canvas_center_y = canvas.height / 2.0;

	// FIXME: This doesn't draw quite the way I want when at 0/59 seconds due to the way the compositing works. Basically a full "inner" circle (representing 60 seconds) results in an empty circle drawn on screen
	// Probably need to change the way that the seconds/minutes/hours/days are represented so that "0 minutes" results in an empty circle but 59 minutes results in a nearly full one. Just need to figure out how. Probably a drawing trick or something
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.lineWidth = lineWidth;
	drawFullCircle(ctx, canvas_center_x, canvas_center_y, 100 - lineWidth/2);
	drawFullCircle(ctx, canvas_center_x, canvas_center_y, 80 - lineWidth/2);
	drawFullCircle(ctx, canvas_center_x, canvas_center_y, 60 - lineWidth/2);
	drawFullCircle(ctx, canvas_center_x, canvas_center_y, 40 - lineWidth/2);

	
	ctx.lineWidth = 7;
	drawPartialCircle(ctx, canvas_center_x, canvas_center_y, 100 - lineWidth/2, (days+1) / 31 );
	drawPartialCircle(ctx, canvas_center_x, canvas_center_y, 80 - lineWidth/2, (hours+1) / 24 );
	drawPartialCircle(ctx, canvas_center_x, canvas_center_y, 60 - lineWidth/2, (minutes+1) / 60 );
	drawPartialCircle(ctx, canvas_center_x, canvas_center_y, 40 - lineWidth/2, (seconds+1) / 60 );
}

function render_page(sessionData) {
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: sessionData['current']['timeZone'], timeZoneName: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric'};
	document.getElementById('current-time-container').innerHTML = new Date().toLocaleDateString('en-US', options)

	if (sessionData["SessionState"] == SessionState.IN_SESSION) {
		render_current_session(sessionData)
	} else if (sessionData["SessionState"] == SessionState.BETWEEN_SESSION) {
		render_between_session(sessionData)
	}
}

