export type Song = {
  id: number
  name: string
  anime: string
  path: string
  type: 'opening' | 'ending' | 'soundtrack'
  number: number
}

export type Match = {
  match: Song[]
}
