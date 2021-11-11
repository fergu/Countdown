const schedule = require("schedule")

describe("Check that a good schedule can be correctly loaded", () => {
	test("Successfully load a properly formatted schedule file (" + global.good_schedule_path + ")", () => {
		expect(schedule.load_schedule_file(global.good_schedule_path)).toBeDefined();
	});
	
	test("Successfully parse the schedule file", () => {
		expect(schedule.parse_schedule_file(global.good_schedule_path)).toBeDefined();
	});
	
	test("Successfully construct session data", () => {
		expect(schedule.construct_session_data_from_file(global.good_schedule_path)).toBeDefined();
	});

	test("Verify that schedule passes sanity checks", () => {
		sessionData = schedule.construct_session_data_from_file(global.good_schedule_path)
		expect(schedule.check_if_schedule_is_sane(sessionData)).toBe(true);
	});
})

describe("Check that a non-existant schedule fails", () => {
	test("Fail to load a non-existent schedule file (" + global.nonexistent_schedule_path + ")", () => {
		expect( () => { schedule.load_schedule_file(global.nonexistent_schedule_path) } ).toThrow();
	});
	
	test("Fail to parse a non-existent file", () => {
		expect( () => { schedule.parse_schedule_file(global.nonexistent_schedule_path) } ).toThrow();
	});
	
	test("Fail to construct session data for non-existent file", () => {
		expect( () => { schedule.construct_session_data_from_file(global.nonexistent_schedule_path) } ).toThrow();
	});
})

describe("Check that a schedule with a session overlap fails", () => {
	test("Load schedule successfully (" + global.overlap_schedule_path +")", () => {
		expect( () => { schedule.load_schedule_file(global.overlap_schedule_path) } ).toBeDefined();
	});
	
	test("Parse schedule successfully", () => {
		expect( schedule.parse_schedule_file(global.overlap_schedule_path) ).toBeDefined();
	});
	
	test("Construct session data", () => {
		expect( schedule.construct_session_data_from_file(global.overlap_schedule_path) ).toBeDefined();
	});

	test("Fail sanity check", () => {
		sessionData = schedule.construct_session_data_from_file(global.overlap_schedule_path)
		expect( schedule.check_if_schedule_is_sane(sessionData) ).toBe(false);
	});
})

describe("Verify that the user-supplied schedule can be loaded", () => {
	test("Checking that SCHEDULE_FILE environment variable is defined", () => {
		expect(process.env.SCHEDULE_FILE).toBeDefined();
	});


	test("Successfully load the schedule file (" + process.env.SCHEDULE_FILE + ")", () => {
		expect(schedule.load_schedule_file(process.env.SCHEDULE_FILE)).toBeDefined();
	});
	
	test("Successfully parse the schedule file", () => {
		expect(schedule.parse_schedule_file(process.env.SCHEDULE_FILE)).toBeDefined();
	});
	
	test("Successfully construct session data", () => {
		expect(schedule.construct_session_data_from_file(process.env.SCHEDULE_FILE)).toBeDefined();
	});

	test("Ensure Schedule passes sanity checks", () => {
		sessionData = schedule.construct_session_data_from_file(process.env.SCHEDULE_FILE)
		expect(schedule.check_if_schedule_is_sane(sessionData)).toBe(true);
	});
})
