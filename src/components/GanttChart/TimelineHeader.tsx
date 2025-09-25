import React from 'react';
import { format, addDays, getMonth, getYear, startOfMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  totalDays: number;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  startDate,
  endDate,
  dayWidth,
  totalDays,
}) => {
  // Group days by month for the header
  const months: { month: string; days: number; startDay: number }[] = [];
  let currentMonth = getMonth(startDate);
  let currentYear = getYear(startDate);
  let monthDays = 0;
  let monthStartDay = 0;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const month = getMonth(date);
    const year = getYear(date);

    if (month !== currentMonth || year !== currentYear) {
      months.push({
        month: format(addDays(startDate, i - 1), 'MMM yyyy'),
        days: monthDays,
        startDay: monthStartDay,
      });
      currentMonth = month;
      currentYear = year;
      monthStartDay = i;
      monthDays = 1;
    } else {
      monthDays++;
    }
  }

  // Add the last month
  months.push({
    month: format(endDate, 'MMM yyyy'),
    days: monthDays,
    startDay: monthStartDay,
  });

  return (
    <div style={{ width: `${totalDays * dayWidth}px` }}>
      {/* Month headers */}
      <div className="flex border-b border-border bg-muted/50">
        {months.map((month, index) => (
          <div
            key={index}
            className="border-r border-border px-2 py-1 text-sm font-medium"
            style={{ width: `${month.days * dayWidth}px` }}
          >
            {month.month}
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="flex bg-card">
        {Array.from({ length: totalDays }, (_, i) => {
          const date = addDays(startDate, i);
          const dayOfMonth = format(date, 'd');
          const dayOfWeek = format(date, 'EEE');
          const today = isToday(date);

          return (
            <div
              key={i}
              className={cn(
                "border-r border-border text-center relative",
                today && "bg-gantt-today/10"
              )}
              style={{ width: `${dayWidth}px` }}
            >
              <div className="text-xs font-medium py-1">{dayOfMonth}</div>
              {dayWidth > 30 && (
                <div className="text-xs text-muted-foreground pb-1">
                  {dayOfWeek.substring(0, 2)}
                </div>
              )}
              {today && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gantt-today" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineHeader;