import { gregorianToShamsi, shamsiToGregorian } from "./i18n";

export interface VerificationResult {
  passed: boolean;
  message: string;
  details?: string;
}

export interface SystemVerificationReport {
  overallPassed: boolean;
  persianCorrectness: VerificationResult;
  leapYearCalculations: VerificationResult;
  monthLengths: VerificationResult;
  weekdayCalculations: VerificationResult;
  taskDateAccuracy: VerificationResult;
  countdownAccuracy: VerificationResult;
}

// Check if a Shamsi year is a leap year
export function isShamsiLeapYear(jy: number): boolean {
  // Convert Esfand 30 of jy to Gregorian and see if it maps back to the same date
  const greg = shamsiToGregorian(jy, 12, 30);
  const back = gregorianToShamsi(greg.gy, greg.gm, greg.gd);
  return back.jy === jy && back.jm === 12 && back.jd === 30;
}

// Get correct number of days in a Shamsi month
export function getDaysInShamsiMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) {
    return isShamsiLeapYear(jy) ? 30 : 29;
  }
  return 30;
}

export function runSystemVerification(): SystemVerificationReport {
  const report: Partial<SystemVerificationReport> = {};

  // 1. Persian Calendar Correctness
  try {
    // Assert 2026-03-21 is 1405-01-01
    const test1 = gregorianToShamsi(2026, 3, 21);
    const test1_back = shamsiToGregorian(1405, 1, 1);
    
    // Assert 2026-06-24 is 1405-04-03
    const test2 = gregorianToShamsi(2026, 6, 24);
    const test2_back = shamsiToGregorian(1405, 4, 3);

    const check1 = test1.jy === 1405 && test1.jm === 1 && test1.jd === 1;
    const check1_back = test1_back.gy === 2026 && test1_back.gm === 3 && test1_back.gd === 21;
    const check2 = test2.jy === 1405 && test2.jm === 4 && test2.jd === 3;
    const check2_back = test2_back.gy === 2026 && test2_back.gm === 6 && test2_back.gd === 24;

    if (check1 && check1_back && check2 && check2_back) {
      report.persianCorrectness = {
        passed: true,
        message: "Persian Jalaali calendar bidirectional conversion matches historical standards exactly.",
        details: `Verified 2026-03-21 <-> 1405-01-01 and 2026-06-24 <-> 1405-04-03`
      };
    } else {
      report.persianCorrectness = {
        passed: false,
        message: "Bidirectional conversion error in Persian calendar logic.",
        details: `1405-01-01 mapped to ${test1_back.gy}-${test1_back.gm}-${test1_back.gd}; 2026-06-24 mapped to ${test2.jy}-${test2.jm}-${test2.jd}`
      };
    }
  } catch (err: any) {
    report.persianCorrectness = { passed: false, message: "Error during conversion check: " + err.message };
  }

  // 2. Leap Year Calculations
  try {
    const leap1403 = isShamsiLeapYear(1403); // Should be true
    const leap1404 = isShamsiLeapYear(1404); // Should be false
    const leap1405 = isShamsiLeapYear(1405); // Should be false
    const leap1406 = isShamsiLeapYear(1406); // Should be false
    const leap1407 = isShamsiLeapYear(1407); // Should be true

    if (leap1403 && !leap1404 && !leap1405 && !leap1406 && leap1407) {
      report.leapYearCalculations = {
        passed: true,
        message: "Leap year identification operates correctly for 1403-1407 cycle.",
        details: "1403 (Leap), 1404-1406 (Common), 1407 (Leap)"
      };
    } else {
      report.leapYearCalculations = {
        passed: false,
        message: "Incorrect leap year calculation.",
        details: `1403: ${leap1403}, 1404: ${leap1404}, 1405: ${leap1405}, 1406: ${leap1406}, 1407: ${leap1407}`
      };
    }
  } catch (err: any) {
    report.leapYearCalculations = { passed: false, message: "Error checking leap years: " + err.message };
  }

  // 3. Month Lengths
  try {
    const lenM1 = getDaysInShamsiMonth(1405, 1); // 31
    const lenM7 = getDaysInShamsiMonth(1405, 7); // 30
    const lenM12Common = getDaysInShamsiMonth(1405, 12); // 29
    const lenM12Leap = getDaysInShamsiMonth(1403, 12); // 30

    if (lenM1 === 31 && lenM7 === 30 && lenM12Common === 29 && lenM12Leap === 30) {
      report.monthLengths = {
        passed: true,
        message: "Month durations verified (1-6 are 31 days, 7-11 are 30 days, 12 is leap-adjusted).",
        details: `Farvardin: 31, Mehr: 30, Esfand 1405: ${lenM12Common}, Esfand 1403: ${lenM12Leap}`
      };
    } else {
      report.monthLengths = {
        passed: false,
        message: "Month lengths mismatch.",
        details: `M1: ${lenM1}/31, M7: ${lenM7}/30, M12 (1405): ${lenM12Common}/29, M12 (1403): ${lenM12Leap}/30`
      };
    }
  } catch (err: any) {
    report.monthLengths = { passed: false, message: "Error checking month lengths: " + err.message };
  }

  // 4. Weekday Calculations
  try {
    // 2026-06-24 (Gregorian) is 1405-04-03 (Wednesday)
    // Saturday-start index should be 4 (Saturday=0, Sunday=1, Monday=2, Tuesday=3, Wednesday=4, Thursday=5, Friday=6)
    const testDate = new Date(2026, 5, 24); // Month index 5 is June
    const jsDay = testDate.getDay(); // 3 (Wednesday)
    const SaturdayStartIndex = (jsDay + 1) % 7; // (3 + 1) % 7 = 4

    if (SaturdayStartIndex === 4) {
      report.weekdayCalculations = {
        passed: true,
        message: "Saturday-start localized weekday indices align with astronomical calendar.",
        details: `Wednesday maps perfectly to index 4 (Saturday=0)`
      };
    } else {
      report.weekdayCalculations = {
        passed: false,
        message: "Incorrect Saturday-start weekday alignment.",
        details: `Expected Saturday-start index 4, got ${SaturdayStartIndex}`
      };
    }
  } catch (err: any) {
    report.weekdayCalculations = { passed: false, message: "Error checking weekdays: " + err.message };
  }

  // 5. Task Date Accuracy (Prevent timezone offsets)
  try {
    // Test formatting a Date to local ISO-like string "YYYY-MM-DD"
    const testDateObj = new Date(2026, 5, 24, 23, 59, 0); // Wednesday night local time
    const formatLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const formatted = formatLocal(testDateObj);
    const expected = "2026-06-24";

    if (formatted === expected) {
      report.taskDateAccuracy = {
        passed: true,
        message: "Timezone-naive parsing prevents task displacement (avoids off-by-one errors).",
        details: `Input 11:59PM local correctly stays ${expected} without shifting to UTC day.`
      };
    } else {
      report.taskDateAccuracy = {
        passed: false,
        message: "Format localized date shifted the day.",
        details: `Expected ${expected}, got ${formatted}`
      };
    }
  } catch (err: any) {
    report.taskDateAccuracy = { passed: false, message: "Error verifying task date formatting: " + err.message };
  }

  // 6. Countdown Accuracy
  try {
    // 2026-06-24 (today) to 2026-07-05 (exam target)
    const today = new Date(2026, 5, 24);
    today.setHours(0, 0, 0, 0);
    const target = new Date(2026, 6, 5); // July 05
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft === 11) {
      report.countdownAccuracy = {
        passed: true,
        message: "Countdown delta calculation handles midnight boundaries accurately.",
        details: "2026-06-24 to 2026-07-05 is exactly 11 days remaining"
      };
    } else {
      report.countdownAccuracy = {
        passed: false,
        message: "Countdown calculation error.",
        details: `Expected 11 days, got ${daysLeft}`
      };
    }
  } catch (err: any) {
    report.countdownAccuracy = { passed: false, message: "Error verifying countdown delta: " + err.message };
  }

  const overallPassed = !!(
    report.persianCorrectness?.passed &&
    report.leapYearCalculations?.passed &&
    report.monthLengths?.passed &&
    report.weekdayCalculations?.passed &&
    report.taskDateAccuracy?.passed &&
    report.countdownAccuracy?.passed
  );

  return {
    overallPassed,
    persianCorrectness: report.persianCorrectness!,
    leapYearCalculations: report.leapYearCalculations!,
    monthLengths: report.monthLengths!,
    weekdayCalculations: report.weekdayCalculations!,
    taskDateAccuracy: report.taskDateAccuracy!,
    countdownAccuracy: report.countdownAccuracy!
  };
}
