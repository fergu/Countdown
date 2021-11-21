// schedule.js
const path = require('path');
const fs = require('fs')
const toml = require('toml')

class Session {
	constructor(session_data) {
		this.name = session_data["name"]
		this.start_time = session_data["start_time"]
		this.end_time = session_data["end_time"]
		this.time_per_talk = session_data["time_per_talk"]
		this.number_of_talks = session_data["number_of_talks"]
		this.talk_length = session_data["talk_length"]
		this.warning_length = session_data["warning_length"]
		this.qa_length = session_data["qa_length"]
		this.transition_length = session_data["transition_length"]
		this.session_data = session_data
		this.talks = []
	}
}

class Intermission {
	constructor(start_time, end_time) {
		this.start_time = start_time
		this.end_time = end_time
	}
}

class Talk {
	constructor(parent_session, start_time) {
		this.start_time = start_time
		this.talk_time = this.start_time + parent_session.transition_length * 1000
		this.warn_time = this.talk_time + (parent_session.talk_length - parent_session.warning_length) * 1000
		this.qa_time = this.warn_time + parent_session.warning_length * 1000
		this.end_time = this.qa_time + parent_session.qa_length * 1000
	}
}

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
		new_session["start_date"] = new Date(new_session["start"])
		new_session["start_time"] = new_session["start_date"].getTime()
		new_session["time_per_talk"] = new_session["talk_length"] + new_session["qa_length"] + new_session["transition_length"]
		new_session["end_date"] = new Date(new_session["start_time"] + new_session["number_of_talks"] * new_session["time_per_talk"] * 1000.0 )
		new_session["end_time"] = new_session["end_date"].getTime()
		new_session["end"] = new_session["end_date"].toString()
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
		full_session_talks = []
		this_session = new Session(sessions[i])
		this_talk_length = this_session.time_per_talk
		this_number_talks = this_session.number_of_talks
		for (j = 0; j < this_number_talks; j++) {
			this_start = this_session.start_time + this_talk_length * j * 1000
			this_talk = new Talk(this_session, this_start)
			full_session_talks[full_session_talks.length] = this_talk
		}
		this_session.talks = full_session_talks
		full_schedule[full_schedule.length] = {"session": this_session, "type": "session"}
		// Now add an entry to fill the "gap" between the end of this session and the start of the next
		if (i < sessions.length - 1) {
			intermediate_start = sessions[i]["end_time"]
			intermediate_end =	sessions[i+1]["start_time"]
			this_intermission = new Intermission(intermediate_start, intermediate_end)
			full_schedule[full_schedule.length] = {"session": this_intermission, "type": "intermission"}
		}
	}
	return full_schedule
}
exports.build_full_schedule_from_sessions = build_full_schedule_from_sessions
