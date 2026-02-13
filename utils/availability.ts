import { AvailabilitySlot } from "../types";

const parseTimeToMinutes = (value: string): number | null => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export const validateAvailabilitySlots = (slots: AvailabilitySlot[]) => {
  const errors: string[] = [];
  const seen = new Set<string>();
  let hasDuplicate = false;

  slots.forEach((slot, index) => {
    const startMinutes = parseTimeToMinutes(slot.start);
    const endMinutes = parseTimeToMinutes(slot.end);

    if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
      errors.push(`Schedule ${index + 1}: end time must be after start time.`);
    }

    const daysKey = [...slot.days].sort().join(",");
    const signature = `${slot.start}|${slot.end}|${daysKey}`;
    if (seen.has(signature)) {
      hasDuplicate = true;
    } else {
      seen.add(signature);
    }
  });

  if (hasDuplicate) {
    errors.push("Duplicate availability slots are not allowed.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
