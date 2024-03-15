import { createTools, deleteTools, updateTools } from 'lib/data/tools'
import logger from 'lib/logger/logger'
import { ExtendedSession } from 'lib/types/auth'
import { APILogEvent } from 'lib/types/logger'
import {
  ToolCreateData,
  ToolsCreateData,
  ToolsUpdateData,
} from 'lib/types/tool'

export enum ToolType {
  ON_SITE = 'ON_SITE',
  TO_TAKE_WITH = 'TO_TAKE_WITH',
}

export const registerTools = async (
  toolsCreate: ToolsCreateData | undefined,
  toolsIdsDeleted: string[] | undefined,
  jobId: string,
  toolType: ToolType,
  session: ExtendedSession
) => {
  if (toolsIdsDeleted !== undefined) {
    await logger.apiRequest(
      APILogEvent.TOOL_DELETE,
      'tools',
      toolsIdsDeleted,
      session
    )
    await deleteTools(toolsIdsDeleted)
  }
  if (toolsCreate !== undefined) {
    const { withId, withoutId } = toolsCreate.tools.reduce(
      (result, toolItem) => {
        if (toolItem.id) {
          result.withId.push(toolItem)
        } else {
          result.withoutId.push(toolItem)
        }
        return result
      },
      { withId: [] as ToolCreateData[], withoutId: [] as ToolCreateData[] }
    )
    if (withoutId) {
      const tools: ToolsCreateData = {
        tools: withoutId.map(toolItem => ({
          ...toolItem,
          proposedJobOnSiteId: toolType === ToolType.ON_SITE ? jobId : null,
          proposedJobToTakeWithId:
            toolType === ToolType.TO_TAKE_WITH ? jobId : null,
        })),
      }
      if (tools.tools.length !== 0) {
        await logger.apiRequest(
          APILogEvent.TOOL_CREATE,
          'tools',
          tools,
          session
        )
        await createTools(tools)
      }
    }
    if (withId) {
      const tools: ToolsUpdateData = {
        tools: withId
          .filter(
            toolItem => toolItem.id && !toolsIdsDeleted?.includes(toolItem.id)
          )
          .map(toolItem => ({
            ...toolItem,
            proposedJobOnSiteId: toolType === ToolType.ON_SITE ? jobId : null,
            proposedJobToTakeWithId:
              toolType === ToolType.TO_TAKE_WITH ? jobId : null,
          })),
      }
      if (tools.tools && tools.tools.length !== 0) {
        await logger.apiRequest(
          APILogEvent.TOOL_UPDATE,
          'tools',
          tools,
          session
        )
        await updateTools(tools)
      }
    }
  }
}
