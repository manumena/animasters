export type Song = {
  id: number
  name: string
  anime: string
  type: 'opening' | 'ending' | 'soundtrack'
  number: number
  path: string
}

export type Match = {
  match: Song[]
}
