function parseDateComponents(dateString) {
  // Expects format: YYYY-MM-DDTHH:mm:ss (e.g., "2025-10-05T14:00:00")
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  return { year, month, day, hour, minute, second };
}

function createUTCDate(components) {
  return new Date(
    Date.UTC(
      parseInt(components.year, 10),
      parseInt(components.month, 10) - 1,
      parseInt(components.day, 10),
      parseInt(components.hour, 10),
      parseInt(components.minute, 10),
      parseInt(components.second, 10),
    ),
  );
}

function convertToTimezone(dateString, timezone) {
  try {
    const components = parseDateComponents(dateString);
    if (!components) {
      console.error('Invalid date format');
      return null;
    }

    const utcDate = createUTCDate(components);

    const formatter = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = Object.fromEntries(
      formatter.formatToParts(utcDate).map(({ type, value }) => [type, value]),
    );

    const targetTimeInUTC = createUTCDate(components);
    const formattedTimeInUTC = createUTCDate({
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
    });

    const offsetCorrection = targetTimeInUTC.getTime() - formattedTimeInUTC.getTime();

    const finalUTCDate = new Date(utcDate.getTime() + offsetCorrection);

    return finalUTCDate;
  } catch (error) {
    console.error('Error converting date to timezone:', error);
    return null;
  }
}

function getTimeFromDays(days) {
  const hours = 24;
  const minutes = 60;
  const seconds = 60;
  const milliseconds = 1000;
  return days * hours * minutes * seconds * milliseconds;
}

function getTimeRemaining(now, endDate) {
  if (!endDate || !(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
    return {
      timeRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  if (!now || !(now instanceof Date) || Number.isNaN(now.getTime())) {
    return {
      timeRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  let timeRemaining = endDate.valueOf() - now.valueOf();
  if (timeRemaining < 0) timeRemaining = 0;

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  return {
    timeRemaining,
    days,
    hours,
    minutes,
    seconds,
  };
}

export { convertToTimezone, getTimeFromDays, getTimeRemaining };
