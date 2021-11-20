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
			for (i = 0; i < response.length; i++) {
				var newRow = session_table.insertRow(-1)
				newRow.innerHTML = response[i]["type"]
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

