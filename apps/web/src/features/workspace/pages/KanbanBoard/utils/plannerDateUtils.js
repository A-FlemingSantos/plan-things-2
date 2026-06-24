export {
  addDaysToDateKey,
  dateKeyFromTimeZoneInstant,
} from '../../../../../shared/utils/dateTime/index.js'

export function timeValueFromIsoInTimeZone(iso, timeZone) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const partByType = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date).map((part) => [part.type, part.value]))

  const hour = partByType.hour
  const minute = partByType.minute
  if (!hour || !minute) return null
  return `${hour}:${minute}`
}

export function timeValueMinutes(value) {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}
