'use client'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

interface SwaggerClientPageProps {
  spec: object
}

export default function SwaggerClientPage({ spec }: SwaggerClientPageProps) {
  return <SwaggerUI spec={spec} />
}
