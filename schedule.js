// schedule.js
const path = require('path');
const fs = require('fs')
const toml = require('toml')

function load_schedule_file(filename) {
	try {
		filedata = fs.readFileSync(path.join(__dirname, filename))
		return filedata
	} catch(e) {
		throw("Failed to load \"" + filename + "\"\nError: " + e.toString() )
	}
}
exports.load_schedule_file = load_schedule_file

function parse_schedule_file(filename) {
	try {
		tomldata = toml.parse(load_schedule_file(filename))
		return tomldata
	} catch(e) {
		throw("Failed to parse \"" + filename + "\" as TOML file\nError: " + e.toString())
	}
}
exports.parse_schedule_file = parse_schedule_file

function construct_session_data_from_file(filename) {
	const schedule_toml = parse_schedule_file(filename)
	const schedule_defaults = schedule_toml["session"]["defaults"]
	sessions = []
	for (var [session_key, session] of Object.entries(schedule_toml["session"])) {
		if (session_key == "defaults") { continue }
	
		console.log(schedule_defaults)
		new_session = Object.assign({}, schedule_defaults)
		new_session = Object.assign(new_session, session)
	
		// Calculate some extra parameters
		new_session["start_date"] = new Date(new_session["start_time"])
		new_session["time_per_talk"] = new_session["talk_length"] + new_session["qa_length"] + new_session["transition_length"]
		new_session["end_date"] = new Date(new_session["start_date"].getTime() + new_session["number_talks"] * new_session["time_per_talk"] * 1000.0 )
		new_session["end_time"] = new_session["end_date"].toString()
		sessions[sessions.length] = new_session
	}
	return sessions
}
exports.construct_session_data_from_file = construct_session_data_from_file

function get_sorted_sessions(filename) {
	sessions = construct_session_data_from_file(filename)
	sessions.sort((a, b) => a["start_date"].getTime() - b["start_date"].getTime())
	return sessions
}

function check_if_schedule_is_sane(filename) {
	sessions = get_sorted_sessions(filename)
	let schedule_is_sane = true
	for (i = 1; i < sessions.length; i++  ) {
		this_session = sessions[i]
		last_session = sessions[i-1]
		if (this_session["start_date"].getTime() < last_session["end_date"].getTime()) {
			schedule_is_sane = false
		}
	}
	return schedule_is_sane
}
exports.check_if_schedule_is_sane = check_if_schedule_is_sane

