import dayjs from 'dayjs'

/**
 * Format a date as a string.
 *
 * @param {Date|string} date The date to format.
 * @returns {string} The formatted date string.
 *
 * @example
 * formatDate(new Date()) // '5 June, 2022 6:45 PM'
 * formatDate('2022-06-05T18:45:00.000Z') // '5 June, 2022 6:45 PM'
 */
const formatDate: (date: Date | string) => string = (date) => {
  return dayjs(date).format('D MMMM, YYYY h:mm A')
}

export default formatDate
