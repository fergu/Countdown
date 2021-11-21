function pad(str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

function sessionError(e) {
	console.log("Something went wrong updating")
	console.log(e)
}

function initialize() {
	fetchSession().then( (response) => {
			session_table = document.getElementById("session_data_table")
			var headerRow = session_table.insertRow(-1)
			const headerElements = [
				"Type",
				"Start Date",
				"End Date",
				"Number of Talks",
				"Total Time per Talk",
				"Transition Length",
				"Talk Length",
				"Warning Time",
				"QA Length"
			]
			headerHTMLString = ""
			for (j = 0; j < headerElements.length; j++) {
				headerHTMLString += "<th>"+headerElements[j]+"</th>"
			}
			headerRow.innerHTML = headerHTMLString
			for (i = 0; i < response.length; i++) {
				var newRow = session_table.insertRow(-1)
				const thisResponse = response[i]
				const thisSession = thisResponse["session"]
				const sessionType = thisResponse["type"]
				const sessionStart = new Date(thisSession.start_time)
				const sessionEnd = new Date(thisSession.end_time)
				const timePerTalk = thisSession.time_per_talk / 60
				const numberTalks = thisSession.number_of_talks
				const talk_length = thisSession.talk_length / 60
				const warning_time = thisSession.warning_length / 60
				const qa_length = thisSession.qa_length / 60
				const transition_length = thisSession.transition_length / 60

				const rowElements = [
					sessionType,
					sessionStart,
					sessionEnd,
					numberTalks,
					timePerTalk,
					transition_length,
					talk_length,
					warning_time,
					qa_length
				]
				rowHTMLString = ""
				for (j = 0; j < rowElements.length; j++) {
					rowHTMLString += "<td>"+rowElements[j]+"</td>"
				}
				newRow.innerHTML = rowHTMLString
				if (sessionType == "session") {
					for (talkNo = 0; talkNo < numberTalks; talkNo++) {
						talkRow = session_table.insertRow(-1)
						const thisTalk = thisSession.talks[talkNo]
						const talkType = "talk"
						const talkStart = new Date(thisTalk["start_time"])
						const talkEnd = new Date(thisTalk["end_time"])

						const talkRowElements = [
							talkType,
							talkStart,
							talkEnd,
							"-",
							timePerTalk,
							transition_length,
							talk_length,
							warning_time,
							qa_length							
						]
						
						talkRowHTMLString = ""
						for (j = 0; j < talkRowElements.length; j++) {
							talkRowHTMLString += "<td>"+talkRowElements[j]+"</td>"
						}
						talkRow.innerHTML = talkRowHTMLString
					}

				}
			}
		}
	).catch(sessionError);
}

function fetchSession() {
	return new Promise( function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "/fullsession")
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				var response = JSON.parse(xhr.response)
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

