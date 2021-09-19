function pad(str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

var endTime;
$.get("/time", function(response) {
	endTime = new Date(response);
});


var interval = setInterval(function() {
	var now = new Date();
	var dt = endTime.getTime() - now.getTime();
	var hours = Math.floor(dt % (1000*60*60*24)/(1000*60*60))
	var minutes = Math.floor(dt % (1000*60*60)/(1000*60));
	var seconds = Math.floor(dt % (1000*60)/1000);

	var paddedHrs =  pad(hours, 2)
	var paddedMins = pad(minutes,2)
	var paddedSecs = pad(seconds,2)
	document.getElementById('Background').innerHTML = paddedHrs + ":" + paddedMins + ":" + paddedSecs

	/*if (minutes < 5) {
		document.body.style.backgroundColor = "yellow"
		document.getElementById('Background').style.color = "black"
	}

	if (minutes < 1) {
		document.body.style.backgroundColor = "red"
		document.getElementById('Background').style.color = "white"
	}

	if (minutes < 0) {
		document.body.style.backgroundColor = "black"
		document.getElementById('Background').innerHTML = "00:00"
		clearInterval(interval)
	}*/
}, 1000)
