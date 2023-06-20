/**
 * This file is used to extend Zod with OpenAPI support.
 * It is not meant to be used directly, but rather imported in every file that wants to extend Zod with OpenAPI support.
 */

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

const nothing = undefined
export default nothing
