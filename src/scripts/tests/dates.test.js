const {get_current_day, get_next_monday, get_next_saturday, get_next_sunday, format_date_for_input, get_time_difference, military_to_standard} = require('../dates');

/* Tests for get_current_day function */
describe('get_current_day tests', () => {
  test('correct day', () => {
    let date = new Date(2024, 9, 15, 12); // 2024 October 15th 12pm
    expect(get_current_day(date)).toEqual('tuesday');
  });
  
  test('incorrect day', () => {
    let date = new Date(2024, 6, 12, 1); // 2024 July 12th 1am

    //Expect comparison to return false
    expect(get_current_day(date) === 'sunday').toBeFalsy();
  });
});

/* Tests for format_date_for_input function */
describe('format_date_for_input tests', () => {
  test('correct date format', () => {
    let date = new Date(2024, 9, 15, 22); // 2024 October 15th 11pm
    expect(format_date_for_input(date)).toEqual("2024-10-15");
  });
  
  test('incorrect date format', () => {
    let date = new Date(2025, 8, 1, 22); // 2025 Septmeber 1st 11pm
    //Expect comparison to return false
    expect(format_date_for_input(date) === "2025-08-01").toBeFalsy();
  });
  
  test('incorrect date format', () => {
    let date = new Date(2025, 8, 1, 22); // 2025 Septmeber 1st 11pm
    //Expect comparison to return false
    expect(format_date_for_input(date) === "2025-9-1").toBeFalsy();
  });

  test('single digits', () => {
      let date = new Date(2024, 0, 5, 22); // 2024 Jan 5th
      let formatted_date = format_date_for_input(date)
      expect(formatted_date).toEqual("2024-01-05");
  })
})

// Tests for get_next_monday function
describe('get_next_monday tests', () => {
    test('input is Sunday', () => {
        let date = new Date(2024, 9, 13); // 2024 October 13th -> Sunday
        let nextMonday = get_next_monday(date);
        expect(nextMonday.getDate()).toEqual(14);
        expect(get_current_day(nextMonday)).toEqual('monday');
    });

    test('input is Monday', () => {
        let date = new Date(2024, 9, 14); // 2024 October 14th -> Monday
        let nextMonday = get_next_monday(date);
        expect(nextMonday.getDate()).toEqual(14);
        expect(get_current_day(nextMonday)).toEqual('monday');
    });

    test('input is Tuesday', () => {
        let date = new Date(2024, 9, 15); // 2024 October 15th -> Tuesday
        let nextMonday = get_next_monday(date);
        expect(nextMonday.getDate()).toEqual(21);
        expect(get_current_day(nextMonday)).toEqual('monday');
    });
});

// Tests for get_next_saturday function
describe('get_next_saturday tests', () => {
    test('input is Sunday', () => {
        let date = new Date(2024, 9, 13); // 2024 October 13th -> Sunday
        let nextSaturday = get_next_saturday(date);
        expect(nextSaturday.getDate()).toEqual(19);
        expect(get_current_day(nextSaturday)).toEqual('saturday');
    });

    test('input is Saturday', () => {
        let date = new Date(2024, 9, 19); // 2024 October 19th -> Saturday
        let nextSaturday = get_next_saturday(date);
        expect(nextSaturday.getDate()).toEqual(19);
        expect(get_current_day(nextSaturday)).toEqual('saturday');
    });

    test('input is Wednesday', () => {
        let date = new Date(2024, 9, 16); // 2024 October 16th -> Wednesday
        let nextSaturday = get_next_saturday(date);
        expect(nextSaturday.getDate()).toEqual(19);
        expect(get_current_day(nextSaturday)).toEqual('saturday');
    });
});

// Tests for get_next_sunday function
describe('get_next_sunday tests', () => {
    test('input is Sunday', () => {
        let date = new Date(2024, 9, 13); // 2024 October 13th -> Sunday
        let nextSunday = get_next_sunday(date);
        expect(nextSunday.getDate()).toEqual(13);
        expect(get_current_day(nextSunday)).toEqual('sunday');
    });

    test('input is Wednesday', () => {
        let date = new Date(2024, 9, 16); // 2024 October 16th -> Wednesday
        let nextSunday = get_next_sunday(date);
        expect(nextSunday.getDate()).toEqual(20);
        expect(get_current_day(nextSunday)).toEqual('sunday');
    });

    test('input is Saturday', () => {
        let date = new Date(2024, 9, 19); // 2024 October 19th -> Saturday
        let nextSunday = get_next_sunday(date);
        expect(nextSunday.getDate()).toEqual(20);
        expect(get_current_day(nextSunday)).toEqual('sunday');
    });
});

/* Tests for get_time_difference function */

test('predicted time is earlier than scheduled time', () => {
  let s_time = '5:15 pm'; 
  let p_time = '5:02 pm';
  expect(get_time_difference(s_time, p_time)).toEqual("13 min early");
})

test('predicted time is later than scheduled time', () => {
  let s_time = '11:15 am'; 
  let p_time = '11:20 am';
  expect(get_time_difference(s_time, p_time)).toEqual("5 min late");
})

test('predicted time is in previous hour than scheduled time', () => {
  let s_time = '2:05 pm'; 
  let p_time = '1:55 pm';
  expect(get_time_difference(s_time, p_time)).toEqual("10 min early");
})

test('predicted time in hour after scheduled time', () => {
  let s_time = '11:59 am'; 
  let p_time = '12:01 pm';
  expect(get_time_difference(s_time, p_time)).toEqual("2 min late");
  s_time = '4:57 pm'; 
  p_time = '5:01 pm';
  expect(get_time_difference(s_time, p_time)).toEqual("4 min late");
  s_time = '12:59 pm';
  p_time = '1:01 pm';
  expect(get_time_difference(s_time, p_time)).toEqual("2 min late");
})

test('predicted time is the same as scheduled time', () => {
  let s_time = '11:15'; 
  let p_time = '11:15';
  expect(get_time_difference(s_time, p_time)).toEqual("on time");
})

/* Military (default) to standard time conversion */

test('test unchanged times', () => {
	expect(military_to_standard("1:00:00")).toEqual("1:00 am");
	expect(military_to_standard("11:55:10")).toEqual("11:55 am");
	expect(military_to_standard("12:05:00")).toEqual("12:05 pm");
});

test('test changed times', () => {
	expect(military_to_standard("13:00:00")).toEqual("1:00 pm");
	expect(military_to_standard("23:59:00")).toEqual("11:59 pm");
});