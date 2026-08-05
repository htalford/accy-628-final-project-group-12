import { redirect } from "next/navigation";

/** Legacy employer timesheets → Client Portal */
export default function EmployerTimesheetsRedirect() {
  redirect("/client/timesheets");
}
