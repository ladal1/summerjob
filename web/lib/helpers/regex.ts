import XRegExp from "xregexp"

// These regex patterns are basic and can be vague. But they are meant to be the last check if every other check-methods fails. 

export const nameRegex = XRegExp('^[\\p{L}][\\p{L} ]*[\\p{L}]$')

export const phoneRegex = /^((?:\+|00)[0-9]{1,3})?[ ]?[0-9]{3}[ ]?[0-9]{3}[ ]?[0-9]{3}$/