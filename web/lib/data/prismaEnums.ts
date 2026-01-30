import {
  AllergySchema,
  ApplicationStatusSchema,
  FoodAllergySchema,
  JobTypeSchema,
  PostTagSchema,
  SkillBringsSchema,
  SkillHasSchema,
  ToolNameSchema,
  WorkAllergySchema,
} from 'lib/prisma/zod'

// Lightweight enum-like constants derived from Zod schemas to avoid bundling Prisma on the client.
export const JobType = JobTypeSchema.enum
export type JobType = keyof typeof JobType

export const ToolName = ToolNameSchema.enum
export type ToolName = keyof typeof ToolName

export const PostTag = PostTagSchema.enum
export type PostTag = keyof typeof PostTag

export const SkillHas = SkillHasSchema.enum
export type SkillHas = keyof typeof SkillHas

export const SkillBrings = SkillBringsSchema.enum
export type SkillBrings = keyof typeof SkillBrings

export const WorkAllergy = WorkAllergySchema.enum
export type WorkAllergy = keyof typeof WorkAllergy

export const FoodAllergy = FoodAllergySchema.enum
export type FoodAllergy = keyof typeof FoodAllergy

export const Allergy = AllergySchema.enum
export type Allergy = keyof typeof Allergy

export const ApplicationStatus = ApplicationStatusSchema.enum
export type ApplicationStatus = keyof typeof ApplicationStatus
