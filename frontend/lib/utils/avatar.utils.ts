const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
]

export function getAvatarColor(name: string): string {
  if (!name) return "bg-gray-400"
  const firstLetter = name.charAt(0).toUpperCase()
  const charCode = firstLetter.charCodeAt(0)
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length]
}
