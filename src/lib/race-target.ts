export function formatRaceTime(totalSeconds: number | "") {
  if (totalSeconds === "" || totalSeconds <= 0) return "";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours === 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function formatRacePace(totalSeconds: number | "") {
  if (totalSeconds === "" || totalSeconds <= 0) return "";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function parseRaceTime(value: string): number | "" {
  const parts = parseClockParts(value, [2, 3]);
  if (!parts) return "";

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseRacePace(value: string): number | "" {
  const parts = parseClockParts(value, [2]);
  if (!parts) return "";

  const [minutes, seconds] = parts;
  return minutes * 60 + seconds;
}

export function equivalentPaceSeconds(timeSeconds: number | "", distanceKm: number | "") {
  if (timeSeconds === "" || distanceKm === "" || distanceKm <= 0) return "";
  return Math.round(timeSeconds / distanceKm);
}

export function equivalentTimeSeconds(paceSecondsPerKm: number | "", distanceKm: number | "") {
  if (paceSecondsPerKm === "" || distanceKm === "" || distanceKm <= 0) return "";
  return Math.round(paceSecondsPerKm * distanceKm);
}

function parseClockParts(value: string, allowedLengths: number[]) {
  const trimmedValue = value.trim();
  const rawParts = trimmedValue.split(":");

  if (!allowedLengths.includes(rawParts.length) || rawParts.some((part) => !/^\d+$/.test(part))) {
    return undefined;
  }

  const parts = rawParts.map(Number);
  if (parts.at(-1)! >= 60 || (parts.length === 3 && parts[1] >= 60)) return undefined;

  const total = parts.reduce((sum, part) => sum + part, 0);
  return total > 0 ? parts : undefined;
}
