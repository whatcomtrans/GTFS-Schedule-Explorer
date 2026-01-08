/*
Author: Skyler Crane (cranes2@wwu.edu)
Description: The purpose of this file is to handle the processing and formatting
	of dates.
*/

const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/*
Make a new Date object.
*/
function make_date() {
	return new Date();
}

/*
Returns the current day of the week as a string (ex: "monday") based on 
the given Date object.

date: javascript Date object
*/
function get_current_day(date) {
	let day = date.getDay();
	return DAYS_OF_WEEK[day];
}

/*
Sets the given date object to have the date of the following monday.
This function modifies the date object in-place.

date: javascript Date object
*/
function get_next_monday(date) {
	let day = get_current_day(date);
	let dif = 0;
	switch (day) {
		case "sunday":
			dif = 1;
			break;
		case "monday":
			dif = 0;
			break;
		case "tuesday":
			dif = 6;
			break;
		case "wednesday":
			dif = 5;
			break;
		case "thursday":
			dif = 4;
			break;
		case "friday":
			dif = 3;
			break;
		case "saturday":
			dif = 2;
			break;
	}	
	date.setDate(date.getDate() + dif);
	return date;
}

/*
Sets the given date object to have the date of the following saturday.
This function modifies the date object in-place.

date: javascript Date object
*/
function get_next_saturday(date) {
	let day = get_current_day(date);
	let dif = 0;
	switch (day) {
		case "sunday":
			dif = 6;
			break;
		case "monday":
			dif = 5;
			break;
		case "tuesday":
			dif = 4;
			break;
		case "wednesday":
			dif = 3;
			break;
		case "thursday":
			dif = 2;
			break;
		case "friday":
			dif = 1;
			break;
		case "saturday":
			dif = 0;
			break;
	}	
	date.setDate(date.getDate() + dif);
	return date;
}

/*
Sets the given date object to have the date of the following sunday.
This function modifies the date object in-place.

date: javascript Date object
*/
function get_next_sunday(date) {
	let day = get_current_day(date);
	let dif = 0;
	switch (day) {
		case "sunday":
			dif = 0;
			break;
		case "monday":
			dif = 6;
			break;
		case "tuesday":
			dif = 5;
			break;
		case "wednesday":
			dif = 4;
			break;
		case "thursday":
			dif = 3;
			break;
		case "friday":
			dif = 2;
			break;
		case "saturday":
			dif = 1;
			break;
	}	
	date.setDate(date.getDate() + dif);
	return date;
}

/*
Takes in an integer representing the day of the week, obtained by
calling the getDay() method of a Date object.

Returns a string with the name of the day represented by the given integer.
*/
function getDayOfWeek(dateIndex) { 
    return DAYS_OF_WEEK[dateIndex];
}

/*
Takes in a Date object and returns a string in the format "yyyy-mm-dd"

date: javascript Date object
*/
function format_date_for_input(date) {
	let year = String(date.getFullYear());
	let month = String(date.getMonth() + 1) // returns between 0-11
	let day = String(date.getDate());
	
	if (month.length == 1) {
		month = "0".concat(month);
	}
	if (day.length == 1) {
		day = "0".concat(day);
	}
	
	return year.concat("-", month, "-", day);
}

/*
Takes in two strings in format of "hh:mm" and returns the
time difference between them.

The first string is the scheduled time and the second is the
predicted time. If the predicted time is the same as the scheduled time,
the resulting string will be "on time". If the predicted time is before 
the scheduled time, the resulting string will start with a '-', such as
"-5 mins" if the time is five minutes before. Otherwise, the 
resulting string will start with a '+', such as in
"+2 mins" when the bus is two minutes late.

Update: changing output to "5 min early", "7 min late", "on time"
*/
function get_time_difference(scheduled_time, predicted_time) {
	let scheduled_time_split = scheduled_time.split(':');
	let hour1 = parseInt(scheduled_time_split[0]);
	let min1 = parseInt(scheduled_time_split[1]);
	
	let predicted_time_split = predicted_time.split(':');
	let hour2 = parseInt(predicted_time_split[0]);
	let min2 = parseInt(predicted_time_split[1]);
	
	let hourDif = hour2 - hour1;
	let minDif = min2 - min1;
	
	let early = false;
	
	// ex: get_time_dif(2:01, 1:59)
	if (hourDif == -1) {
		early = true;
		minDif = 60 - minDif;
	}
	
	// ex: get_time_dif(1:50, 1:45)
	else if ((minDif < 0) && (hourDif == 0)) {
		early = true;
	}
	
	// ex: get_time_dif(7:58, 8:00) or get_time_dif(12:59, 1:01)
	else if (((minDif < 0) && (hourDif == 1)) || (hourDif < -1)) {
		minDif += 60;
		hourDif = 0;
	}
	
	hourDif = Math.abs(hourDif);
	minDif = Math.abs(minDif);
	
	let dif = "";
	
	if (minDif == 0) {
		dif = "on time";
	} else if (early) {
		// dif = "-".concat(minDif.toString(), " min");
		dif = minDif.toString().concat(" min early");

	} else {
		// dif = "+".concat(minDif.toString(), " min");
		dif = minDif.toString().concat(" min late");
	}

	return dif;
}

/*
Converts a string in the form "hh:mm:ss" from military time (24 hour)
to a string in the form "hh:mm am/pm" to standard time (12 hour)
*/
function military_to_standard(time) {
	let split = time.split(":")
	let hour = parseInt(split[0]);
	let min = split[1];
	let end = "am";
	if (hour >= 12) {
		end = "pm";
	}
	if (hour > 12) {
		hour = hour - 12;
	}

	return hour.toString().concat(":", min, " ", end);
}

// Export functions for testing purposes 
if (typeof module === 'object') {
	module.exports = {make_date, get_current_day, get_next_monday, get_next_saturday, get_next_sunday, format_date_for_input, get_time_difference, military_to_standard}
}