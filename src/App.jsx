import { useState, useEffect } from 'react';
import { differenceInWeeks, parseISO, differenceInMilliseconds, addWeeks } from 'date-fns';
import './App.css';

function App() {
  const [birthdate, setBirthdate] = useState(localStorage.getItem('birthdate') || '');
  const weeks = Array(80).fill().map(() => Array(52).fill(false));
  const now = new Date();

  useEffect(() => {
    if (birthdate) {
      localStorage.setItem('birthdate', birthdate);
    }
  }, [birthdate]);

  const getWeeksProgress = () => {
    if (!birthdate) return { completedWeeks: 0, currentProgress: 0 };
    const birthdateObj = parseISO(birthdate);
    const completedWeeks = Math.floor(differenceInWeeks(now, birthdateObj));
    
    // Calculate progress since last completed week
    const lastCompletedWeekEnd = addWeeks(birthdateObj, completedWeeks);
    const progressSinceLastWeek = differenceInMilliseconds(now, lastCompletedWeekEnd) / (7 * 24 * 60 * 60 * 1000);
    
    return {
      completedWeeks,
      currentProgress: Math.min(1, Math.max(0, progressSinceLastWeek))
    };
  };

  const { completedWeeks, currentProgress } = getWeeksProgress();

  return (
    <div className="app">
      <h1>LIFE CALENDAR</h1>
      <div className="birthdate-input">
        <label htmlFor="birthdate">Enter your birthdate: </label>
        <input
          type="date"
          id="birthdate"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
      </div>
      <table className="calendar">
        <thead>
          <tr>
            <th></th>
            {Array(52).fill().map((_, i) => (
              <th key={i} className="week-number">{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="year-number">{rowIndex}</td>
              {row.map((_, colIndex) => {
                const weekNumber = rowIndex * 52 + colIndex;
                const isCurrentWeek = weekNumber === completedWeeks;
                const isLived = weekNumber < completedWeeks;
                return (
                  <td key={colIndex} className="box-cell">
                    <div
                      className={`box ${isLived ? 'lived' : ''} ${isCurrentWeek ? 'current' : ''}`}
                      title={`Year ${rowIndex}, Week ${colIndex + 1}`}
                      style={isCurrentWeek ? {
                        background: `linear-gradient(to right, #333 ${currentProgress * 100}%, white ${currentProgress * 100}%)`
                      } : undefined}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App; 