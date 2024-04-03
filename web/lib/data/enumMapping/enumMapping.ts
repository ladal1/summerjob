export type EnumMapping<T extends string | number> = {
  [key in T]: string
}

export interface LabelWithIcon {
  name: string
  icon: string
}
export type EnumMappingWithIcon<T extends string | number> = {
  [key in T]: LabelWithIcon
}
