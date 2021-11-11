const page = require("../src/js/main.js")

function componentsToMilliseconds(days, hours, minutes, seconds) {
	return days * 24 * 60 * 60 * 1000 +
			hours * 60 * 60 * 1000 +
			minutes * 60 * 1000 +
			seconds * 1000;
}

describe("HTML Page Javascript", () => {
	describe("Delta Time -> Components Functionality", () => {
		nComponentTests = 1000
		components = []
		for (var i = 0; i < nComponentTests; i++) {
			days = Math.floor(Math.random() * 30)
			hours = Math.floor(Math.random() * 24)
			minutes = Math.floor(Math.random() * 60)
			seconds = Math.floor(Math.random() * 60)
			deltaTime = componentsToMilliseconds(days, hours, minutes, seconds)
						
			components.push([days, hours, minutes, seconds, deltaTime])
		}
		// Also add some manual tests just to be sure
		components.push([0, 0, 0, 0, componentsToMilliseconds(0, 0, 0, 0)])
		components.push([1, 0, 0, 0, componentsToMilliseconds(1, 0, 0, 0)])
		components.push([0, 1, 0, 0, componentsToMilliseconds(0, 1, 0, 0)])
		components.push([0, 0, 1, 0, componentsToMilliseconds(0, 0, 1, 0)])
		components.push([0, 0, 0, 1, componentsToMilliseconds(0, 0, 0, 1)])

		test.each(components)(
			'Verify deltaTimeToComponents returns %i days, %i hours %i minutes %i seconds for %i milliseconds', (days, hours, minutes, seconds, deltaTime) => {
				expect(page.deltaTimeToComponents(deltaTime)).toStrictEqual({days:days, hours:hours, minutes:minutes, seconds:seconds})
			}
		)
	});
})
