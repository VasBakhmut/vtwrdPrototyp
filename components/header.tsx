"use client";

import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["Solutions", "/services/built-in-wardrobes"], ["3D Planner", "/wardrobe-planner"], ["Projects", "/projects"],
  ["How it works", "/how-it-works"], ["Materials", "/materials"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return <header className={`site-header${pathname === "/" ? " home-header" : ""}`}>
    <Link className="wordmark" href="/" aria-label="VT Wardrobes home">VT Wardrobes</Link>
    <nav className="desktop-nav" aria-label="Primary">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
    <Link className="button button-small header-cta" href="/free-quote">Free measure & quote <span aria-hidden>→</span></Link>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={24}/> : <List size={24}/>}</button>
    {open && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile">{links.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href}>{label}</Link>)}<Link onClick={() => setOpen(false)} href="/free-quote">Free measure & quote</Link></nav>}
  </header>;
}
