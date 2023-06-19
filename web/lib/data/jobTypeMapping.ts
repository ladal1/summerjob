import {JobType} from "../prisma/client";

export const jobTypeMapping: {[k in keyof typeof JobType]: string} = {
    WOOD: 'Dřevo',
    PAINTING: 'Malování',
    HOUSEWORK: 'Pomoc doma',
    GARDEN: 'Práce na zahradě',
    OTHER: 'Ostatní'
}
