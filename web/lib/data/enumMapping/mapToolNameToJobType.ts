import { JobType } from "lib/prisma/client";

// TODO
const toolToJobTypeMapping: Record<string, (keyof typeof JobType)[]> = {
  AXE: ['WOOD', 'PAINTING'],
  BOW_SAW: ['WOOD'],
};

export const mapToolNameToJobType = (id: string) => {
  return toolToJobTypeMapping[id] || ['OTHER']
};