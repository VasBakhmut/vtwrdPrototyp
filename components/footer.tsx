import Link from "next/link";
import { business } from "@/lib/site-data";
import { ChatCircle, Phone } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  return <footer className="footer">
    <div className="footer-brand"><Link className="footer-mark" href="/">VT Wardrobes</Link><p>Custom wardrobes for<br/>Melbourne homes.</p></div>
    <nav className="footer-nav" aria-label="Footer"><Link href="/services/built-in-wardrobes">About</Link><Link href="/how-it-works">Process</Link><Link href="/materials">Materials</Link><Link href="/projects">Gallery</Link><Link href="/free-quote">Contact</Link><Link href="/guides/wardrobe-cost-melbourne">Advice</Link></nav>
    <div className="footer-actions"><a href={business.phoneHref}><Phone/> Call</a><button type="button"><ChatCircle/> Chat</button></div>
    <p className="footer-service">Servicing metropolitan Melbourne<br/><Link href="/areas/brighton">Bayside</Link> / <Link href="/areas/berwick">South-East</Link> / All suburbs</p>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} VT Wardrobes. All rights reserved.</span><span>Privacy · Terms</span><b>Melbourne crafted. A calmer everyday.</b></div>
  </footer>;
}
