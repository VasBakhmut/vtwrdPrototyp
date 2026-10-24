"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readSavedDesign } from "@/lib/planner-layouts";
import { buildPlannerResult, customerSummary } from "@/lib/planner-result";

const projectTypes = ["Built-in wardrobe", "Walk-in wardrobe", "Wardrobe interiors", "Sliding doors", "Hinged wardrobe", "Supply only", "Not sure"];
const needs = ["Hanging space", "Shelves", "Drawers", "Shoe storage", "Mirror doors"];

export function QuoteForm() {
  const [plannerSummary,setPlannerSummary]=useState<ReturnType<typeof customerSummary>|null>(null);
  useEffect(()=>{
    if(new URLSearchParams(window.location.search).get('source')!=='planner')return;
    try{
      const raw=localStorage.getItem('vt-wardrobe-design-v2');
      if(!raw)return;
      const design=readSavedDesign(JSON.parse(raw).design);
      if(design)setPlannerSummary(customerSummary(buildPlannerResult(design)));
    }catch{/* Quote form remains available without a saved design. */}
  },[]);
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [project, setProject] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const toggleNeed = (need: string) => setSelectedNeeds(v => v.includes(need) ? v.filter(n => n !== need) : [...v, need]);
  if (sent) return <div className="quote-success" role="status"><p className="eyebrow">Request received</p><h2>Thank you. Your reference is VT-{Math.floor(1000 + Math.random() * 8999)}.</h2><p>Your project details are ready for the VT Wardrobes team. A summary will be emailed once the backend is connected, and a person will contact you using your preferred method.</p><div><Link className="button" href="/wardrobe-planner">Open saved design</Link><Link className="text-link" href="/">Return home →</Link></div></div>;
  return <form className="quote-form" onSubmit={(e) => { e.preventDefault(); if (step < 4) setStep(step + 1); else setSent(true); }}>
    {plannerSummary&&<section aria-label="Your planner design"><h2>Your saved design</h2><p>{plannerSummary.room} · {plannerSummary.shape} · {plannerSummary.dimensions.widthMm} mm wide · {plannerSummary.finish}</p><p>{plannerSummary.includes.internalShelves} internal shelves · {plannerSummary.includes.drawers} drawers · {plannerSummary.includes.hangingRails} hanging rails</p><p>{plannerSummary.disclaimer}</p><small>Loaded from this device. This prototype does not send your design or request to VT yet.</small></section>}
    <div className="quote-progress"><span>Step {step} of 4</span><div><i style={{ width: `${step * 25}%` }}/></div></div>
    {step === 1 && <fieldset><legend>Your project</legend><p>What would you like us to help with?</p><div className="choice-grid">{projectTypes.map(type => <label key={type} className={project === type ? "selected" : ""}><input type="radio" name="project" value={type} checked={project === type} onChange={() => setProject(type)} required/>{type}</label>)}</div><label className="field">How many rooms or wardrobes?<input type="number" min="1" max="20" defaultValue="1" inputMode="numeric"/></label></fieldset>}
    {step === 2 && <fieldset><legend>Your space</legend><p>Approximate dimensions are helpful, but not required.</p><div className="field-grid"><label className="field">Suburb or postcode<input required autoComplete="postal-code" placeholder="e.g. Berwick 3806"/></label><label className="field">Property type<select defaultValue=""><option value="" disabled>Select one</option><option>House</option><option>Apartment</option><option>Townhouse</option><option>Other</option></select></label></div><div className="field-grid three"><label className="field">Width (mm)<input type="number" inputMode="numeric"/></label><label className="field">Height (mm)<input type="number" inputMode="numeric"/></label><label className="field">Depth (mm)<input type="number" inputMode="numeric"/></label></div><label className="field">Wall shape<select><option>Straight</option><option>L-shaped</option><option>U-shaped</option><option>Not sure</option></select></label><label className="field">Site notes<textarea rows={4} placeholder="Old wardrobe, skirting, cornice or access details"/></label></fieldset>}
    {step === 3 && <fieldset><legend>What you need</legend><p>Select any features you have in mind.</p><div className="choice-grid compact">{needs.map(need => <label key={need} className={selectedNeeds.includes(need) ? "selected" : ""}><input type="checkbox" checked={selectedNeeds.includes(need)} onChange={() => toggleNeed(need)}/>{need}</label>)}</div><div className="field-grid"><label className="field">Finish preference<select><option>Standard White</option><option>Solid colour — special order</option><option>Timber look — special order</option><option>Not sure</option></select></label><label className="field">Service<select><option>Measure and installation</option><option>Supply only</option><option>Not sure</option></select></label></div><label className="field upload">Project photos (optional)<input type="file" multiple accept="image/*"/><span>Upload photos of your room or existing wardrobe</span></label></fieldset>}
    {step === 4 && <fieldset><legend>Contact and timing</legend><p>Tell us how and when you would prefer to hear from us.</p><div className="field-grid"><label className="field">Name<input required autoComplete="name"/></label><label className="field">Phone<input required type="tel" inputMode="tel" autoComplete="tel"/></label></div><label className="field">Email<input required type="email" inputMode="email" autoComplete="email"/></label><div className="field-grid"><label className="field">Preferred contact<select><option>Phone</option><option>Email</option><option>Text message</option></select></label><label className="field">Preferred call time (optional)<select><option>No preference</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div><label className="field">Preferred measure day or time (optional)<input placeholder="e.g. Tuesday morning"/></label><label className="consent"><input required type="checkbox"/> I agree that VT Wardrobes may contact me about this request.</label></fieldset>}
    <div className="form-actions">{step > 1 && <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>Back</button>}<button className="button" type="submit">{step === 4 ? "Send my quote request" : "Continue"} <span>→</span></button></div>
  </form>;
}
