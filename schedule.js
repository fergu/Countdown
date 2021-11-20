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

// FIXME: Might be nice to add some functionality to let the user specify either number of talks or a start/end time and back out the other piece from the provided info
function construct_session_data_from_file(filename) {
	const schedule_toml = parse_schedule_file(filename)
	const schedule_defaults = schedule_toml["session"]["defaults"]
	sessions = []
	for (var [session_key, session] of Object.entries(schedule_toml["session"])) {
		if (session_key == "defaults") { continue }
	
		new_session = Object.assign({}, schedule_defaults)
		new_session = Object.assign(new_session, session)
	
		// Calculate some extra parameters
		new_session["start_date"] = new Date(new_session["start_time"])
		new_session["time_per_talk"] = new_session["talk_length"] + new_session["qa_length"] + new_session["transition_length"]
		new_session["end_date"] = new Date(new_session["start_date"].getTime() + new_session["number_talks"] * new_session["time_per_talk"] * 1000.0 )
		new_session["end_time"] = new_session["end_date"].toString()
		sessions[sessions.length] = new_session
	}
	sessions = get_sorted_sessions(sessions)
	return sessions
}
exports.construct_session_data_from_file = construct_session_data_from_file

function get_sorted_sessions(sessions) {
	//sessions = construct_session_data_from_file(filename)
	sessions.sort((a, b) => a["start_date"].getTime() - b["start_date"].getTime())
	return sessions
}

function check_if_schedule_is_sane(sessions) {
	// FIXME: Probably want to add a check to be sure that number_talks * talk_length == end_date.getTime() - start_date.getTime() for each session
	test_sessions = get_sorted_sessions(sessions)
	try {
		let schedule_is_sane = true
		for (i = 1; i < test_sessions.length; i++  ) {
			this_session = test_sessions[i]
			last_session = test_sessions[i-1]
			if (this_session["start_date"].getTime() < last_session["end_date"].getTime()) {
				schedule_is_sane = false
			}
		}
		return schedule_is_sane
	} catch(e) {
		return false
	}
}
exports.check_if_schedule_is_sane = check_if_schedule_is_sane

function build_full_schedule_from_sessions(sessions) {
	// This function's task is to take the scheduled sessions and fill them out to account for every minute between the first and last session
	// This works pretty well. Next step is probably to have it fill in "talk" + "warning" + "qa" + "transition" as separate blocks
	// This would have the advantage that we can print it all out as a table on one page which makes debugging easier
	// That said, that level of precision probably isn't important, but it does simplify things on the HTML end because we can just check the "type" object to know what colors, etc, to show.
	// I'm thinking the solution will be to basically copy the session data and create a tree
	// Top level = Each block of time (whether entered or filled in by this function)
	// Next level = Each block of time within that block (I.E each talk)
	// Third level = Each block of time within each subblock (I.E parts of each talk, Talk, QA, transition)
	sessions = get_sorted_sessions(sessions)
	full_schedule = []
	for (i = 0; i < sessions.length; i++) {
		this_session = sessions[i]
		this_talk_length = this_session["time_per_talk"]
		for (j = 0; j < this_session["number_talks"]; j++) {
			this_start = this_session["start_date"].getTime() + this_talk_length * j * 1000
			this_end = this_session["start_date"].getTime() + this_talk_length * (j+1) * 1000
			full_schedule[full_schedule.length] = {
				"start_time": new Date(this_start),
				"end_time": new Date(this_end),
				"type": "talk"
			}
		}
		// Now add an entry to fill the "gap" between the end of this session and the start of the next
		if (i < sessions.length - 1) {
			intermediate_start = this_session["end_date"].getTime()
			intermediate_end =	sessions[i+1]["start_date"].getTime()
			full_schedule[full_schedule.length] = {
				"start_time": new Date(intermediate_start),
				"end_time": new Date(intermediate_end),
				"type": "intermediate"
			}
		}
	}
	return full_schedule
}
exports.build_full_schedule_from_sessions = build_full_schedule_from_sessions
