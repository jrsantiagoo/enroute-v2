import { dateKeyOf } from "./time-utils.js";

const toIso = (date) => date.toISOString().slice(0, 10);
const utcDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

function shiftDays(date, days) {
    const shifted = new Date(date);
    shifted.setUTCDate(shifted.getUTCDate() + days);
    return shifted;
}

// Anonymous Gregorian algorithm for Easter Sunday, used to place Holy Week.
function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return utcDate(year, month, day);
}

function lastMondayOf(year, month) {
    const date = utcDate(year, month + 1, 0);
    while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() - 1);
    return date;
}

// Covers fixed-date holidays and Holy Week only.
// Holidays proclaimed each year (Eid'l Fitr, Eid'l Adha, Chinese New Year, extra special days) must be added as KnownEvent rows after checking the official proclamation.
export function philippineHolidays(year) {
    const easter = easterSunday(year);
    const fixed = [
        ["01-01", "New Year's Day", "regular holiday"],
        ["04-09", "Araw ng Kagitingan", "regular holiday"],
        ["05-01", "Labor Day", "regular holiday"],
        ["06-12", "Independence Day", "regular holiday"],
        ["08-21", "Ninoy Aquino Day", "special non-working day"],
        ["11-01", "All Saints' Day", "special non-working day"],
        ["11-30", "Bonifacio Day", "regular holiday"],
        [
            "12-08",
            "Feast of the Immaculate Conception",
            "special non-working day",
        ],
        ["12-25", "Christmas Day", "regular holiday"],
        ["12-30", "Rizal Day", "regular holiday"],
    ].map(([monthDay, name, kind]) => ({
        date: `${year}-${monthDay}`,
        name,
        kind,
    }));

    return fixed.concat([
        {
            date: toIso(lastMondayOf(year, 8)),
            name: "National Heroes Day",
            kind: "regular holiday",
        },
        {
            date: toIso(shiftDays(easter, -3)),
            name: "Maundy Thursday",
            kind: "regular holiday",
        },
        {
            date: toIso(shiftDays(easter, -2)),
            name: "Good Friday",
            kind: "regular holiday",
        },
        {
            date: toIso(shiftDays(easter, -1)),
            name: "Black Saturday",
            kind: "special non-working day",
        },
    ]);
}

// Built-in holidays for the given years merged with manager-added events, as [{ date, name, kind }].
export function getEvents(years, knownEvents = []) {
    const holidays = [...new Set(years)].flatMap(philippineHolidays);
    return [...holidays, ...knownEvents].sort((a, b) =>
        a.date.localeCompare(b.date),
    );
}

export const yearOf = (date) => Number(dateKeyOf(date).slice(0, 4));
