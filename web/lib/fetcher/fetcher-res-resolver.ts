import { ApiError, ApiErrorSchema } from "lib/types/api-error"

export const resultResolver = async (res: Response, errorMsg: string) => {
  if (!res.ok) {
    const data = await res.json()
    const parsingResult = ApiErrorSchema.safeParse(data.error)
    if (parsingResult.success) {
      throw new ApiError(
        parsingResult.data.reason,
        parsingResult.data.type,
        parsingResult.data.issues
      )
    }
    throw new Error(errorMsg)
  }
  if (res.status === 204 || res.status === 202) {
    return
  }
  return await res.json()
}