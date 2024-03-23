import { ExtendedSession, Permission } from 'lib/types/auth'
import { NavbarClient } from './NavbarClient'

export type NavPath = {
  path: string
  name: string
  icon: string
  permissions: Permission[]
}

interface NavbarServerProps {
  session: ExtendedSession | null
}

export function NavbarServer({ session }: NavbarServerProps) {
  const navPaths: NavPath[] = [
    {
      path: '/plans',
      name: 'Plány',
      icon: 'fas fa-calendar-days',
      permissions: [Permission.PLANS],
    },
    {
      path: '/jobs',
      name: 'Joby',
      icon: 'fas fa-person-digging',
      permissions: [Permission.JOBS],
    },
    {
      path: '/cars',
      name: 'Auta',
      icon: 'fas fa-car',
      permissions: [Permission.CARS],
    },
    {
      path: '/workers',
      name: 'Pracanti',
      icon: 'far fa-user',
      permissions: [Permission.WORKERS],
    },
    {
      path: '/admin',
      name: 'Administrace',
      icon: 'fas fa-cogs',
      permissions: [Permission.ADMIN],
    },
    {
      path: '/my-plan',
      name: 'Můj plán',
      icon: 'fas fa-calendar-week',
      permissions: [],
    },
    {
      path: '/profile',
      name: 'Profil',
      icon: 'fas fa-user',
      permissions: [],
    },
  ]

  const availablePaths = navPaths.filter(path => {
    if (path.permissions.length === 0) return true
    if (session?.permissions.includes(Permission.ADMIN)) return true
    return path.permissions.some(permission =>
      session?.permissions.includes(permission)
    )
  })

  return <NavbarClient paths={availablePaths} username={session?.username} />
}
