interface PlayerScoreProps {
  name: string
}

export default function PlayerScore({ name }: PlayerScoreProps) {
  return (
    <div>
      {name}
    </div>
  )
}