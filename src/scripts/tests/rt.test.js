const {get_predictions_for_route, get_offset_text_color, getStopTime} = require('../rt');

describe('get_predictions_for_route tests', () => {
  test('Valid route_id does not return null', async () => {
    expect(await get_predictions_for_route("331") == null).toBeFalsy();
  });

  test('Valid route_id does not return empty', async () => {
    expect(await get_predictions_for_route("80X") == []).toBeFalsy();
  });

  test('Invalid stop code', async () => {
    expect(await get_predictions_for_route("11001")).toEqual([]);
  });
});

describe('get_offset_text_color tests', () => {
  test('Prediction for a later time', () => {
    // expect(get_offset_text_color("+5 mins")).toEqual("red");
    expect(get_offset_text_color("5 min late")).toEqual("late");
  }); 

  test('Prediction for an earlier time', () => {
    // expect(get_offset_text_color("-5 mins")).toEqual("orange");
    expect(get_offset_text_color("5 min early")).toEqual("early");
  }); 

  test('Prediction is same as static data', () => {
    // expect(get_offset_text_color("on time")).toEqual("green");
    expect(get_offset_text_color("on time")).toEqual("on_time");
  });

  describe('getStopTime', () => {
    test('returns the departure time if departure is not null', () => {
      const stop = {departure: { time: 1708560000 }, arrival: { time: 1708559400 }};
      
      expect(getStopTime(stop)).toBe(1708560000);
    });
  
    test('returns the arrival time if departure is null', () => {
      const stop = {departure: null, arrival: { time: 1708559400 }};
  
      expect(getStopTime(stop)).toBe(1708559400);
    });
  });
});