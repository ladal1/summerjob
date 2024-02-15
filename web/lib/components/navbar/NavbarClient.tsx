'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import { signIn, signOut } from 'next-auth/react'
import type { NavPath } from './NavbarServer'

interface NavbarClientProps {
  paths: NavPath[]
  username?: string
}

export function NavbarClient({ paths, username }: NavbarClientProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => setExpanded(!expanded)
  return (
    <>
      <nav className="navbar navbar-light navbar-expand-md smj-gray pt-2 pb-2 mb-0">
        <div className="container-fluid">
          <Link 
            className="navbar-brand d-flex align-items-center" 
            href="/home"
            onClick={() => setExpanded(false)}
          >
            <Image
              src={logoImage}
              className="smj-nav-logo"
              alt="SummerJob logo"
              quality={98}
              priority={true}
            />
          </Link>
          <button
            data-bs-toggle="collapse"
            className="navbar-toggler"
            data-bs-target="#navcol-1"
            onClick={toggleExpanded}
          >
            <span className="visually-hidden">Toggle navigation</span>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className={`collapse navbar-collapse ${expanded ? 'show' : ''}`}
            id="navcol-1"
          >
            <hr/>
            <ul className="navbar-nav me-auto">
              {paths.map(navPath => {
                return (
                  <li className="nav-item" key={navPath.path}>
                    <Link
                      className={
                        'nav-link d-xl-flex align-items-xl-center' +
                        (pathname?.startsWith(navPath.path) ? ' active' : '')
                      }
                      href={navPath.path}
                      onClick={() => setExpanded(false)}
                    >
                      <div className="d-xl-flex justify-content-xl-start align-items-xl-center navbar-div text-truncate rounded-3">
                        <i
                          className={
                            navPath.icon + ' d-xl-flex justify-content-xl-start'
                          }
                        ></i>
                        <span>{navPath.name}</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <hr/>
            <div className='d-flex justify-content-end'>
              {username && (
                <>
                  <button
                    className="btn"
                    id="btn-nav-logout"
                    type="button"
                    onClick={() => signOut()}
                  >
                    <i className="fa-solid fa-right-from-bracket me-2"></i>
                    <span className="hover-text">Odhlásit se</span>
                  </button>
                </>
              )}
              {!username && (
                <>
                  <button
                    className="btn"
                    id="btn-nav-login"
                    type="button"
                    onClick={() => signIn()}
                  >
                    <i className="fa-solid fa-right-to-bracket"></i>
                    <span className="hover-text">Přihlásit</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
