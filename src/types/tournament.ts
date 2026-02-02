export interface TournamentData {
  _id?: string
  id?: string
  name: string
  createdAt: string
  rawData?: unknown
  eliminations?: unknown
  [key: string]: unknown
}

export interface Tournament {
  id: string
  name: string
  date: string
  fileName: string
  isSeasonFinal: boolean
  data: TournamentData
}

export interface APITournament {
  id?: string
  externalId?: string
  name: string
  createdAt: string
  rawData?: unknown
  isSeasonFinal?: boolean
}
