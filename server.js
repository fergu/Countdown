// server.js
function pad(str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

function iterate_dictionary() {

}

class aps_session {
	constructor(session_data) {
		this.start_time = new Date(session_data["start_time"])
		this.number_talks = session_data["number_talks"]
		this.talk_length = session_data["talk_length"]
		this.session_name = session_data["name"]
	}

	toString() {
		return "APS Session " + this.session_name + " starting at " + this.start_time
	}

}

const express = require('express');
const path = require('path');
const fs = require('fs')
const toml = require('toml')

//list = require('./request.js');

const offset = (new Date()).getTimezoneOffset()
//Create an app
const app = express();
app.use(express.static(__dirname + '/src'));

schedule_data = fs.readFileSync(__dirname + '/src/schedule.toml')
try {
	schedule_toml = toml.parse(schedule_data)
} catch (e) {
	console.error("Parsing error on line " + e.line + ", column " + e.column + ": " + e.message);
}

console.log("=== SCHEDULE PARSING COMPLETE ===")
const aps_session_defaults = schedule_toml["session"]["defaults"]
console.log(aps_session_defaults)

console.log("=== Individual sessions")
for (var [session_key, session] of Object.entries(schedule_toml["session"])) {
	if (session_key == "defaults") { continue }

	session["name"] = session_key
	for (const [defaults_key, default_value] of Object.entries(aps_session_defaults)) {
		if (!Object.keys(session).includes(defaults_key)) {
			session[defaults_key] = default_value
		}
	}
	new_session = new aps_session(session)
	console.log(new_session.toString())
}

app.get('/time', function (req, res) {
	endDate = new Date(2021, 10, 25, 12, 00, 00, 00)
	//now = new Date()
	//dDate = endDate - now
	//var hours = Math.floor(dDate % (1000*60*60*24)/(1000 * 60 * 60))
	//var minutes = Math.floor(dDate % (1000*60*60)/(1000 * 60))
	//var seconds = Math.floor(dDate % (1000 * 60)/(1000))

	//var paddedHrs  = pad(hours, 2)
	//var paddedMins = pad(minutes,2)
	//var paddedSecs = pad(seconds,2)
	//retString = paddedHrs + ":" + paddedMins + ":" + paddedSecs
	res.send(endDate.toUTCString())	
});

const PORT = 8080;
app.listen(PORT);
console.log(`Running on port ${PORT}`);
