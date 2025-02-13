import { NavigationContext } from "@/lib/NavigationProvider"
import { use } from "react"

export default function Sidebar() {
 const { closeMobileNav, isMobileNavOpen} = use(NavigationContext)
 return (
  <>
  {isMobileNavOpen }
  </>
 )
}