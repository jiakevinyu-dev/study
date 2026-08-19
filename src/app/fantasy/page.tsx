import type { Metadata } from "next";
import { WarRoom } from "@/components/fantasy/war-room";

export const metadata: Metadata = {
  title: "Fantasy Football Redraft War Room",
  description:
    "A dynamic 12-team superflex PPR (no TE premium) redraft war room — live Sleeper sync, positional scarcity (VBD), injury-risk scoring, and strength-of-schedule grading.",
};

export default function FantasyWarRoomPage() {
  return <WarRoom />;
}
