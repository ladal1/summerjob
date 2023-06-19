import {Allergy} from "../prisma/client";

export const allergyMapping: {[k in keyof typeof Allergy]: string} = {
    DUST: 'Prach',
    ANIMALS: 'Zvířata',
    HAY: 'Seno',
    POLLEN: 'Pyl',
    MITES: 'Roztoči'
}
