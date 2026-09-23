/**
 * Détecte si une IP (v4 ou v6) tombe dans une plage privée/loopback/link-local.
 * Arithmétique CIDR simple sur les octets/segments, sans dépendance supplémentaire.
 * Couvre : 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
 * (incluant 169.254.169.254, l'endpoint de métadonnées cloud), 0.0.0.0/8,
 * ::1, fc00::/7, fe80::/10.
 */
export function isPrivateIp(ip: string): boolean {
  // IPv4
  const ipv4Match = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const a = Number(ipv4Match[1])
    const b = Number(ipv4Match[2])

    if (a === 127) return true // 127.0.0.0/8 - loopback
    if (a === 10) return true // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
    if (a === 192 && b === 168) return true // 192.168.0.0/16
    if (a === 169 && b === 254) return true // 169.254.0.0/16
    if (a === 0) return true // 0.0.0.0/8

    return false
  }

  // IPv6
  const normalized = ip.toLowerCase()

  if (normalized === '::1') return true // loopback

  // Adresse IPv4-mappée (::ffff:a.b.c.d) : on vérifie la partie IPv4
  const mappedMatch = normalized.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  if (mappedMatch && mappedMatch[1]) {
    return isPrivateIp(mappedMatch[1])
  }

  const firstGroup = normalized.split(':')[0]
  if (firstGroup && /^[0-9a-f]{1,4}$/.test(firstGroup)) {
    const value = parseInt(firstGroup, 16)
    // fc00::/7 - adresses locales uniques (fc00:: à fdff::)
    if ((value & 0xfe00) === 0xfc00) return true
    // fe80::/10 - link-local
    if ((value & 0xffc0) === 0xfe80) return true
  }

  return false
}
