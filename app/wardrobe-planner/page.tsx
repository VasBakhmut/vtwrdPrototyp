import type { Metadata } from "next";
import { PlannerStudio } from "@/components/planner-studio";
export const metadata:Metadata={title:"3D Wardrobe Planner | VT Wardrobes",description:"Visualise a custom wardrobe in 3D, see an indicative estimate and request a free professional measure across Melbourne."};
export default function PlannerPage(){return <PlannerStudio/>}
