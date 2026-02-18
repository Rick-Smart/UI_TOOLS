const quarterMeta = [
  { q: 1, label: "Q1", months: "Jan–Mar", startMonth: 0, endMonth: 2 },
  { q: 2, label: "Q2", months: "Apr–Jun", startMonth: 3, endMonth: 5 },
  { q: 3, label: "Q3", months: "Jul–Sep", startMonth: 6, endMonth: 8 },
  { q: 4, label: "Q4", months: "Oct–Dec", startMonth: 9, endMonth: 11 },
];

const quarterEndMonth = [2, 5, 8, 11];

export const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatRange(start, end) {
  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
}

function firstSundayOfMonth(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const offset = (7 - firstDay.getDay()) % 7;
  return new Date(year, monthIndex, 1 + offset);
}

function quarterStartDate(year, quarter) {
  const meta = quarterMeta[quarter - 1];
  return firstSundayOfMonth(year, meta.startMonth);
}

function nextQuarter(info) {
  if (info.quarter === 4) {
    return { year: info.year + 1, quarter: 1 };
  }
  return { year: info.year, quarter: info.quarter + 1 };
}

export function previousQuarter(info) {
  if (info.quarter === 1) {
    return { year: info.year - 1, quarter: 4 };
  }
  return { year: info.year, quarter: info.quarter - 1 };
}

export function getQuarterInfo(year, quarter) {
  const meta = quarterMeta[quarter - 1];
  const start = quarterStartDate(year, quarter);
  const next = nextQuarter({ year, quarter });
  const nextStart = quarterStartDate(next.year, next.quarter);
  const end = new Date(nextStart);
  end.setDate(end.getDate() - 1);

  return {
    year,
    quarter,
    label: meta.label,
    months: meta.months,
    start,
    end,
  };
}

export function lastCompletedQuarter(date) {
  const claimDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const startYear = claimDate.getFullYear() - 2;
  const endYear = claimDate.getFullYear() + 1;

  let latestCompleted = null;
  for (let year = startYear; year <= endYear; year += 1) {
    for (let quarter = 1; quarter <= 4; quarter += 1) {
      const info = getQuarterInfo(year, quarter);
      if (info.end < claimDate) {
        if (!latestCompleted || info.end > latestCompleted.end) {
          latestCompleted = info;
        }
      }
    }
  }

  if (!latestCompleted) {
    return { year: claimDate.getFullYear() - 1, quarter: 4 };
  }

  return {
    year: latestCompleted.year,
    quarter: latestCompleted.quarter,
  };
}

export function getQuarterCloseLagDays(year, quarter) {
  const endMonth = quarterEndMonth[quarter - 1];
  const monthEnd = new Date(year, endMonth + 1, 0);

  if (monthEnd.getDay() === 6) {
    return null;
  }

  const lagStart = new Date(monthEnd);
  lagStart.setDate(monthEnd.getDate() - monthEnd.getDay());

  return { start: lagStart, end: monthEnd };
}
