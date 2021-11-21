// server.js
const express = require('express');
const path = require('path');
const fs = require('fs')
const toml = require('toml')

const schedule = require("./schedule")

//Create an app
const app = express();
app.use(express.static(__dirname + '/src'));

function get_most_recent_session_index(sessions) {
	now = new Date().getTime()
	currentIndex = -1
	for (var i = 0; i < sessions.length; i++) {
		session = sessions[i]
		if (now > session["start_date"].getTime()) {
			currentIndex = i
		}
	}
	return currentIndex;
}
exports.get_most_recent_session_index = get_most_recent_session_index

function print_session_data(sessions) {
	process.stdout.write("========================== SORTED SESSION LIST ===========================\n")
	process.stdout.write("== (You probably want to be sure these are listed in the correct order) ==\n")
	process.stdout.write("==========================================================================\n")
	for (const session of sessions) {
		session_str = ""
		session_str += `Session ${session["name"]}\n`
		session_str += `\t${session["number_of_talks"]} talks comprising:\n`
		session_str += `\t\t${session["talk_length"]/60}\tminute talk\n`
		session_str += `\t\t${session["qa_length"]/60}\tminute Q/A\n`
		session_str += `\t\t${session["transition_length"]/60}\tminute transition\n`
		session_str += `\t\t==============\n`
		session_str += `\t\t${session["time_per_talk"]/(60)}\tminutes/talk\n`
		session_str += `\tSession Length:\t${session["time_per_talk"]*session["number_of_talks"]/(60)} minutes\n`
		session_str += `\tSession Start :\t${session["start_date"]}\n`
		session_str += `\tSession End   :\t${session["end_date"]}\n\n`
		process.stdout.write(session_str)
	}
}

sessions = schedule.construct_session_data_from_file(process.env.SCHEDULE_FILE)
full_schedule = schedule.build_full_schedule_from_sessions(sessions)
for (i = 0; i < full_schedule.length; i++) {
	console.log(full_schedule[i])
}
//print_session_data(sessions)

console.log("Visit localhost:8080/debug.html to view session data, etc")
/*************/
/* ENDPOINTS */
/*************/
app.get('/session', function (req, res) {
	current_index = get_most_recent_session_index(sessions)
	now = new Date()
	current_session = {}
	next_session = {}
	if (current_index == -1) { // If we're before any session has started
		current_session = {}
		next_session = sessions[0]
	} else if (now.getTime() > (new Date(sessions[current_index]["end_date"])).getTime()) { // If the most recently started session has already ended
		current_session = {}
		next_session = sessions[current_index + 1]
	} else { // FIXME: Need to add another if-statement to catch the case where current_index is the last session (in which case "next" should be {})
		current_session = sessions[current_index]
		next_session = sessions[current_index + 1]
	}
	res.send({"current": current_session, "next" : next_session, "server-time" : now.getTime()})
});

app.get('/fullsession', function (req, res) {
	res.send(JSON.stringify(full_schedule))
});
const PORT = 8080;
app.listen(PORT);
process.stdout.write(`Running on port ${PORT}\n`);
