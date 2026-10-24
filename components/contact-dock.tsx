"use client";

import Link from "next/link";
import { ChatCircleDots, Phone, X } from "@phosphor-icons/react";
import { useState } from "react";
import { business } from "@/lib/site-data";

export function ContactDock() {
  const [chat, setChat] = useState(false);
  return <>
    {chat && <aside className="chat-panel" aria-label="AI wardrobe assistant">
      <div className="chat-head"><div><strong>AI wardrobe assistant</strong><span>Guidance, not a final quote</span></div><button onClick={() => setChat(false)} aria-label="Close chat"><X size={20}/></button></div>
      <div className="chat-body"><p>Hi, I can help you choose a wardrobe type, prepare measurements or start a quote.</p><button>Help me choose</button><button>How do I measure?</button><Link href="/free-quote">Start a free quote</Link></div>
      <form className="chat-input" onSubmit={(e) => e.preventDefault()}><label className="sr-only" htmlFor="chat-message">Message</label><input id="chat-message" placeholder="Ask about your wardrobe"/><button type="submit">Send</button></form>
    </aside>}
    <div className="contact-dock"><a href={business.phoneHref}><Phone size={19}/> <span>Call</span></a><button onClick={() => setChat(!chat)} aria-expanded={chat}><ChatCircleDots size={19}/> <span>Chat</span></button><Link href="/free-quote" className="dock-quote">Free quote</Link></div>
  </>;
}
