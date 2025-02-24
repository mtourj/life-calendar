import { useState, useEffect, useMemo } from "react";
import {
  differenceInWeeks,
  parseISO,
  differenceInMilliseconds,
  addWeeks,
  differenceInYears,
  addYears,
  differenceInDays,
} from "date-fns";
import { mortalityData } from "./mortalityData";
import "./App.css";

function App() {
  const [birthdate, setBirthdate] = useState(
    localStorage.getItem("birthdate") || ""
  );
  const [gender, setGender] = useState(localStorage.getItem("gender") || "");

  useEffect(() => {
    if (birthdate) {
      localStorage.setItem("birthdate", birthdate);
    }
  }, [birthdate]);

  useEffect(() => {
    if (gender) {
      localStorage.setItem("gender", gender);
    }
  }, [gender]);

  const {
    completedWeeks,
    currentProgress,
    age,
    initialLifeExpectancy,
    initialLifeExpectancyWeeks,
    stats,
  } = useMemo(() => {
    // Calculate all derived values in one pass
    const progress = !birthdate
      ? { completedWeeks: 0, currentProgress: 0, age: 0 }
      : (() => {
          const now = new Date();
          const birthdateObj = parseISO(birthdate);
          // First get complete years
          const completeYears = differenceInYears(now, birthdateObj);
          // Then get the date after those complete years
          const afterCompleteYears = addYears(birthdateObj, completeYears);
          // Calculate remaining days and convert to weeks
          const remainingDays = differenceInDays(now, afterCompleteYears);
          const remainingWeeks = Math.floor(remainingDays / 7);

          // Calculate total completed weeks (subtract 1 to account for current week)
          const completedWeeks = Math.min(
            completeYears * 52 + remainingWeeks,
            250 * 52
          ); // Max 250 years
          const age = Math.min(completeYears, 250); // Max 250 years

          const progressSinceLastWeek = remainingDays / 7 - remainingWeeks;

          // If we're at the end of the week, move to the next week
          const adjustedCompletedWeeks =
            progressSinceLastWeek >= 1 ? completedWeeks + 1 : completedWeeks;
          const adjustedProgress =
            progressSinceLastWeek >= 1 ? 0 : progressSinceLastWeek;

          return {
            completedWeeks: adjustedCompletedWeeks,
            currentProgress: Math.min(1, Math.max(0, adjustedProgress)),
            age,
          };
        })();

    const lifeExpectancy = !gender
      ? 80
      : mortalityData[gender.toLowerCase()][0].lifeExpectancy;
    const lifeExpectancyWeeks = Math.round(lifeExpectancy * 52);

    const mortalityStats =
      !gender || !birthdate
        ? null
        : (() => {
            const s =
              mortalityData[gender.toLowerCase()]?.[Math.floor(progress.age)];
            return s
              ? {
                  deathProb: (s.deathProb * 100).toFixed(3),
                  lifeExpectancy: s.lifeExpectancy.toFixed(1),
                }
              : null;
          })();

    return {
      ...progress,
      initialLifeExpectancy: lifeExpectancy,
      initialLifeExpectancyWeeks: lifeExpectancyWeeks,
      stats: mortalityStats,
    };
  }, [birthdate, gender]);

  const calendar = useMemo(() => {
    if (!birthdate) return null;

    const totalYears = Math.min(
      250,
      Math.max(Math.ceil(completedWeeks / 52), Math.ceil(initialLifeExpectancy))
    );
    let html = "";

    // Generate header
    html += "<thead><tr><th></th>";
    for (let i = 0; i < 52; i++) {
      html += `<th class="week-number">${i + 1}</th>`;
    }
    html += "</tr></thead><tbody>";

    // Generate rows
    for (let rowIndex = 0; rowIndex < totalYears; rowIndex++) {
      const rowStartWeek = rowIndex * 52;
      let hasContent = false;

      let rowHtml = `<tr><td class="year-number">${rowIndex}</td>`;

      for (let colIndex = 0; colIndex < 52; colIndex++) {
        const weekNumber = rowStartWeek + colIndex;
        const isCurrentWeek = weekNumber === completedWeeks;
        const isLived = weekNumber < completedWeeks;
        const isExtraLife = weekNumber >= initialLifeExpectancyWeeks;

        if (isExtraLife && !isLived && !isCurrentWeek) continue;
        hasContent = true;

        const classes = [
          "box",
          isLived ? "lived" : "",
          isCurrentWeek ? "current" : "",
          isExtraLife ? "extra-life" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const style = isCurrentWeek
          ? `background: linear-gradient(to right, ${
              isExtraLife ? "#ffd700" : "#333"
            } ${currentProgress * 100}%, white ${currentProgress * 100}%)`
          : "";

        rowHtml += `
          <td class="box-cell">
            <div 
              class="${classes}"
              title="Year ${rowIndex}, Week ${colIndex + 1}"
              style="${style}"
            ></div>
          </td>
        `;
      }
      rowHtml += "</tr>";

      if (hasContent) {
        html += rowHtml;
      }
    }

    html += "</tbody>";
    return html;
  }, [
    birthdate,
    completedWeeks,
    currentProgress,
    initialLifeExpectancy,
    initialLifeExpectancyWeeks,
  ]);

  return (
    <div className="app">
      <h1>LIFE CALENDAR</h1>
      <div className="inputs">
        <div className="input-group">
          <label htmlFor="birthdate">Enter your birthdate: </label>
          <input
            type="date"
            id="birthdate"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="gender">Select your gender: </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {stats && (
        <div className="stats">
          <p>Based on your age ({Math.floor(age)} years):</p>
          <ul>
            <li>Probability of dying within one year: {stats.deathProb}%</li>
            <li>
              Life expectancy: {Number(stats.lifeExpectancy) + Math.floor(age)}{" "}
              years ({stats.lifeExpectancy} remaining)
            </li>
            {completedWeeks >= initialLifeExpectancyWeeks && (
              <li className="extra-life-note">
                You've lived{" "}
                {Math.floor((completedWeeks - initialLifeExpectancyWeeks) / 52)}{" "}
                years and {(completedWeeks - initialLifeExpectancyWeeks) % 52}{" "}
                weeks beyond your initial life expectancy!
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="calendar-explanation">
        <p>
          Each box represents one week of your life. Filled boxes show weeks
          you've lived, and the partially filled box shows the current week.
        </p>
      </div>

      <table
        className="calendar"
        dangerouslySetInnerHTML={calendar ? { __html: calendar } : undefined}
      />
    </div>
  );
}

export default App;
