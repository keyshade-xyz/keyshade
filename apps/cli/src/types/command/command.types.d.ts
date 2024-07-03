export interface CommandOption {
  short: string
  long: string
  description: string
  defaultValue?: string | boolean
}

export interface CommandArgument {
  name: string
  description: string
}

export interface CommandActionData {
  options: Record<string, any>
  args: string[]
}
