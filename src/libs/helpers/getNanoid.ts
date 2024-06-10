import { nanoid } from 'nanoid'

export function getNanoid(id?: any) {
  if (id && typeof id == 'string') {
    return id
  }
  return nanoid()
}
